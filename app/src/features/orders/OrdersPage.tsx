import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Columns3, Inbox, List, Plus, Search } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import {
  deleteOrder,
  listOrderItems,
  listOrdersPage,
  listProducts,
  Order,
  OrderItem,
  Product,
  updateOrder,
} from '../../services/orders';
import { OrdersBoard, OrdersTable } from './OrderViews';
import {
  channelOptions,
  formatOrderNumber,
  paymentOptions,
  statusLabel,
  statusOptions,
} from './orderUtils';
export { NewOrderPage } from './NewOrderPage';

type OrdersView = 'list' | 'board';
const ordersViewStorageKey = 'bordados:orders-view';

function EmptyState() {
  return (
    <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-frenchRose">
          <Inbox aria-hidden className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-600">
          Nenhum pedido encontrado.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Ajuste os filtros ou cadastre uma nova encomenda.
        </p>
      </div>
    </div>
  );
}

function getInitialOrdersView(): OrdersView {
  const storedView = window.localStorage.getItem(ordersViewStorageKey);

  return storedView === 'board' || storedView === 'list' ? storedView : 'list';
}

export function OrdersPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [search, setSearch] = useState('');
  const [ordersView, setOrdersView] = useState<OrdersView>(getInitialOrdersView);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const [ordersResponse, clientsResponse, itemsResponse, productsResponse] =
          await Promise.all([
            listOrdersPage({
              canal: channelFilter,
              page,
              pageSize,
              prazo_fim: dateToFilter,
              prazo_inicio: dateFromFilter,
              q: search,
              status: statusFilter,
              status_pagamento: paymentFilter,
            }),
            listClients(),
            listOrderItems(),
            listProducts(),
          ]);

        if (isMounted) {
          setOrders(ordersResponse.results);
          setCount(ordersResponse.count);
          setClients(clientsResponse);
          setItems(itemsResponse);
          setProducts(productsResponse);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar os pedidos.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [
    channelFilter,
    dateFromFilter,
    dateToFilter,
    page,
    pageSize,
    paymentFilter,
    search,
    statusFilter,
  ]);

  useEffect(() => {
    window.localStorage.setItem(ordersViewStorageKey, ordersView);
  }, [ordersView]);

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const itemsByOrder = useMemo(() => {
    const groupedItems = new Map<number, OrderItem[]>();

    items.forEach((item) => {
      groupedItems.set(item.pedido, [...(groupedItems.get(item.pedido) ?? []), item]);
    });

    return groupedItems;
  }, [items]);

  const filteredOrders = orders;

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateStatusFilter(event: ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(event.target.value);
    setPage(1);
  }

  function updatePaymentFilter(event: ChangeEvent<HTMLSelectElement>) {
    setPaymentFilter(event.target.value);
    setPage(1);
  }

  function updateChannelFilter(event: ChangeEvent<HTMLSelectElement>) {
    setChannelFilter(event.target.value);
    setPage(1);
  }

  function updateDateFromFilter(value: string) {
    setDateFromFilter(value);
    setPage(1);
  }

  function updateDateToFilter(value: string) {
    setDateToFilter(value);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  async function handleDelete(order: Order) {
    const confirmed = window.confirm(
      `Excluir o pedido ${formatOrderNumber(order.id)}? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(order.id);
    setError('');

    try {
      await deleteOrder(order.id);
      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
      );
      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.pedido !== order.id),
      );
    } catch {
      setError('Não foi possível excluir o pedido.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(order: Order, status: string) {
    if (order.status === status) {
      return;
    }

    const previousOrders = orders;

    setUpdatingStatusId(order.id);
    setError('');
    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? { ...currentOrder, status, atualizado_em: new Date().toISOString() }
          : currentOrder,
      ),
    );

    try {
      const updatedOrder = await updateOrder(order.id, { status });
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder,
        ),
      );
    } catch {
      setOrders(previousOrders);
      setError('Não foi possível atualizar o status do pedido.');
    } finally {
      setUpdatingStatusId(null);
    }
  }

  return (
    <AppShell activePage="Pedidos">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">Dashboard / Pedidos</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Gestão de Pedidos
          </h1>
        </div>
        <Link
          className={[
            'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition',
            'hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg',
            'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-froly/30',
            'sm:min-h-9 sm:w-auto sm:text-xs',
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <FilterToolbar
          actions={
            <div className="inline-grid min-h-10 w-full grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-extrabold text-slate-500 sm:w-[190px]">
              <button
                aria-label="Visualizar pedidos em lista"
                className={[
                  'inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 transition',
                  ordersView === 'list'
                    ? 'bg-white text-frenchRose shadow-sm'
                    : 'hover:text-ink',
                ].join(' ')}
                onClick={() => setOrdersView('list')}
                type="button"
              >
                <List aria-hidden className="h-4 w-4" />
                Lista
              </button>
              <button
                aria-label="Visualizar pedidos em quadro"
                className={[
                  'inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 transition',
                  ordersView === 'board'
                    ? 'bg-white text-frenchRose shadow-sm'
                    : 'hover:text-ink',
                ].join(' ')}
                onClick={() => setOrdersView('board')}
                type="button"
              >
                <Columns3 aria-hidden className="h-4 w-4" />
                Quadro
              </button>
            </div>
          }
          filters={
            <>
              <label className="sr-only" htmlFor="status-filter">
                Filtrar por status
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-40"
                id="status-filter"
                onChange={updateStatusFilter}
                value={statusFilter}
              >
                <option value="">Todos os status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="channel-filter">
                Filtrar por canal
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-40"
                id="channel-filter"
                onChange={updateChannelFilter}
                value={channelFilter}
              >
                <option value="">Todos os canais</option>
                {channelOptions.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>

              <label className="relative block xl:w-36" htmlFor="date-from-filter">
                <span className="sr-only">Prazo inicial</span>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="date-from-filter"
                  onChange={(event) => updateDateFromFilter(event.target.value)}
                  title="Prazo inicial"
                  type="date"
                  value={dateFromFilter}
                />
              </label>

              <label className="relative block xl:w-36" htmlFor="date-to-filter">
                <span className="sr-only">Prazo final</span>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="date-to-filter"
                  onChange={(event) => updateDateToFilter(event.target.value)}
                  title="Prazo final"
                  type="date"
                  value={dateToFilter}
                />
              </label>

              <label className="sr-only" htmlFor="payment-filter">
                Filtrar por pagamento
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-44"
                id="payment-filter"
                onChange={updatePaymentFilter}
                value={paymentFilter}
              >
                <option value="">Todos os pagamentos</option>
                {paymentOptions.map((payment) => (
                  <option key={payment} value={payment}>
                    {payment}
                  </option>
                ))}
              </select>
            </>
          }
          primary={
            <label className="relative block" htmlFor="order-search">
              <span className="sr-only">Buscar cliente ou número do pedido</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                id="order-search"
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Buscar cliente ou nº pedido"
                type="search"
                value={search}
              />
            </label>
          }
        />

        {isLoading ? (
          <div className="grid gap-3 p-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                className="h-16 animate-pulse rounded-lg bg-slate-100"
                key={item}
              />
            ))}
          </div>
        ) : filteredOrders.length > 0 && ordersView === 'list' ? (
          <OrdersTable
            clientsById={clientsById}
            deletingId={deletingId}
            itemsByOrder={itemsByOrder}
            onAdvanceStatus={handleStatusChange}
            onEdit={(order) => navigate(`/pedidos/${order.id}/editar`)}
            onDelete={handleDelete}
            orders={filteredOrders}
            productsById={productsById}
            updatingStatusId={updatingStatusId}
          />
        ) : filteredOrders.length > 0 ? (
          <OrdersBoard
            clientsById={clientsById}
            deletingId={deletingId}
            itemsByOrder={itemsByOrder}
            onDelete={handleDelete}
            onEdit={(order) => navigate(`/pedidos/${order.id}/editar`)}
            onStatusChange={handleStatusChange}
            orders={filteredOrders}
            productsById={productsById}
            updatingStatusId={updatingStatusId}
          />
        ) : (
          <EmptyState />
        )}
        {count > pageSize ? (
          <PaginationControls
            count={count}
            onPageChange={setPage}
            onPageSizeChange={updatePageSize}
            page={page}
            pageSize={pageSize}
          />
        ) : null}
      </section>
    </AppShell>
  );
}
