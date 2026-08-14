import { useEffect, useState } from 'react';
import { db } from '@/database/db';
import type { Transaction } from '@/models';
import { deleteTransaction } from '@/services/transactions';
import { useNavigate } from 'react-router-dom';

export function Transactions() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Transaction[]>([]);
  const [names, setNames] = useState<Record<string,string>>({});

  async function refresh() {
  const [tx, transfers, accounts, categories] = await Promise.all([
    db.transactions.orderBy('dateTime').reverse().limit(100).toArray(),
    db.transfers.orderBy('dateTime').reverse().limit(100).toArray(),
    db.accounts.toArray(),
    db.categories.toArray()
  ]);

  const transferItems = transfers.map(t => ({
    id: t.id,
    accountId: t.fromAccountId,
    categoryId: '',
    personId: '',
    itemProfileId: '',
    description: '转账',
    amount: t.amount,
    flow: 'expense' as const,
    dateTime: t.dateTime,
    note: t.note ?? '',
    createdAt: t.createdAt ?? Date.now(),
    updatedAt: t.createdAt ?? Date.now()
  }));

  setItems(
    [...tx, ...transferItems]
      .sort((a,b)=>b.dateTime-a.dateTime)
  );

  setNames(
    Object.fromEntries(
      [...accounts,...categories].map(x=>[x.id,x.name])
    )
  );
}
  useEffect(() => { refresh(); }, []);

  async function remove(id: string) {
    if (!confirm('删除这条记录？')) return;
    await deleteTransaction(id);
    await refresh();
  }

  return <section>
    <header className="topbar"><h1>记录</h1><button className="text-btn" onClick={()=>navigate("/transfer")}>转账</button></header>
    <div className="list">
      {items.length === 0
        ? <div className="empty">还没有记录。点击下方 ＋ 开始。</div>
        : items.map(t =>
          <div className="transaction" key={t.id}>
            <div onClick={() => t.accountId && navigate(`/transactions/${t.id}/edit`)} role="button" tabIndex={0}>
              <strong>{t.description}</strong>
              <span>{names[t.categoryId] ?? '未分类'} · {new Date(t.dateTime).toLocaleDateString('zh-CN')}</span>
            </div>
            <div><b className={t.flow}>{t.flow === 'expense' ? '−' : '+'} ¥{t.amount.toFixed(2)}</b><button className="mini-delete" onClick={(e)=>{e.stopPropagation();remove(t.id)}}>删除</button></div>
          </div>
        )}
    </div>
  </section>;
}
