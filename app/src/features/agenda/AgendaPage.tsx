import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { AlertMessage, EmptyState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Surface, SurfaceHeader } from '../../components/ui/Surface';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import { listOrders, Order } from '../../services/orders';
import { getDeadlineState } from '../orders/orderUtils';
import { formatCurrency } from '../../utils/format';

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
type CalendarView = 'month' | 'week';
const calendarViewStorageKey = 'bordados:agenda-view';

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

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(date);
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

function getInitialCalendarView(): CalendarView {
  const storedView = window.localStorage.getItem(calendarViewStorageKey);

  return storedView === 'week' || storedView === 'month' ? storedView : 'month';
}

export function AgendaPage() {
  const user = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarView, setCalendarView] =
    useState<CalendarView>(getInitialCalendarView);
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

  useEffect(() => {
    window.localStorage.setItem(calendarViewStorageKey, calendarView);
  }, [calendarView]);

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
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const selectedDateKey = dateKey(selectedDate);
  const selectedOrders = ordersByDate.get(selectedDateKey) ?? [];
  const currentWeekDays = buildWeekDays(selectedDate);
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

  return (
    <AppShell activePage="Agenda">
      <PageHeader breadcrumb="Dashboard / Agenda" title="Agenda de Pedidos" />

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Surface as="article">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-grid min-h-10 grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-extrabold text-slate-500">
              <button
                className={[
                  'rounded-md px-4 transition',
                  calendarView === 'week'
                    ? 'bg-primary/10 text-primary-dark shadow-sm'
                    : 'hover:text-graphite',
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
                    ? 'bg-primary/10 text-primary-dark shadow-sm'
                    : 'hover:text-graphite',
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
              className="text-xs font-bold text-primary-dark transition hover:text-primary-dark"
              onClick={() => selectDate(new Date())}
              type="button"
            >
              Hoje
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 px-2 py-2 text-center text-[10px] font-extrabold text-slate-400 sm:px-4">
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
                    calendarView === 'week' ? 'h-20 sm:h-24' : 'min-h-14 sm:min-h-16',
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
                  return (
                    <div
                      className="min-h-14 rounded-lg border border-slate-100 bg-white/60 sm:min-h-16"
                      key={`empty-${index}`}
                    />
                  );
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
                        ? 'flex h-20 flex-col items-center justify-center gap-2 sm:h-24'
                        : 'min-h-14 py-2 sm:min-h-16',
                      isSelected
                        ? 'border-frenchRose bg-chantilly/50 text-frenchRose shadow-sm'
                        : 'border-slate-100 text-slate-600 hover:bg-slate-100',
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
        </Surface>

        <Surface as="aside" className="self-start">
          <SurfaceHeader>
            <p className="text-xs font-semibold text-mauve">Resumo do dia</p>
            <h2 className="mt-1 text-sm font-extrabold capitalize text-ink">
              {formatLongDate(selectedDate)}
            </h2>
          </SurfaceHeader>

          <div className="grid gap-3 p-4">
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-xs font-bold text-slate-500">Pedidos no dia</p>
              <p className="mt-1 text-2xl font-extrabold text-frenchRose">
                {selectedOrders.length}
              </p>
            </div>

            {selectedOrders.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {selectedOrders.map((order) => {
                  const client = clientsById.get(order.cliente);
                  const deadlineState = getDeadlineState(order);
                  const overdueLabel =
                    deadlineState?.label.startsWith('Atrasado')
                      ? deadlineState.label
                      : '';
                  const isOverdue = Boolean(overdueLabel);

                  return (
                    <div
                      className={[
                        'grid gap-1 px-3 py-3',
                        isOverdue ? 'bg-rose-50/50 ring-1 ring-inset ring-rose-100' : '',
                      ].join(' ')}
                      key={order.id}
                    >
                      <p className="text-sm font-extrabold text-ink">
                        {client?.nome ?? 'Cliente não identificado'}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {client?.telefone ||
                          client?.email ||
                          order.canal ||
                          'Sem contato informado'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="w-fit rounded-full bg-chantilly/50 px-2 py-1 text-[11px] font-bold text-frenchRose">
                          {order.status || 'Recebido'}
                        </span>
                        {isOverdue ? (
                          <span className="w-fit rounded-full bg-white px-2 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100">
                            {overdueLabel}
                          </span>
                        ) : null}
                        {order.urgente ? (
                          <span className="w-fit rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700">
                            Urgente
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-400">Valor</p>
                          <p className="font-extrabold text-ink">
                            {formatCurrency(order.valor_total) ?? 'R$ 0,00'}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400">Pagamento</p>
                          <p className="font-extrabold text-ink">
                            {order.forma_pagamento || order.status_pagamento || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                minHeightClassName="min-h-32"
                title="Nenhum pedido para esta data."
              />
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
