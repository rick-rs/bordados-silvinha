import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { getSession } from '../../services/auth';

type Metric = {
  label: string;
  value: string;
  icon: string;
  tone: string;
};

type Deadline = {
  order: string;
  client: string;
  status: string;
  dueDate: string;
};

type StockAlert = {
  name: string;
  remaining: string;
};

type RecentOrder = {
  number: string;
  client: string;
  dueDate: string;
  status: string;
  payment: string;
};

const metrics: Metric[] = [
  {
    label: 'Pedidos em Andamento',
    value: '4',
    icon: '◷',
    tone: 'bg-blue-50 text-blue-600 ring-blue-100',
  },
  {
    label: 'Faturamento (Mês)',
    value: 'R$ 800,00',
    icon: '▣',
    tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  {
    label: 'Pedidos Atrasados',
    value: '4',
    icon: '△',
    tone: 'bg-rose-50 text-rose-600 ring-rose-100',
  },
  {
    label: 'Alertas de Estoque',
    value: '3',
    icon: '◌',
    tone: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
];

const deadlines: Deadline[] = [
  {
    order: '#001 - Maria Silva',
    client: '3x Toalha de banho',
    status: 'Prazo 25/03/2026',
    dueDate: 'Atrasado',
  },
  {
    order: '#002 - Clínica Sorriso',
    client: '10x Toalha de rosto',
    status: 'Prazo 24/03/2026',
    dueDate: 'Atrasado',
  },
  {
    order: '#003 - João Souza',
    client: '2x Fralda de boca, 2x Fralda de ombro',
    status: 'Prazo 23/03/2026',
    dueDate: 'Atrasado',
  },
  {
    order: '#005 - Fernanda Lima',
    client: '2x Fralda de boca, 1x Fralda de boca',
    status: 'Prazo 26/03/2026',
    dueDate: 'Atrasado',
  },
];

const stockAlerts: StockAlert[] = [
  { name: 'Linha Poliéster Preta', remaining: 'Apenas 3 cones (Min: 5)' },
  { name: 'Entretela Fina', remaining: 'Apenas 8 metros (Min: 10)' },
  { name: 'Linha Dourada Metálica', remaining: 'Apenas 2 cones (Min: 3)' },
];

const recentOrders: RecentOrder[] = [
  {
    number: '#005',
    client: 'Fernanda Lima',
    dueDate: '26/03/2026',
    status: 'Em Produção',
    payment: 'Parcial',
  },
  {
    number: '#003',
    client: 'João Souza',
    dueDate: '31/03/2026',
    status: 'Recebido',
    payment: 'Pendente',
  },
  {
    number: '#001',
    client: 'Maria Silva',
    dueDate: '27/03/2026',
    status: 'Em Produção',
    payment: 'Pago',
  },
  {
    number: '#002',
    client: 'Clínica Sorriso',
    dueDate: '24/03/2026',
    status: 'Aguardando Matriz',
    payment: 'Pendente',
  },
];

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

export function DashboardPage() {
  const user = getSession();

  if (!user) {
    return <Navigate replace to="/login" />;
  }

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

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink">Atenção aos Prazos</h2>
            </div>
            <div className="divide-y divide-rose-100">
              {deadlines.map((deadline) => (
                <div
                  className="grid gap-3 bg-rose-50/70 px-4 py-3 sm:grid-cols-[1fr_auto]"
                  key={deadline.order}
                >
                  <div>
                    <p className="text-sm font-extrabold text-ink">{deadline.order}</p>
                    <p className="mt-1 text-xs text-slate-600">{deadline.client}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-extrabold text-frenchRose">{deadline.dueDate}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{deadline.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink">Reposição de Estoque</h2>
            </div>
            <div className="grid gap-4 p-4">
              {stockAlerts.map((alert) => (
                <div
                  className="grid gap-1 sm:flex sm:items-center sm:justify-between sm:gap-4"
                  key={alert.name}
                >
                  <p className="text-sm font-semibold text-slate-700">{alert.name}</p>
                  <p className="text-xs font-extrabold text-frenchRose sm:text-right">
                    {alert.remaining}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Pedidos Recentes</h2>
          </div>
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
                {recentOrders.map((order) => (
                  <tr className="bg-white" key={order.number}>
                    <td className="px-4 py-3 font-extrabold text-frenchRose">{order.number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{order.client}</td>
                    <td className="px-4 py-3 text-slate-600">{order.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClassName(order.status)}`}>
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
        </section>
    </AppShell>
  );
}
