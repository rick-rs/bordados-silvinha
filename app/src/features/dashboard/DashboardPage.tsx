import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Clock,
  Inbox,
  PackageX,
  Plus,
  TriangleAlert,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { getSession } from '../../services/auth';
import {
  DashboardSummary,
  getDashboardSummary,
  RecentOrder,
} from '../../services/dashboard';

type Metric = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
};

type RecentSortKey = keyof Pick<
  RecentOrder,
  'number' | 'client' | 'due_date' | 'status' | 'payment'
>;
type SortDirection = 'asc' | 'desc' | null;
type RecentSortState = {
  key: RecentSortKey | null;
  direction: SortDirection;
};
const recentOrdersSortStorageKey = 'bordados:dashboard-recent-sort';

const recentOrderColumns: Array<{ key: RecentSortKey; label: string }> = [
  { key: 'number', label: 'Nº' },
  { key: 'client', label: 'Cliente' },
  { key: 'due_date', label: 'Prazo' },
  { key: 'status', label: 'Status' },
  { key: 'payment', label: 'Pgto' },
];

function getInitialRecentSort(): RecentSortState {
  const storedValue = window.localStorage.getItem(recentOrdersSortStorageKey);

  if (!storedValue) {
    return { key: null, direction: null };
  }

  try {
    const parsedValue = JSON.parse(storedValue) as RecentSortState;

    if (
      parsedValue.key &&
      ['number', 'client', 'due_date', 'status', 'payment'].includes(parsedValue.key) &&
      (parsedValue.direction === 'asc' || parsedValue.direction === 'desc')
    ) {
      return parsedValue;
    }
  } catch {
    return { key: null, direction: null };
  }

  return { key: null, direction: null };
}

