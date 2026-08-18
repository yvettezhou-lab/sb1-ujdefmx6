import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/database/db';
import type { Account, Category, Transaction } from '@/models';
import { buildReflectionData, filterReflectionTransactions, type ReflectionMode } from '@/services/statistics';
import { ReflectionChart } from '@/components/ReflectionChart';

export function Reflection() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [mode, setMode] = useState<ReflectionMode>('category');
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    let alive = true;
    Promise.all([db.transactions.toArray(), db.categories.toArray(), db.accounts.toArray()]).then(([tx, cats, accts]) => {
      if (!alive) return;
      setTransactions(tx);
      setCategories(cats);
      setAccounts(accts);
    });

  const handleTrendDrillDown = (month: string) => {
    if (!month) return;
    // Keep the selected month as the drill-down target.
    // The existing transaction list/navigation should consume this selection.
    setSelectedId(month);
  };

    return () => { alive = false; };
  }, []);

  const data = useMemo(
    () => buildReflectionData(transactions, categories, accounts, year, month),
    [transactions, categories, accounts, year, month],
  );

  const title = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentList = mode === 'category' ? data.category : mode === 'account' ? data.account : data.trend;

  const selectedTransactions = useMemo(() => {
    if (!selectedId || mode === 'trend') return [];
    return filterReflectionTransactions(transactions, year, month, mode, selectedId);
  }, [transactions, year, month, mode, selectedId]);

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedId(undefined);
  }

  function selectMode(next: ReflectionMode) {
    setMode(next);
    setSelectedId(undefined);
  }

  function selectChart(id: string) {
    setSelectedId((current) => current === id ? undefined : id);
  }

  const selectedName = selectedId
    ? mode === 'category'
      ? data.category.find((item) => item.id === selectedId)?.name
      : mode === 'account'
        ? data.account.find((item) => item.id === selectedId)?.name
        : data.trend.find((item) => item.key === selectedId)?.label
    : undefined;

  return (
    <section>
      <header className="hero-head inner-head">
        <div><div className="script-title">Reflection</div><div className="brand-subtitle">A MONTH IN REVIEW</div></div>
        <div className="month-switch"><button onClick={() => shift(-1)} aria-label="Previous month">‹</button><span>{title}</span><button onClick={() => shift(1)} aria-label="Next month">›</button></div>
      </header>

      <div className="reflection-summary">
        <div><span>INCOME</span><strong className="positive">¥{data.income.toFixed(2)}</strong></div>
        <div><span>EXPENSE</span><strong>¥{data.expense.toFixed(2)}</strong></div>
        <div><span>NET FLOW</span><strong className={data.netFlow >= 0 ? 'positive' : 'negative'}>{data.netFlow >= 0 ? '+' : '−'} ¥{Math.abs(data.netFlow).toFixed(2)}</strong></div>
      </div>

      <div className="reflection-mode" role="tablist" aria-label="Reflection analysis">
        {([['category', 'Category'], ['account', 'Account'], ['trend', 'Trend']] as const).map(([value, label]) => (
          <button key={value} role="tab" aria-selected={mode === value} className={mode === value ? 'active' : ''} onClick={() => selectMode(value)}>{label}</button>
        ))}
      </div>

      <div className="paper-panel reflection-analysis">
        <div className="panel-kicker">{mode === 'category' ? 'WHERE YOUR LIFE FLOWS' : mode === 'account' ? 'WHERE MONEY MOVES' : 'THE LAST SIX MONTHS'}</div>
        <h2>{mode === 'category' ? 'Spending by category' : mode === 'account' ? 'Spending by account' : 'Money in motion'}</h2>
        <ReflectionChart mode={mode} data={currentList as never} selectedId={selectedId} onSelect={selectChart} />

        {selectedId && mode !== 'trend' && selectedTransactions.length > 0 && (
          <div className="reflection-drilldown">
            <div className="reflection-drilldown-head"><div><span className="panel-kicker">DRILL DOWN</span><strong>{selectedName}</strong></div><span>¥{selectedTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span></div>
            {selectedTransactions.slice(0, 6).map((transaction) => (
              <button className="reflection-transaction" key={transaction.id} onClick={() => navigate(`/transactions/${transaction.id}/edit`)}>
                <span><strong>{transaction.description || 'Untitled'}</strong><small>{new Date(transaction.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></span>
                <b>¥{transaction.amount.toFixed(2)}</b>
              </button>
            ))}
          </div>
        )}
        {selectedId && mode !== 'trend' && selectedTransactions.length === 0 && <div className="reflection-selection-note">No expense records in this selection.</div>}
      </div>

      <div className="reflection-note">
        <span className="script-caption">A small note</span>
        <p>{data.expense === 0 ? 'Every ledger has quiet pages.' : data.netFlow >= 0 ? 'A month in balance is worth remembering.' : 'Some months are for spending. The ledger simply remembers.'}</p>
      </div>
    </section>
  );
}


// Trend drill-down contract: a selected month is the navigation filter.
// Consumers can use this value to open the corresponding transaction list.
export const trendDrillDown = (month: string) => ({
  kind: 'trend-month',
  month,
});
