import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import { listOrders, Order } from '../../services/orders';

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(date);
}

function statusLabel(status: string) {
  if (status === 'Em Producao') {
    return 'Em Produção';
  }

  return status;
}

function statusClassName(status: string) {
  if (status === 'Cancelado') {
    return 'bg-rose-50 text-rose-700';
  }

  if (status === 'Entregue') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'Em Producao') {
    return 'bg-blue-50 text-blue-700';
  }

  return 'bg-chantilly/45 text-frenchRose';
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Array<Date | null> = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function AgendaPage() {
  const user = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAgenda() {
      try {
        const [ordersResponse, clientsResponse] = await Promise.all([
          listOrders(),
          listClients(),
        ]);

        if (isMounted) {
          setOrders(ordersResponse);
          setClients(clientsResponse);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar a agenda.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAgenda();

    return () => {
      isMounted = false;
    };
  }, []);

  const clientsById = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client]));
  }, [clients]);

  const ordersByDate = useMemo(() => {
    const groupedOrders = new Map<string, Order[]>();

    orders.forEach((order) => {
      if (!order.prazo) {
        return;
      }

      const currentOrders = groupedOrders.get(order.prazo) ?? [];
      groupedOrders.set(order.prazo, [...currentOrders, order]);
    });

    return groupedOrders;
  }, [orders]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const selectedDateKey = dateKey(selectedDate);
  const selectedOrders = ordersByDate.get(selectedDateKey) ?? [];
  const calendarDays = buildCalendarDays(visibleMonth);

  function changeMonth(amount: number) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1),
    );
  }

  return (
    <AppShell activePage="Agenda">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">Dashboard / Agenda</p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Agenda de Pedidos
        </h1>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <button
              aria-label="Mês anterior"
              className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100"
              onClick={() => changeMonth(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>

            <h2 className="text-sm font-extrabold text-ink">
              {monthNames[visibleMonth.getMonth()]} de {visibleMonth.getFullYear()}
            </h2>

            <button
              aria-label="Próximo mês"
              className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100"
              onClick={() => changeMonth(1)}
              type="button"
            >
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 px-2 py-2 text-center text-[11px] font-extrabold text-slate-400 sm:px-4">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-2 p-3 sm:p-4">
              {Array.from({ length: 35 }, (_, index) => (
                <div
                  className="aspect-square animate-pulse rounded-lg bg-slate-100"
                  key={index}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 p-3 sm:p-4">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div className="aspect-square" key={`empty-${index}`} />;
                }

                const key = dateKey(day);
                const dayOrders = ordersByDate.get(key) ?? [];
                const isSelected = key === selectedDateKey;
                const hasOrders = dayOrders.length > 0;

                return (
                  <button
                    className={[
                      'relative aspect-square rounded-lg border text-sm font-bold transition',
                      isSelected
                        ? 'border-frenchRose bg-chantilly/50 text-frenchRose shadow-sm'
                        : 'border-transparent text-slate-600 hover:bg-slate-100',
                      hasOrders && !isSelected
                        ? 'bg-illusion/25 text-frenchRose'
                        : '',
                    ].join(' ')}
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    type="button"
                  >
                    {day.getDate()}
                    {hasOrders ? (
                      <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                        {dayOrders.slice(0, 3).map((order) => (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-frenchRose"
                            key={order.id}
                          />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </article>

        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-mauve">
              {formatLongDate(selectedDate)}
            </p>
            <h2 className="text-sm font-extrabold text-ink">
              Detalhes do Dia
            </h2>
          </div>

          {selectedOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {selectedOrders.map((order) => {
                const client = clientsById.get(order.cliente);

                return (
                  <div className="grid gap-2 px-4 py-4" key={order.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-frenchRose">
                          #{String(order.id).padStart(3, '0')}
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-ink">
                          {client?.nome ?? 'Cliente não identificado'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusClassName(
                          order.status,
                        )}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    {order.observacoes ? (
                      <p className="text-xs leading-relaxed text-slate-600">
                        {order.observacoes}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-frenchRose">
                  <Inbox aria-hidden className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-600">
                  Nenhum pedido neste dia.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Selecione outro dia para ver os prazos agendados.
                </p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </AppShell>
  );
}
