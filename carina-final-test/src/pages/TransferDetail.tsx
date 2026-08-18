import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/database/db';
import { updateTransfer } from '@/services/transfers';

export function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [allAccounts, transfer] = await Promise.all([
        db.accounts.toArray(),
        id ? db.transfers.get(id) : undefined,
      ]);

      setAccounts(allAccounts);

      if (transfer) {
        setFromAccountId(transfer.fromAccountId ?? '');
        setToAccountId(transfer.toAccountId ?? '');
        setAmount(String(transfer.amount ?? ''));
        setNote(transfer.note ?? '');

        const d = transfer.dateTime ?? transfer.createdAt;
        if (d) {
          const dt = new Date(d);
          const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
          setDateTime(local.toISOString().slice(0, 16));
        }
      }

      setLoading(false);
    })();
  }, [id]);

  async function save() {
    if (!id || !fromAccountId || !toAccountId || !amount) return;
    if (fromAccountId === toAccountId) return;

    setSaving(true);

    await updateTransfer(id, {
      fromAccountId,
      toAccountId,
      amount: Number(amount),
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      note: note.trim(),
    });

    navigate('/transactions', { replace: true });
  }

  if (loading) {
    return <div className="page">Loading…</div>;
  }

  return (
    <main className="page">
      <header className="topbar">
        <button className="text-btn" onClick={() => navigate(-1)}>返回</button>
        <h1>编辑转账</h1>
        <button className="text-btn" onClick={save} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </header>

      <section className="quick-form">
        <label>
          转出账户
          <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)}>
            <option value="">请选择</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>

        <label>
          转入账户
          <select value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
            <option value="">请选择</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>

        <label>
          金额
          <input
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
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
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </label>
      </section>
    </main>
  );
}
