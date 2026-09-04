import {db} from '@/database/db';
import {uid} from '@/utils/id';
import type {Settlement,Transaction} from '@/models';

export async function getPendingAdvances(personId:string){
  const rows=await db.transactions.toArray();
  return rows
    .filter(t=>t.kind==='advance'&&t.advanceStatus!=='settled'&&t.personId===personId)
    .sort((a,b)=>a.dateTime-b.dateTime);
}

export async function settleAdvances(i:{
  personId:string;
  transactionIds:string[];
  accountId:string;
  receivedAmount:number;
  dateTime?:number;
  differenceCategoryId?:string;
}){
  if(!i.transactionIds.length) throw new Error('至少选择一笔代付');
  if(!Number.isFinite(i.receivedAmount)||i.receivedAmount<0){
    throw new Error('收回金额无效');
  }

  const rows=await db.transactions.bulkGet(i.transactionIds);
  const selected=rows.filter((x):x is Transaction=>!!x);

  if(selected.length!==i.transactionIds.length){
    throw new Error('部分代付记录不存在');
  }

  if(selected.some(x=>
    x.kind!=='advance' ||
    x.advanceStatus==='settled' ||
    x.personId!==i.personId
  )){
    throw new Error('存在无效或已结算的代付记录');
  }

  const expectedAmount=selected.reduce((sum,x)=>sum+x.amount,0);
  const difference=i.receivedAmount-expectedAmount;
  const now=Date.now();
  const dateTime=i.dateTime??now;
  const settlementId=uid();

  await db.transaction(
    'rw',
    db.transactions,
    db.accounts,
    db.settlements,
    async()=>{
      /*
       * 1. 收回的本金进入收款账户。
       *    这是资金回流，不计入 Income。
       */
      if(i.receivedAmount>0){
        const reimbursement:Transaction={
          id:uid(),
          description:'代付结算本金',
          amount:i.receivedAmount,
          accountId:i.accountId,
          categoryId:'',
          personId:i.personId,
          flow:'income',
          dateTime,
          kind:'reimbursement',
          settlementId,
          createdAt:now,
          updatedAt:now,
        };

        await db.transactions.add(reimbursement);
      }

      /*
       * 2. 原代付 Expense 调整为最终实际损失。
       *
       *    收足本金：原代付变成 0
       *    少收：剩余差额保留在已结算代付中，继续作为 Expense
       *
       *    多笔代付时，先按选择顺序全部冲掉，
       *    未收回的差额留在最后一笔。
       */
      let remainingToRecover=Math.min(i.receivedAmount,expectedAmount);

      for(const x of selected){
        const unrecovered=Math.max(
          0,
          x.amount-Math.min(remainingToRecover,x.amount)
        );

        remainingToRecover=Math.max(0,remainingToRecover-x.amount);

        await db.transactions.update(x.id,{
          amount:unrecovered,
          advanceStatus:'settled',
          settlementId,
          updatedAt:now,
        });
      }

      /*
       * 3. 多收 / 少收的真正差额。
       */
      if(difference>0){
        if(!i.differenceCategoryId){
          throw new Error('多收差额需要选择收入分类');
        }

        const income:Transaction={
          id:uid(),
          description:'代付结算收益',
          amount:difference,
          accountId:i.accountId,
          categoryId:i.differenceCategoryId,
          personId:i.personId,
          flow:'income',
          dateTime,
          kind:'normal',
          settlementId,
          createdAt:now,
          updatedAt:now,
        };

        await db.transactions.add(income);
      }

      

      const settlement:Settlement={
        id:settlementId,
        personId:i.personId,
        transactionIds:i.transactionIds,
        accountId:i.accountId,
        expectedAmount,
        receivedAmount:i.receivedAmount,
        difference,
        differenceCategoryId:i.differenceCategoryId,
        dateTime,
        createdAt:now,
      };

      await db.settlements.add(settlement);
      await db.accounts.update(i.accountId,{lastUsedAt:now});
    }
  );

  return settlementId;
}
