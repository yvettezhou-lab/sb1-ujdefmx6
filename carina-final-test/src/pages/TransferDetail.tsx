import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/database/db';
import type { Account, Transfer } from '@/models';
import { evaluateAmountExpression } from '@/utils/amount';

export function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [t, a] = await Promise.all([
        db.transfers.get(id),
        db.accounts.toArray(),
      ]);
      if (!t) return;
      const visibleAccounts = a.filter(x => !x.isArchived || x.id === t.fromAccountId || x.id === t.toAccountId)
        .sort((x, y) => x.sortOrder - y.sortOrder);
      setTransfer(t);
      setAccounts(visibleAccounts);
      setFromAccountId(t.fromAccountId);
      setToAccountId(t.toAccountId);
      setAmount(String(t.amount));
      setDateTime(new Date(t.dateTime).toISOString().slice(0, 16));
      setNote(t.note ?? '');
    })();
  }, [id]);

  async function save() {
    if (!transfer) return;
    const n = evaluateAmountExpression(amount);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || !Number.isFinite(n) || n <= 0) return;

    setSaving(true);
    try {
      await db.transfers.update(transfer.id, {
        fromAccountId,
        toAccountId,
        amount: n,
        dateTime: dateTime ? new Date(dateTime).getTime() : transfer.dateTime,
        note: note.trim() || undefined,
      });
      navigate('/transactions', { replace: true });
    } finally {
      setSaving(false);
    }
  }

  if (!transfer) {
    return (
      <section>
        <header className="topbar">
          <button className="text-btn" onClick={() => navigate(-1)}>返回</button>
          <h1>编辑转账</h1>
        </header>
        <div className="empty">转账记录不存在</div>
      </section>
    );
  }

  return (
    <section>
      <header className="topbar">
        <button className="text-btn" onClick={() => navigate(-1)}>返回</button>
        <h1>编辑转账</h1>
        <button className="text-btn" onClick={save} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </header>

      <div className="quick-form">
        <label>
          转出账户
          <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.isArchived ? '（已归档）' : ''}</option>)}
          </select>
        </label>

        <label>
          转入账户
          <select value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.isArchived ? '（已归档）' : ''}</option>)}
          </select>
        </label>

        <label>
          金额
          <input
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.+\-*/×÷()\s]/g, ''))}
            inputMode="decimal"
          />
        </label>

        <label>
          日期时间
          <input
            type="datetime-local"
            value={dateTime}
            onChange={e => setDateTime(e.target.value)}
          />
        </label>

        <label>
          备注
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="可选" />
        </label>

        <button className="primary" disabled={saving} onClick={save}>
          {saving ? '保存中…' : '保存修改'}
        </button>
      </div>
    </section>
  );
}
