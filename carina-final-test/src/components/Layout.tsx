import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Sparkles } from 'lucide-react';
import QuillIcon from '@/components/QuillIcon';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/transactions', label: 'Ledger', icon: BookOpen },
  { to: '/reflection', label: 'Reflection', icon: QuillIcon },
  { to: '/settings', label: 'Atelier', icon: Sparkles },
];

export function Layout() {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <main className="page"><Outlet /></main>
      <button className="fab" aria-label="Record a transaction" title="Record" onClick={() => navigate('/quick-entry')}>
        <QuillIcon size={23} strokeWidth={1.65} />
      </button>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({to,label,icon:Icon}) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon size={19} strokeWidth={1.7} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
