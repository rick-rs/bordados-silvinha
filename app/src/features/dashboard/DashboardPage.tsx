import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import {
  DashboardSummary,
  getDashboardSummary,
  RecentOrder,
} from '../../services/dashboard';
import { getSession } from '../../services/auth';

type Metric = {
  label: string;
  value: string;
  icon: string;
  tone: string;
};

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
      icon: '◷',
      tone: 'bg-blue-50 text-blue-600 ring-blue-100',
    },
    {
      label: 'Faturamento (Mês)',
      value: summary.metrics.monthly_revenue,
      icon: '▣',
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Pedidos Atrasados',
      value: String(summary.metrics.overdue_orders),
      icon: '△',
      tone: 'bg-rose-50 text-rose-600 ring-rose-100',
    },
    {
      label: 'Alertas de Estoque',
      value: String(summary.metrics.stock_alerts),
      icon: '◌',
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
  ];
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-6 py-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-xl text-frenchRose">
          ◌
        </div>
        <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = getSession();
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
          <Button className="min-h-11 w-full px-4 text-sm sm:min-h-9 sm:w-auto sm:self-auto sm:text-xs">
            + Nova Encomenda
          </Button>
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
              <article
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                key={metric.label}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ${metric.tone}`}
                  >
                    {metric.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-xl font-extrabold text-ink">{metric.value}</p>
                  </div>
                </div>
              </article>
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
                  className="grid gap-3 bg-rose-50/70 px-4 py-3 sm:grid-cols-[1fr_auto]"
                  key={deadline.id}
                >
                  <div>
                    <p className="text-sm font-extrabold text-ink">{deadline.order}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {deadline.description}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-extrabold text-frenchRose">
                      {deadline.status}
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
                  className="grid gap-1 sm:flex sm:items-center sm:justify-between sm:gap-4"
                  key={alert.id}
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
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
          <tr>
            <th className="px-4 py-3">Nº</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Prazo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Pgto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr className="bg-white" key={order.id}>
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
