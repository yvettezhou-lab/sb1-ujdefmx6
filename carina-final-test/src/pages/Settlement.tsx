import { useEffect, useState } from 'react';
import { db } from '@/database/db';
import type { Account, Category, Person, Transaction } from '@/models';
import { getPendingAdvances, settleAdvances } from '@/services/settlements';

export function Settlement() {
  const [people, setPeople] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [advances, setAdvances] = useState<Transaction[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [accountId, setAccountId] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const [p, a, c] = await Promise.all([
        db.people.filter(x => !x.isArchived).sortBy('sortOrder'),
        db.accounts.filter(x => !x.isArchived).sortBy('sortOrder'),
        db.categories.filter(x => !x.isArchived).sortBy('sortOrder'),
      ]);

      setPeople(p);
      setAccounts(a);
      setCategories(c);

      if (p[0]) setSelectedPersonId(p[0].id);
      if (a[0]) setAccountId(a[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedPersonId) {
      setAdvances([]);
      setSelectedIds([]);
      return;
    }

    (async () => {
      const rows = await getPendingAdvances(selectedPersonId);
      setAdvances(rows);
      setSelectedIds([]);
      setMessage('');
    })();
  }, [selectedPersonId]);

  const selected = advances.filter(x => selectedIds.includes(x.id));
  const expectedAmount = selected.reduce((sum, x) => sum + x.amount, 0);
  const received = Number(receivedAmount);
  const difference =
    Number.isFinite(received) && receivedAmount !== ''
      ? received - expectedAmount
      : 0;

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleSettle = async () => {
    if (!selectedPersonId) {
      setMessage('请选择人物');
      return;
    }

    if (!selectedIds.length) {
      setMessage('至少选择一笔代付');
      return;
    }

    if (!accountId) {
      setMessage('请选择收款账户');
      return;
    }

    if (!Number.isFinite(received) || received < 0) {
      setMessage('请输入有效的收回金额');
      return;
    }

    try {
      await settleAdvances({
        personId: selectedPersonId,
        transactionIds: selectedIds,
        accountId,
        receivedAmount: received,
        dateTime: Date.now(),
      });

      setReceivedAmount('');
      const rows = await getPendingAdvances(selectedPersonId);
      setAdvances(rows);
      setSelectedIds([]);
      setMessage('结算完成');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '结算失败');
    }
  };

  return (
    <section>
      <header className="hero-head inner-head">
        <div>
          <div className="script-title">Settlement</div>
          <div className="brand-subtitle">ADVANCE RECOVERY</div>
        </div>
      </header>

      <div className="settings-intro" style={{ marginBottom: 16 }}>
        <strong>代付结算</strong>
        <p>选择一笔或多笔代付，输入实际收回金额和收款账户。</p>
      </div>

      <div className="settings-form">
        <label>
          人物
          <select
            value={selectedPersonId}
            onChange={e => setSelectedPersonId(e.target.value)}
          >
            <option value="">请选择人物</option>
            {people.map(person => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginTop: 16 }}>
          <strong>待结算代付</strong>

          {advances.length === 0 ? (
            <p style={{ marginTop: 10 }}>暂无待结算代付。</p>
          ) : (
            <div style={{ marginTop: 10 }}>
              {advances.map(item => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(0,0,0,.08)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span style={{ flex: 1 }}>
                    {item.description}
                  </span>
                  <strong>¥{item.amount.toFixed(2)}</strong>
                  <small>
                    {new Date(item.dateTime).toLocaleDateString('zh-CN')}
                  </small>
                </label>
              ))}
            </div>
          )}
        </div>

        <label style={{ marginTop: 16 }}>
          收款账户
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
          >
            <option value="">请选择账户</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginTop: 16 }}>
          实际收回金额
          <input
            inputMode="decimal"
            value={receivedAmount}
            onChange={e =>
              setReceivedAmount(
                e.target.value.replace(/[^\d.+-]/g, '')
              )
            }
            placeholder="0.00"
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <div>应收本金：¥{expectedAmount.toFixed(2)}</div>
          <div>实际收回：¥{Number.isFinite(received) && receivedAmount !== '' ? received.toFixed(2) : '0.00'}</div>
          <div>
            差额：
            <strong>
              {difference >= 0 ? '+' : '-'}¥{Math.abs(difference).toFixed(2)}
            </strong>
          </div>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={handleSettle}
          disabled={!selectedIds.length || !accountId || receivedAmount === ''}
          style={{ marginTop: 18 }}
        >
          完成结算
        </button>

        {message && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
