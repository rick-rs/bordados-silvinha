import { ChangeEvent, useEffect, useState } from 'react';
import { Columns3, Inbox, List, Plus, Search } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AlertMessage, EmptyState, LoadingRows } from '../../components/ui/Feedback';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { Surface } from '../../components/ui/Surface';
import { getSession } from '../../services/auth';
import { deleteOrder, Order, updateOrder } from '../../services/orders';
import { OrdersBoard, OrdersTable } from './OrderViews';
import {
  channelOptions,
  formatOrderNumber,
  paymentOptions,
  statusLabel,
  statusOptions,
} from './orderUtils';
import { useOrderFilters, OrdersFilterState } from './hooks/useOrderFilters';
export { NewOrderPage } from './NewOrderPage';

type OrdersView = 'list' | 'board';
const ordersViewStorageKey = 'bordados:orders-view';

function getInitialOrdersView(): OrdersView {
  const storedView = window.localStorage.getItem(ordersViewStorageKey);

  return storedView === 'board' || storedView === 'list' ? storedView : 'list';
}

export function OrdersPage() {
  const user = getSession();
  const navigate = useNavigate();

  // Filter and pagination state
  const [filters, setFilters] = useState<OrdersFilterState>({
    statusFilter: '',
    paymentFilter: '',
    channelFilter: '',
    dateFromFilter: '',
    dateToFilter: '',
    search: '',
    page: 1,
    pageSize: 10,
  });

  // UI state
  const [ordersView, setOrdersView] = useState<OrdersView>(getInitialOrdersView);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  // Load data with filters
  const {
    orders,
    clientsById,
    productsById,
    itemsByOrder,
    count,
    isLoading,
    error: loadError,
  } = useOrderFilters(filters);

  // Persist view preference
  useEffect(() => {
    window.localStorage.setItem(ordersViewStorageKey, ordersView);
  }, [ordersView]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  // Sort orders: non-canceled first, then canceled
  const sortedOrders = [...orders].sort((leftOrder, rightOrder) => {
    if (leftOrder.status === 'Cancelado' && rightOrder.status !== 'Cancelado') {
      return 1;
    }

    if (leftOrder.status !== 'Cancelado' && rightOrder.status === 'Cancelado') {
      return -1;
    }

    return 0;
  });

  // Filter handlers - reset pagination when filter changes
  function handleStatusFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    setFilters((current) => ({
      ...current,
      statusFilter: event.target.value,
      page: 1,
    }));
  }

  function handlePaymentFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    setFilters((current) => ({
      ...current,
      paymentFilter: event.target.value,
      page: 1,
    }));
  }

  function handleChannelFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    setFilters((current) => ({
      ...current,
      channelFilter: event.target.value,
      page: 1,
    }));
  }

  function handleDateFromFilterChange(value: string) {
    setFilters((current) => ({
      ...current,
      dateFromFilter: value,
      page: 1,
    }));
  }

  function handleDateToFilterChange(value: string) {
    setFilters((current) => ({
      ...current,
      dateToFilter: value,
      page: 1,
    }));
  }

  function handleSearchChange(value: string) {
    setFilters((current) => ({
      ...current,
      search: value,
      page: 1,
    }));
  }

  function handlePageSizeChange(pageSize: number) {
    setFilters((current) => ({
      ...current,
      pageSize,
      page: 1,
    }));
  }

  async function handleDeleteOrder() {
    if (!orderToDelete) {
      return;
    }

    setDeletingId(orderToDelete.id);
    setError('');

    try {
      await deleteOrder(orderToDelete.id);
      setOrderToDelete(null);
      // Refetch by resetting page
      setFilters((current) => ({ ...current, page: 1 }));
    } catch {
      setError('Não foi possível excluir o pedido.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCancelOrder() {
    if (!orderToCancel) {
      return;
    }

    const reason = cancelReason.trim();

    if (!reason) {
      setError('Informe o motivo do cancelamento.');
      return;
    }

    setUpdatingStatusId(orderToCancel.id);
    setError('');

    try {
      await updateOrder(orderToCancel.id, {
        motivo_cancelamento: reason,
        status: 'Cancelado',
      });

      setOrderToCancel(null);
      setCancelReason('');
      // Refetch by resetting page
      setFilters((current) => ({ ...current, page: 1 }));
    } catch {
      setError('Não foi possível cancelar o pedido.');
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleStatusChange(order: Order, status: string) {
    if (order.status === status) {
      return;
    }

    setUpdatingStatusId(order.id);
    setError('');

    try {
      await updateOrder(order.id, { status });
      // Refetch by resetting page
      setFilters((current) => ({ ...current, page: 1 }));
    } catch {
      setError('Não foi possível atualizar o status do pedido.');
    } finally {
      setUpdatingStatusId(null);
    }
  }

  return (
    <AppShell activePage="Pedidos">
      <PageHeader
        actions={
          <Link to="/pedidos/novo">
            <Button className="w-full sm:w-auto sm:self-auto">
              <Plus aria-hidden className="h-4 w-4" />
              Nova Encomenda
            </Button>
          </Link>
        }
        breadcrumb="Dashboard / Pedidos"
        title="Gestão de Pedidos"
      />

      <AlertMessage>{error || loadError}</AlertMessage>

      <Surface>
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
                onChange={handleStatusFilterChange}
                value={filters.statusFilter}
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
                onChange={handleChannelFilterChange}
                value={filters.channelFilter}
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
                  onChange={(event) => handleDateFromFilterChange(event.target.value)}
                  title="Prazo inicial"
                  type="date"
                  value={filters.dateFromFilter}
                />
              </label>

              <label className="relative block xl:w-36" htmlFor="date-to-filter">
                <span className="sr-only">Prazo final</span>
                <input
                  className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="date-to-filter"
                  onChange={(event) => handleDateToFilterChange(event.target.value)}
                  title="Prazo final"
                  type="date"
                  value={filters.dateToFilter}
                />
              </label>

              <label className="sr-only" htmlFor="payment-filter">
                Filtrar por pagamento
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-44"
                id="payment-filter"
                onChange={handlePaymentFilterChange}
                value={filters.paymentFilter}
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
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Buscar cliente ou nº pedido"
                type="search"
                value={filters.search}
              />
            </label>
          }
        />

        {isLoading ? (
          <LoadingRows count={4} />
        ) : sortedOrders.length > 0 && ordersView === 'list' ? (
          <OrdersTable
            clientsById={clientsById}
            deletingId={deletingId}
            itemsByOrder={itemsByOrder}
            onAdvanceStatus={handleStatusChange}
            onCancel={(order) => setOrderToCancel(order)}
            onEdit={(order) => navigate(`/pedidos/${order.id}/editar`)}
            onDelete={(order) => setOrderToDelete(order)}
            orders={sortedOrders}
            productsById={productsById}
            updatingStatusId={updatingStatusId}
          />
        ) : sortedOrders.length > 0 ? (
          <OrdersBoard
            clientsById={clientsById}
            deletingId={deletingId}
            itemsByOrder={itemsByOrder}
            onCancel={(order) => setOrderToCancel(order)}
            onDelete={(order) => setOrderToDelete(order)}
            onEdit={(order) => navigate(`/pedidos/${order.id}/editar`)}
            onStatusChange={handleStatusChange}
            orders={sortedOrders}
            productsById={productsById}
            updatingStatusId={updatingStatusId}
          />
        ) : (
          <EmptyState
            icon={<Inbox aria-hidden className="h-5 w-5" />}
            title="Nenhum pedido encontrado."
            description="Ajuste os filtros ou cadastre uma nova encomenda."
          />
        )}
        {count > filters.pageSize ? (
          <PaginationControls
            count={count}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            onPageSizeChange={handlePageSizeChange}
            page={filters.page}
            pageSize={filters.pageSize}
          />
        ) : null}
      </Surface>

      <ConfirmDialog
        confirmLabel="Excluir pedido"
        description={
          orderToDelete
            ? `Excluir o pedido ${formatOrderNumber(orderToDelete.id)}? Esta ação não pode ser desfeita.`
            : ''
        }
        isLoading={deletingId === orderToDelete?.id}
        isOpen={Boolean(orderToDelete)}
        onCancel={() => setOrderToDelete(null)}
        onConfirm={handleDeleteOrder}
        title="Excluir pedido"
      />

      <ConfirmDialog
        confirmLabel="Cancelar pedido"
        description={
          orderToCancel
            ? `Informe o motivo para cancelar o pedido ${formatOrderNumber(orderToCancel.id)}.`
            : ''
        }
        isLoading={updatingStatusId === orderToCancel?.id}
        isOpen={Boolean(orderToCancel)}
        onCancel={() => {
          setOrderToCancel(null);
          setCancelReason('');
        }}
        onConfirm={handleCancelOrder}
        title="Cancelar pedido"
      >
        <label className="grid gap-2" htmlFor="cancel-reason">
          <span className="text-sm font-bold text-mauve">Motivo do cancelamento</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-mauve/60 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
            id="cancel-reason"
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Ex.: cliente desistiu, pedido duplicado..."
            value={cancelReason}
          />
        </label>
      </ConfirmDialog>
    </AppShell>
  );
}
