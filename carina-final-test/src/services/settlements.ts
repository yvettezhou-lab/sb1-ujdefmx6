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
  if(!Number.isFinite(i.receivedAmount)||i.receivedAmount<0) throw new Error('收回金额无效');

  const rows=await db.transactions.bulkGet(i.transactionIds);
  const selected=rows.filter((x):x is Transaction=>!!x);

  if(selected.length!==i.transactionIds.length) throw new Error('部分代付记录不存在');
  if(selected.some(x=>x.kind!=='advance'||x.advanceStatus==='settled'||x.personId!==i.personId)){
    throw new Error('存在无效或已结算的代付记录');
  }

  const expectedAmount=selected.reduce((sum,x)=>sum+x.amount,0);
  const difference=i.receivedAmount-expectedAmount;
  const now=Date.now();
  const dateTime=i.dateTime??now;
  const settlementId=uid();

  await db.transaction('rw',db.transactions,db.accounts,db.settlements,async()=>{
    const reimbursement:Transaction={
      id:uid(),
      description:'代付结算本金',
      amount:expectedAmount,
      accountId:i.accountId,
      categoryId:'',
      personId:i.personId,
      flow:'income',
      dateTime,
      note:undefined,
      kind:'reimbursement',
      settlementId,
      createdAt:now,
      updatedAt:now,
    };
    await db.transactions.add(reimbursement);

    if(difference>0){
      if(!i.differenceCategoryId) throw new Error('多收差额需要选择收入分类');
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
    }else if(difference<0){
      if(!i.differenceCategoryId) throw new Error('少收差额需要选择支出分类');
      const expense:Transaction={
        id:uid(),
        description:'代付结算损失',
        amount:Math.abs(difference),
        accountId:i.accountId,
        categoryId:i.differenceCategoryId,
        personId:i.personId,
        flow:'expense',
        dateTime,
        kind:'normal',
        settlementId,
        createdAt:now,
        updatedAt:now,
      };
      await db.transactions.add(expense);
    }

    for(const x of selected){
      await db.transactions.update(x.id,{
        advanceStatus:'settled',
        settlementId,
        updatedAt:now
      });
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
  });

  return settlementId;
}
