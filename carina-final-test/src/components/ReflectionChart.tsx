import type { ReflectionBreakdown, ReflectionTrendPoint } from '@/services/statistics';

type Props =
  | { mode: 'category' | 'account'; data: ReflectionBreakdown[]; selectedId?: string; onSelect: (id: string) => void }
  | { mode: 'trend'; data: ReflectionTrendPoint[]; selectedId?: string; onSelect: (id: string) => void };

function Donut({ data, selectedId, onSelect }: { data: ReflectionBreakdown[]; selectedId?: string; onSelect: (id: string) => void }) {
  const top = data.slice(0, 6);
  const total = top.reduce((sum, item) => sum + item.amount, 0);
  let cursor = 0;
  const segments = top.map((item, index) => {
    const start = cursor;
    cursor += total ? item.amount / total : 0;
    return { ...item, start, end: cursor, index };
  });
  const background = segments.length
    ? `conic-gradient(${segments.map((s) => `${['#8f6f37', '#6e836d', '#5b6878', '#a67c52', '#8b7d6b', '#6f6252'][s.index]} ${s.start * 100}% ${s.end * 100}%`).join(',')})`
    : 'rgba(168,135,74,.12)';

  return (
    <div className="reflection-donut-layout">
      <div className="reflection-donut" style={{ background }} aria-label="Spending distribution">
        <div className="reflection-donut-hole">
          <small>Total</small>
          <strong>¥{data.reduce((sum, item) => sum + item.amount, 0).toFixed(0)}</strong>
        </div>
      </div>
      <div className="reflection-breakdown-list">
        {data.length === 0 ? (
          <div className="empty"><span className="empty-script">A quiet month</span><p>No spending recorded yet.</p></div>
        ) : data.slice(0, 8).map((item) => (
          <button className={`reflection-breakdown-row ${selectedId === item.id ? 'selected' : ''}`} key={item.id} onClick={() => onSelect(item.id)}>
            <span><i className="reflection-swatch" />{item.name}</span>
            <strong>¥{item.amount.toFixed(2)}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function Trend({ data, selectedId, onSelect }: { data: ReflectionTrendPoint[]; selectedId?: string; onSelect: (id: string) => void }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.income, item.expense]));
  return (
    <div className="reflection-trend">
      <div className="reflection-trend-chart">
        {data.map((item) => (
          <button className={`reflection-trend-month ${selectedId === item.key ? 'selected' : ''}`} key={item.key} onClick={() => onSelect(item.key)} aria-label={`${item.label} trend`}>
            <div className="reflection-trend-bars">
              <span className="income" style={{ height: `${Math.max(3, item.income / max * 100)}%` }} />
              <span className="expense" style={{ height: `${Math.max(3, item.expense / max * 100)}%` }} />
            </div>
            <small>{item.label}</small>
          </button>
        ))}
      </div>
      <div className="trend-legend"><span><i className="income-dot" /> Income</span><span><i className="expense-dot" /> Expense</span></div>
    </div>
  );
}

export function ReflectionChart(props: Props) {
  if (props.mode === 'trend') return <Trend {...props} />;
  return <Donut {...props} />;
}
