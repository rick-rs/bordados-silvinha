import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Pencil } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import { listOrders, Order } from '../../services/orders';

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
type CalendarView = 'month' | 'week';

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

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
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

function buildWeekDays(referenceDate: Date) {
  const startOfWeek = new Date(referenceDate);
  startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);

    return day;
  });
}

export function AgendaPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
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
  const currentWeekDays = buildWeekDays(selectedDate);
  const currentWeekKeys = currentWeekDays.map((day) => dateKey(day));
  const weeklyOrders = currentWeekKeys.flatMap((key) => ordersByDate.get(key) ?? []);
  const calendarDays =
    calendarView === 'month' ? buildCalendarDays(visibleMonth) : currentWeekDays;
  const todayKey = dateKey(new Date());
  const periodTitle =
    calendarView === 'month'
      ? `${monthNames[visibleMonth.getMonth()]} de ${visibleMonth.getFullYear()}`
      : `${formatShortDate(currentWeekDays[0])} a ${formatShortDate(
          currentWeekDays[6],
        )}`;

  function changePeriod(amount: number) {
    if (calendarView === 'month') {
      setVisibleMonth(
        (currentMonth) =>
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1),
      );
      return;
    }

    setSelectedDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + amount * 7);
      setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));

      return nextDate;
    });
  }

  function selectDate(day: Date) {
    setSelectedDate(day);
    setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  function showEditPlaceholder() {
    window.alert('A edição será implementada em uma próxima etapa.');
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
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-grid min-h-10 grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-extrabold text-slate-500">
              <button
                className={[
                  'rounded-md px-4 transition',
                  calendarView === 'week'
                    ? 'bg-white text-frenchRose shadow-sm'
                    : 'hover:text-ink',
                ].join(' ')}
                onClick={() => setCalendarView('week')}
                type="button"
              >
                Semana
              </button>
              <button
                className={[
                  'rounded-md px-4 transition',
                  calendarView === 'month'
                    ? 'bg-white text-frenchRose shadow-sm'
                    : 'hover:text-ink',
                ].join(' ')}
                onClick={() => setCalendarView('month')}
                type="button"
              >
                Mês
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 sm:min-w-64">
              <button
                aria-label={calendarView === 'month' ? 'Mês anterior' : 'Semana anterior'}
                className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100"
                onClick={() => changePeriod(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden className="h-5 w-5" />
              </button>

              <h2 className="text-center text-sm font-extrabold text-ink">
                {periodTitle}
              </h2>

              <button
                aria-label={calendarView === 'month' ? 'Próximo mês' : 'Próxima semana'}
                className="grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100"
                onClick={() => changePeriod(1)}
                type="button"
              >
                <ChevronRight aria-hidden className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 px-4 py-2">
            <button
              className="text-xs font-bold text-frenchRose transition hover:text-froly"
              onClick={() => selectDate(new Date())}
              type="button"
            >
              Hoje
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 px-2 py-2 text-center text-[11px] font-extrabold text-slate-400 sm:px-4">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-2 p-3 sm:p-4">
              {Array.from(
                { length: calendarView === 'month' ? 35 : 7 },
                (_, index) => (
                <div
                  className={[
                    'animate-pulse rounded-lg bg-slate-100',
                    calendarView === 'week' ? 'h-24 sm:h-28' : 'aspect-square',
                  ].join(' ')}
                  key={index}
                />
                ),
              )}
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
                const isToday = key === todayKey;
                const hasOrders = dayOrders.length > 0;

                return (
                  <button
                    className={[
                      'relative rounded-lg border text-sm font-bold transition',
                      calendarView === 'week'
                        ? 'flex h-24 flex-col items-center justify-center gap-2 sm:h-28'
                        : 'aspect-square',
                      isSelected
                        ? 'border-frenchRose bg-chantilly/50 text-frenchRose shadow-sm'
                        : 'border-transparent text-slate-600 hover:bg-slate-100',
                      isToday && !isSelected
                        ? 'border-froly bg-white text-frenchRose ring-2 ring-froly/15'
                        : '',
                      hasOrders && !isSelected
                        ? 'bg-illusion/25 text-frenchRose'
                        : '',
                    ].join(' ')}
                    key={key}
                    onClick={() => selectDate(day)}
                    type="button"
                  >
                    <span>{day.getDate()}</span>
                    {isToday ? (
                      <span
                        className={[
                          'rounded-full border border-froly/30 bg-white px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-froly shadow-sm',
                          calendarView === 'month'
                            ? 'absolute left-1/2 top-1 -translate-x-1/2 sm:top-2'
                            : '',
                        ].join(' ')}
                      >
                        Hoje
                      </span>
                    ) : null}
                    {hasOrders ? (
                      <span
                        className={[
                          'flex gap-1',
                          calendarView === 'month'
                            ? 'absolute bottom-2 left-1/2 -translate-x-1/2'
                            : '',
                        ].join(' ')}
                      >
                        {dayOrders.slice(0, 3).map((order) => (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-frenchRose"
                            key={order.id}
                          />
                        ))}
                        {dayOrders.length > 3 ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-froly/60" />
                        ) : null}
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
              Semana {formatShortDate(currentWeekDays[0])} - {formatShortDate(currentWeekDays[6])}
            </p>
            <h2 className="text-sm font-extrabold text-ink">
              Resumo da Semana
            </h2>
          </div>

          <div className="grid gap-2 border-b border-slate-100 p-4">
            <div className="flex items-center justify-between rounded-lg bg-chantilly/25 px-3 py-2">
              <span className="text-xs font-bold text-slate-600">Pedidos na semana</span>
              <span className="text-sm font-extrabold text-frenchRose">
                {weeklyOrders.length}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {currentWeekDays.map((day) => {
                const key = dateKey(day);
                const dayOrders = ordersByDate.get(key) ?? [];
                const isSelected = key === selectedDateKey;
                const isToday = key === todayKey;

                return (
                  <button
                    className={[
                      'rounded-lg border px-1 py-2 text-center transition',
                      isSelected
                        ? 'border-frenchRose bg-chantilly/50 text-frenchRose'
                        : 'border-slate-100 hover:bg-slate-50',
                      isToday && !isSelected ? 'border-froly text-frenchRose' : '',
                    ].join(' ')}
                    key={key}
                    onClick={() => selectDate(day)}
                    type="button"
                  >
                    <span className="block text-[10px] font-extrabold text-slate-400">
                      {weekDays[day.getDay()]}
                    </span>
                    <span className="mt-1 block text-xs font-extrabold">
                      {day.getDate()}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold text-frenchRose">
                      {dayOrders.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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
                  <div
                    className="grid cursor-pointer gap-2 px-4 py-4 transition hover:bg-chantilly/20"
                    key={order.id}
                    onClick={() => navigate(`/pedidos/${order.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-ink">
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
                    <div className="flex items-center justify-between gap-3">
                      {order.observacoes ? (
                        <p className="text-xs leading-relaxed text-slate-600">
                          {order.observacoes}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400">Sem observações</span>
                      )}
                      <button
                        aria-label={`Editar pedido de ${
                          client?.nome ?? 'cliente não identificado'
                        }`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                        onClick={(event) => {
                          event.stopPropagation();
                          showEditPlaceholder();
                        }}
                        type="button"
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
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
