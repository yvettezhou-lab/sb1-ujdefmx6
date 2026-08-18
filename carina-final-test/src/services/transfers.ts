import {db} from '@/database/db';import {uid} from '@/utils/id';export async function createTransfer(i:{fromAccountId:string;toAccountId:string;amount:number;dateTime?:number;note?:string}){if(i.fromAccountId===i.toAccountId)throw Error('转出和转入账户不能相同');if(i.amount<=0)throw Error('金额必须大于0');await db.transfers.add({id:uid(),...i,dateTime:i.dateTime??Date.now(),createdAt:Date.now()})}

export async function updateTransfer(
  id: string,
  patch: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    dateTime?: Date;
    note?: string;
  }
) {
  if (patch.fromAccountId === patch.toAccountId) {
    throw new Error('转出和转入账户不能相同');
  }

  if (patch.amount <= 0) {
    throw new Error('金额必须大于 0');
  }

  await db.transfers.update(id, {
    fromAccountId: patch.fromAccountId,
    toAccountId: patch.toAccountId,
    amount: patch.amount,
    dateTime: (patch.dateTime ?? new Date()).getTime(),
    note: patch.note ?? '',
  });
}
