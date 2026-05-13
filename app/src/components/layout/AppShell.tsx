import type { ReactNode } from 'react';
import {
  Boxes,
  CalendarDays,
  CircleUser,
  ClipboardList,
  Images,
  LayoutDashboard,
  LogOut,
  Scissors,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { clearSession } from '../../services/auth';

type AppShellProps = {
  activePage: string;
  children: ReactNode;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  path: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Agenda', icon: CalendarDays, path: '/agenda' },
  { label: 'Pedidos', icon: ClipboardList, path: '/pedidos' },
  { label: 'Clientes', icon: Users, path: '/clientes' },
  { label: 'Catálogo', icon: Images, path: '/catalogo' },
  { label: 'Estoque', icon: Boxes, path: '/estoque' },
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
          <span className="inline-flex items-center gap-2">
            <Scissors aria-hidden className="h-4 w-4" />
            BordadosApp
          </span>
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
          className="flex h-14 items-center gap-2 px-4 text-sm font-extrabold text-frenchRose"
          to="/dashboard"
        >
          <Scissors aria-hidden className="h-4 w-4" />
          BordadosApp
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          {navItems.map((item) => (
            <NavItemLink
              active={activePage === item.label}
              item={item}
              key={item.label}
            />
          ))}
        </nav>

        <div className="border-t border-slate-100 p-2">
          <NavItemLink
            active={activePage === 'Perfil'}
            item={{ label: 'Perfil', icon: CircleUser, path: '/perfil' }}
          />

          <button
            className="mt-2 flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold text-frenchRose hover:bg-chantilly/35"
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 pb-28 pt-5 sm:px-5 md:px-8 md:pb-8 md:pl-48">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[...navItems, { label: 'Perfil', icon: CircleUser, path: '/perfil' }].map(
            (item) => {
              const Icon = item.icon;

              return (
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
                  <Icon aria-hidden className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            },
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItemLink({ active, item }: { active: boolean; item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      className={[
        'flex h-9 items-center gap-2 rounded-md px-3 text-left text-xs font-semibold transition',
        active
          ? 'bg-chantilly/45 text-frenchRose'
          : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
      ].join(' ')}
      to={item.path}
    >
      <Icon aria-hidden className="h-4 w-4" />
      {item.label}
    </NavLink>
  );
}
