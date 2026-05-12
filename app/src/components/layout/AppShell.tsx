import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { clearSession } from '../../services/auth';

type AppShellProps = {
  activePage: string;
  children: ReactNode;
};

type NavItem = {
  label: string;
  icon: string;
  path: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '▦', path: '/dashboard' },
  { label: 'Agenda', icon: '◷', path: '/agenda' },
  { label: 'Pedidos', icon: '▤', path: '/pedidos' },
  { label: 'Clientes', icon: '◉', path: '/clientes' },
  { label: 'Catálogo', icon: '◇', path: '/catalogo' },
  { label: 'Estoque', icon: '▣', path: '/estoque' },
];

export function AppShell({ activePage, children }: AppShellProps) {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <Link className="text-sm font-extrabold text-frenchRose" to="/dashboard">
          BordadosApp
        </Link>
        <button
          className="rounded-md px-3 py-2 text-xs font-bold text-frenchRose hover:bg-chantilly/35"
          onClick={handleLogout}
          type="button"
        >
          Sair
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-40 border-r border-slate-200 bg-white md:flex md:flex-col">
        <Link
          className="flex h-14 items-center px-4 text-sm font-extrabold text-frenchRose"
          to="/dashboard"
        >
          BordadosApp
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          {navItems.map((item) => (
            <NavLink
              className={[
                'flex h-9 items-center gap-2 rounded-md px-3 text-left text-xs font-semibold transition',
                activePage === item.label
                  ? 'bg-chantilly/45 text-frenchRose'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
              ].join(' ')}
              key={item.label}
              to={item.path}
            >
              <span className="w-4 text-center text-sm">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-2">
          <NavLink
            className={[
              'mb-2 flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold transition',
              activePage === 'Perfil'
                ? 'bg-chantilly/45 text-frenchRose'
                : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
            ].join(' ')}
            to="/perfil"
          >
            <span className="w-4 text-center text-sm">◌</span>
            Perfil
          </NavLink>

          <button
            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold text-frenchRose hover:bg-chantilly/35"
            onClick={handleLogout}
            type="button"
          >
            <span className="w-4 text-center text-sm">↳</span>
            Sair
          </button>
        </div>
      </aside>

      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-5 sm:px-5 md:ml-40 md:px-8 md:pb-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[...navItems, { label: 'Perfil', icon: '◌', path: '/perfil' }].map(
            (item) => (
              <NavLink
                className={[
                  'flex min-w-20 flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-[11px] font-bold transition',
                  activePage === item.label
                    ? 'bg-chantilly/55 text-frenchRose'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
                ].join(' ')}
                key={item.label}
                to={item.path}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </div>
      </nav>
    </div>
  );
}