function statusClassName(status: string) {
  if (status === 'Em Produção') {
    return 'bg-blue-50 text-blue-700';
  }

  if (status === 'Aguardando Matriz') {
    return 'bg-purple-50 text-purple-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function paymentClassName(payment: string) {
  if (payment === 'Pago') {
    return 'text-emerald-600';
  }

  if (payment === 'Parcial') {
    return 'text-amber-600';
  }

  return 'text-orange-500';
}

function buildMetrics(summary: DashboardSummary): Metric[] {
  return [
    {
      label: 'Pedidos em Andamento',
      value: String(summary.metrics.orders_in_progress),
      icon: Clock,
      tone: 'bg-blue-50 text-blue-600 ring-blue-100',
    },
    {
      label: 'Faturamento (Mês)',
      value: summary.metrics.monthly_revenue,
      icon: WalletCards,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Pedidos Atrasados',
      value: String(summary.metrics.overdue_orders),
      icon: TriangleAlert,
      tone: 'bg-rose-50 text-rose-600 ring-rose-100',
    },
    {
      label: 'Alertas de Estoque',
      value: String(summary.metrics.stock_alerts),
      icon: PackageX,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
  ];
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-6 py-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-frenchRose">
          <Inbox aria-hidden className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ${metric.tone}`}
        >
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
          <p className="mt-1 text-xl font-extrabold text-ink">{metric.value}</p>
        </div>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const dashboardSummary = await getDashboardSummary();

        if (isMounted) {
          setSummary(dashboardSummary);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o dashboard.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const metrics = summary ? buildMetrics(summary) : [];

  return (
    <AppShell activePage="Dashboard">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">Olá, {user.nome}</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Dashboard
          </h1>
        </div>
        <Link
          className={[
            'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition',
            'hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg',
            'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-froly/30',
            'sm:min-h-9 sm:w-auto sm:self-auto sm:text-xs',
          ].join(' ')}
          to="/pedidos/novo"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Nova Encomenda
        </Link>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <article
              className="h-[74px] animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              key={item}
            />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>
      )}

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Atenção aos Prazos</h2>
          </div>
          {summary && summary.deadline_alerts.length > 0 ? (
            <div className="divide-y divide-rose-100">
              {summary.deadline_alerts.map((deadline) => (
                <div
                  className="grid cursor-pointer gap-3 bg-rose-50/70 px-4 py-3 transition hover:bg-rose-100/70 sm:grid-cols-[1fr_auto]"
                  key={deadline.id}
                  onClick={() => navigate(`/pedidos/${deadline.id}`)}
                >
                  <div>
                    <p className="text-sm font-extrabold text-ink">{deadline.order}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {deadline.description}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-extrabold text-frenchRose">
                      {deadline.overdue_days === 1
                        ? 'Atrasado 1 dia'
                        : `Atrasado ${deadline.overdue_days} dias`}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {deadline.due_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Nenhum prazo atrasado por enquanto." />
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Reposição de Estoque</h2>
          </div>
          {summary && summary.stock_replacements.length > 0 ? (
            <div className="grid gap-4 p-4">
              {summary.stock_replacements.map((alert) => (
                <div
                  className="grid cursor-pointer gap-1 rounded-lg px-2 py-1 transition hover:bg-chantilly/20 sm:flex sm:items-center sm:justify-between sm:gap-4"
                  key={alert.id}
                  onClick={() => navigate(`/estoque/${alert.id}`)}
                >
                  <p className="text-sm font-semibold text-slate-700">{alert.name}</p>
                  <p className="text-xs font-extrabold text-frenchRose sm:text-right">
                    {alert.remaining}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Nenhum alerta de estoque no momento." />
          )}
        </article>
      </section>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-extrabold text-ink">Pedidos Recentes</h2>
        </div>
        {summary && summary.recent_orders.length > 0 ? (
          <RecentOrdersTable orders={summary.recent_orders} />
        ) : (
          <EmptyState label="Nenhum pedido recente para exibir." />
        )}
      </section>
    </AppShell>
  );
}

function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  const navigate = useNavigate();
  const [sortState, setSortState] = useState<RecentSortState>(
    getInitialRecentSort,
  );

  useEffect(() => {
    if (!sortState.key || !sortState.direction) {
      window.localStorage.removeItem(recentOrdersSortStorageKey);
      return;
    }

    window.localStorage.setItem(
      recentOrdersSortStorageKey,
      JSON.stringify(sortState),
    );
  }, [sortState]);

  const sortedOrders = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return orders;
    }

    const sortKey = sortState.key;

    return [...orders].sort((leftOrder, rightOrder) => {
      const leftValue = leftOrder[sortKey];
      const rightValue = rightOrder[sortKey];
      const comparison = leftValue.localeCompare(rightValue, 'pt-BR', {
        numeric: true,
      });

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [orders, sortState]);

  function updateSort(key: RecentSortKey) {
    setSortState((currentState) => {
      if (currentState.key !== key) {
        return { key, direction: 'asc' };
      }

      if (currentState.direction === 'asc') {
        return { key, direction: 'desc' };
      }

      return { key: null, direction: null };
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
          <tr>
            {recentOrderColumns.map((column) => (
              <th className="px-4 py-3" key={column.key}>
                <button
                  className="inline-flex items-center gap-1 transition hover:text-ink"
                  onClick={() => updateSort(column.key)}
                  title="Ordenar coluna"
                  type="button"
                >
                  {column.label}
                  <ArrowUpDown aria-hidden className="h-3.5 w-3.5" />
                  {sortState.key === column.key && sortState.direction ? (
                    <span className="text-[10px] text-frenchRose">
                      {sortState.direction === 'asc' ? 'ASC' : 'DESC'}
                    </span>
                  ) : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedOrders.map((order) => (
            <tr
              className="cursor-pointer bg-white transition hover:bg-chantilly/20"
              key={order.id}
              onClick={() => navigate(`/pedidos/${order.id}`)}
            >
              <td className="px-4 py-3 font-extrabold text-frenchRose">
                {order.number}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {order.client}
              </td>
              <td className="px-4 py-3 text-slate-600">{order.due_date}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${statusClassName(
                    order.status,
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className={`px-4 py-3 font-bold ${paymentClassName(order.payment)}`}>
                {order.payment}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
