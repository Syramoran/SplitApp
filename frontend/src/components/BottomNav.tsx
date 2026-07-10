import { NavLink, useNavigate } from 'react-router-dom';

/** Navegación inferior del prototipo: 4 ítems + FAB central de quick-add. */
export function BottomNav() {
  const navigate = useNavigate();
  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '');

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={linkClass}>
        <svg viewBox="0 0 24 24">
          <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
        Inicio
      </NavLink>
      <NavLink to="/groups" className={linkClass}>
        <svg viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="3.2" />
          <circle cx="16.5" cy="10" r="2.4" />
          <path d="M3.5 19c.6-3 2.8-4.7 5.5-4.7S13.9 16 14.5 19M15 19c.3-1.8 1.4-3 3-3s2.7 1.2 3 3" />
        </svg>
        Gastos
      </NavLink>
      <div style={{ width: 64 }} />
      <NavLink to="/insights" className={linkClass}>
        <svg viewBox="0 0 24 24">
          <path d="M4 19V9M10 19V4M16 19v-7M21 19H3" />
        </svg>
        Insights
      </NavLink>
      <NavLink to="/profile" className={linkClass}>
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        </svg>
        Perfil
      </NavLink>
      <button className="fab" onClick={() => navigate('/add')} aria-label="Agregar gasto">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </nav>
  );
}
