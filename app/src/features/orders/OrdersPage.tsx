import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Columns3, Flag, Inbox, List, Plus, Search, Trash2 } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import { Client, ClientPayload, createClient, listClients } from '../../services/clients';
import {
  createOrder,
  createOrderItem,
  deleteOrder,
  listOrderItems,
  listOrdersPage,
  listProducts,
  Order,
  OrderItem,
  OrderItemPayload,
  OrderPayload,
  Product,
  updateOrder,
} from '../../services/orders';
import { formatCurrency } from '../../utils/format';
import { OrdersBoard, OrdersTable } from './OrderViews';
import {
  channelOptions,
  formatDate,
  formatOrderNumber,
  normalizeText,
  paymentMethodLabel,
  paymentMethodOptions,
  paymentOptions,
  parseMoney,
  statusLabel,
  statusOptions,
  toDecimalString,
} from './orderUtils';

type OrdersView = 'list' | 'board';
const ordersViewStorageKey = 'bordados:orders-view';

type OrderItemForm = {
  id: string;
  peca: string;
  produto: string;
  local_bordado: string;
  descricao_bordado: string;
  quantidade: string;
  valor_unitario: string;
};

type OrderStep = 1 | 2 | 3;

const orderSteps = [
  { id: 1, label: 'Cliente' },
  { id: 2, label: 'Pedido' },
  { id: 3, label: 'Resumo' },
] as const;

const initialOrderForm: Omit<OrderPayload, 'cliente' | 'valor_total'> & {
  cliente: string;
} = {
  cliente: '',
  prazo: '',
  canal: 'WhatsApp',
  forma_pagamento: 'Pix',
  status_pagamento: 'Pendente',
  urgente: false,
  observacoes: '',
};

const initialQuickClientForm: ClientPayload = {
  nome: '',
  telefone: '',
  email: '',
  rede_social: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

function createEmptyItem(): OrderItemForm {
  return {
    id: String(Date.now() + Math.random()),
    peca: '',
    produto: '',
    local_bordado: '',
    descricao_bordado: '',
    quantidade: '1',
    valor_unitario: '',
  };
}

function itemSubtotal(item: OrderItemForm) {
  const quantity = Number.parseInt(item.quantidade, 10);

  return (Number.isNaN(quantity) ? 0 : quantity) * parseMoney(item.valor_unitario);
}

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

export function NewOrderPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<OrderStep>(1);
  const [form, setForm] = useState(initialOrderForm);
  const [items, setItems] = useState<OrderItemForm[]>([createEmptyItem()]);
  const [quickClientForm, setQuickClientForm] = useState(initialQuickClientForm);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [clientsResponse, productsResponse] = await Promise.all([
          listClients(),
          listProducts(),
        ]);

        if (isMounted) {
          setClients(clientsResponse);
          setProducts(productsResponse);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar clientes e produtos.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const embroideryProducts = products.filter(
    (product) => product.ativo && product.tipo === 'bordado',
  );
  const productOptions = embroideryProducts.length > 0
    ? embroideryProducts
    : products.filter((product) => product.ativo);
  const total = items.reduce((currentTotal, item) => currentTotal + itemSubtotal(item), 0);
  const selectedClient = clients.find((client) => String(client.id) === form.cliente);
  const filteredClients = useMemo(() => {
    const normalizedSearch = normalizeText(clientSearch.trim());

    if (!normalizedSearch) {
      return clients;
    }

    return clients.filter((client) =>
      normalizeText(
        [
          client.nome,
          client.telefone ?? '',
          client.email ?? '',
          client.rede_social ?? '',
        ].join(' '),
      ).includes(normalizedSearch),
    );
  }, [clientSearch, clients]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function updateQuickClientField(field: keyof ClientPayload, value: string) {
    setQuickClientForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function updateItem(id: string, field: keyof OrderItemForm, value: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((item) => item.id !== id),
    );
  }

  function validateOrderData() {
    if (!form.prazo) {
      setError('Informe o prazo de entrega.');
      return false;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.peca ||
        !item.produto ||
        !item.local_bordado ||
        Number.parseInt(item.quantidade, 10) <= 0 ||
        parseMoney(item.valor_unitario) <= 0,
    );

    if (hasInvalidItem) {
      setError('Preencha peça, bordado, local, quantidade e valor de todos os itens.');
      return false;
    }

    setError('');
    return true;
  }

  function goToStep(nextStep: OrderStep) {
    if (nextStep > 1 && !form.cliente) {
      setError('Escolha ou cadastre um cliente para continuar.');
      setStep(1);
      return;
    }

    if (nextStep > 2 && !validateOrderData()) {
      setStep(2);
      return;
    }

    setError('');
    setStep(nextStep);
  }

  async function handleQuickClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsCreatingClient(true);

    try {
      const client = await createClient(quickClientForm);
      setClients((currentClients) => [...currentClients, client]);
      updateField('cliente', String(client.id));
      setQuickClientForm(initialQuickClientForm);
      setClientMode('existing');
      setStep(2);
    } catch {
      setError('Não foi possível cadastrar o cliente rápido.');
    } finally {
      setIsCreatingClient(false);
    }
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!form.cliente) {
      setStep(1);
      setError('Escolha ou cadastre um cliente para continuar.');
      return;
    }

    if (!validateOrderData()) {
      setStep(2);
      return;
    }

    setError('');
    setIsSaving(true);

    const orderPayload: OrderPayload = {
      cliente: Number(form.cliente),
      prazo: form.prazo,
      canal: form.canal,
      forma_pagamento: form.forma_pagamento,
      status_pagamento: form.status_pagamento,
      urgente: form.urgente,
      observacoes: form.observacoes,
      valor_total: toDecimalString(total),
    };

    try {
      const order = await createOrder(orderPayload);
      const itemPayloads: OrderItemPayload[] = items.map((item) => ({
        pedido: order.id,
        produto: Number(item.produto),
        peca: item.peca,
        local_bordado: item.local_bordado,
        descricao_bordado: item.descricao_bordado,
        quantidade: Number.parseInt(item.quantidade, 10),
        valor_unitario: toDecimalString(parseMoney(item.valor_unitario)),
      }));

      await Promise.all(itemPayloads.map((itemPayload) => createOrderItem(itemPayload)));
      navigate('/pedidos', { replace: true });
    } catch {
      setError('Não foi possível salvar a encomenda.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell activePage="Pedidos">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">
          Dashboard / Pedidos / Nova Encomenda
        </p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Nova Encomenda
        </h1>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      <OrderStepIndicator currentStep={step} />

      {step === 1 ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Cliente</h2>
          </div>
          <div className="grid gap-5 p-5">
            <div className="inline-grid min-h-10 max-w-md grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-extrabold text-slate-500">
              <button
                className={[
                  'rounded-md px-4 transition',
                  clientMode === 'existing'
                    ? 'bg-white text-frenchRose shadow-sm'
                    : 'hover:text-ink',
                ].join(' ')}
                onClick={() => setClientMode('existing')}
                type="button"
              >
                Cliente existente
              </button>
              <button
                className={[
                  'rounded-md px-4 transition',
                  clientMode === 'new'
                    ? 'bg-white text-frenchRose shadow-sm'
                    : 'hover:text-ink',
                ].join(' ')}
                onClick={() => setClientMode('new')}
                type="button"
              >
                Novo rápido
              </button>
            </div>

            {clientMode === 'existing' ? (
              <div className="grid gap-4">
                <label className="relative block" htmlFor="client-search-order">
                  <span className="sr-only">Buscar cliente</span>
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white pl-9 pr-4 text-ink outline-none transition placeholder:text-mauve/60 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                    id="client-search-order"
                    onChange={(event) => setClientSearch(event.target.value)}
                    placeholder="Buscar por nome, telefone, e-mail ou rede social"
                    type="search"
                    value={clientSearch}
                  />
                </label>
                <label className="grid gap-2" htmlFor="cliente">
                  <span className="text-sm font-bold text-mauve">Cliente *</span>
                  <select
                    className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                    disabled={isLoadingOptions}
                    id="cliente"
                    onChange={(event) => updateField('cliente', event.target.value)}
                    value={form.cliente}
                  >
                    <option value="">Selecione</option>
                    {filteredClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nome}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedClient ? (
                  <div className="rounded-lg border border-chantilly bg-chantilly/20 p-4">
                    <p className="text-sm font-extrabold text-ink">
                      {selectedClient.nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {selectedClient.telefone || selectedClient.email || 'Sem contato'}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={handleQuickClientSubmit}>
                <TextField
                  label="Nome completo *"
                  name="quick_nome"
                  onChange={(event) =>
                    updateQuickClientField('nome', event.target.value)
                  }
                  required
                  value={quickClientForm.nome}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Telefone/Whatsapp *"
                    name="quick_telefone"
                    onChange={(event) =>
                      updateQuickClientField('telefone', event.target.value)
                    }
                    required
                    value={quickClientForm.telefone}
                  />
                  <TextField
                    label="E-mail"
                    name="quick_email"
                    onChange={(event) =>
                      updateQuickClientField('email', event.target.value)
                    }
                    type="email"
                    value={quickClientForm.email}
                  />
                </div>
                <TextField
                  label="Rede social"
                  name="quick_rede_social"
                  onChange={(event) =>
                    updateQuickClientField('rede_social', event.target.value)
                  }
                  placeholder="Ex: @usuario_instagram"
                  value={quickClientForm.rede_social}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="CEP"
                    name="quick_cep"
                    onChange={(event) =>
                      updateQuickClientField('cep', event.target.value)
                    }
                    value={quickClientForm.cep}
                  />
                  <TextField
                    label="Endereço"
                    name="quick_endereco"
                    onChange={(event) =>
                      updateQuickClientField('endereco', event.target.value)
                    }
                    value={quickClientForm.endereco}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Número"
                    name="quick_numero"
                    onChange={(event) =>
                      updateQuickClientField('numero', event.target.value)
                    }
                    value={quickClientForm.numero}
                  />
                  <TextField
                    label="Complemento"
                    name="quick_complemento"
                    onChange={(event) =>
                      updateQuickClientField('complemento', event.target.value)
                    }
                    value={quickClientForm.complemento}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField
                    label="Bairro"
                    name="quick_bairro"
                    onChange={(event) =>
                      updateQuickClientField('bairro', event.target.value)
                    }
                    value={quickClientForm.bairro}
                  />
                  <TextField
                    label="Cidade"
                    name="quick_cidade"
                    onChange={(event) =>
                      updateQuickClientField('cidade', event.target.value)
                    }
                    value={quickClientForm.cidade}
                  />
                  <TextField
                    label="Estado"
                    maxLength={2}
                    name="quick_estado"
                    onChange={(event) =>
                      updateQuickClientField(
                        'estado',
                        event.target.value.toUpperCase(),
                      )
                    }
                    value={quickClientForm.estado}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    className="min-h-11 px-4 text-sm"
                    isLoading={isCreatingClient}
                    loadingLabel="Cadastrando..."
                    type="submit"
                  >
                    Cadastrar e continuar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink">Dados do Pedido</h2>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-2" htmlFor="canal">
                <span className="text-sm font-bold text-mauve">Canal de Origem</span>
                <select
                  className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="canal"
                  onChange={(event) => updateField('canal', event.target.value)}
                  value={form.canal}
                >
                  {channelOptions.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </label>

              <TextField
                label="Prazo de Entrega *"
                name="prazo"
                onChange={(event) => updateField('prazo', event.target.value)}
                required
                type="date"
                value={form.prazo}
              />

              <label className="grid gap-2" htmlFor="forma_pagamento">
                <span className="text-sm font-bold text-mauve">Forma de Pagamento</span>
                <select
                  className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="forma_pagamento"
                  onChange={(event) =>
                    updateField('forma_pagamento', event.target.value)
                  }
                  value={form.forma_pagamento}
                >
                  {paymentMethodOptions.map((paymentMethod) => (
                    <option key={paymentMethod} value={paymentMethod}>
                      {paymentMethodLabel(paymentMethod)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2" htmlFor="status_pagamento">
                <span className="text-sm font-bold text-mauve">Status do Pagamento</span>
                <select
                  className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="status_pagamento"
                  onChange={(event) =>
                    updateField('status_pagamento', event.target.value)
                  }
                  value={form.status_pagamento}
                >
                  {paymentOptions.map((payment) => (
                    <option key={payment} value={payment}>
                      {payment}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="flex min-h-12 items-center gap-3 rounded-lg border border-frenchRose/20 bg-white px-4"
                htmlFor="urgente"
              >
                <input
                  checked={Boolean(form.urgente)}
                  className="h-4 w-4 rounded border-frenchRose/30 text-frenchRose focus:ring-frenchRose/20"
                  id="urgente"
                  onChange={(event) => updateField('urgente', event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm font-bold text-mauve">
                  Marcar como urgente
                </span>
              </label>

              <label
                className="grid gap-2 sm:col-span-2 lg:col-span-3"
                htmlFor="observacoes"
              >
                <span className="text-sm font-bold text-mauve">Observações</span>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-mauve/60 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="observacoes"
                  onChange={(event) => updateField('observacoes', event.target.value)}
                  value={form.observacoes}
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink">Itens da Encomenda</h2>
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-chantilly/45 px-3 text-xs font-extrabold text-frenchRose transition hover:bg-chantilly/70"
                onClick={addItem}
                type="button"
              >
                <Plus aria-hidden className="h-4 w-4" />
                Item
              </button>
            </div>

            <div className="grid gap-4 p-5">
              {items.map((item, index) => (
                <article
                  className="grid gap-4 rounded-lg border border-slate-200 p-4"
                  key={item.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold text-ink">
                      Item {index + 1}
                    </h3>
                    <button
                      aria-label={`Remover item ${index + 1}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.id)}
                      title="Remover item"
                      type="button"
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr_1.2fr_1.4fr_110px_140px_140px]">
                    <TextField
                      label="Peça *"
                      name={`peca-${item.id}`}
                      onChange={(event) =>
                        updateItem(item.id, 'peca', event.target.value)
                      }
                      required
                      value={item.peca}
                    />

                    <label className="grid gap-2" htmlFor={`produto-${item.id}`}>
                      <span className="text-sm font-bold text-mauve">Bordado *</span>
                      <select
                        className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                        disabled={isLoadingOptions}
                        id={`produto-${item.id}`}
                        onChange={(event) =>
                          updateItem(item.id, 'produto', event.target.value)
                        }
                        required
                        value={item.produto}
                      >
                        <option value="">Selecione</option>
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.nome}
                          </option>
                        ))}
                      </select>
                    </label>

                    <TextField
                      label="Local do bordado *"
                      name={`local-${item.id}`}
                      onChange={(event) =>
                        updateItem(item.id, 'local_bordado', event.target.value)
                      }
                      required
                      value={item.local_bordado}
                    />

                    <TextField
                      label="Descrição do Bordado"
                      name={`descricao-${item.id}`}
                      onChange={(event) =>
                        updateItem(item.id, 'descricao_bordado', event.target.value)
                      }
                      value={item.descricao_bordado}
                    />

                    <TextField
                      label="Quantidade"
                      min="1"
                      name={`quantidade-${item.id}`}
                      onChange={(event) =>
                        updateItem(item.id, 'quantidade', event.target.value)
                      }
                      required
                      type="number"
                      value={item.quantidade}
                    />

                    <TextField
                      label="Valor Unitário"
                      min="0"
                      name={`valor-${item.id}`}
                      onChange={(event) =>
                        updateItem(item.id, 'valor_unitario', event.target.value)
                      }
                      required
                      step="0.01"
                      type="number"
                      value={item.valor_unitario}
                    />

                    <div className="grid gap-2">
                      <span className="text-sm font-bold text-mauve">Subtotal</span>
                      <div className="flex min-h-12 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-extrabold text-ink">
                        {formatCurrency(itemSubtotal(item)) ?? 'R$ 0,00'}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryBlock title="Cliente">
              <p className="font-extrabold text-ink">
                {selectedClient?.nome ?? 'Cliente não selecionado'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedClient?.telefone || selectedClient?.email || '-'}
              </p>
            </SummaryBlock>
            <SummaryBlock title="Pedido">
              <p className="font-extrabold text-ink">Prazo {formatDate(form.prazo)}</p>
              <p className="mt-1 text-sm text-slate-600">
                {form.canal} · {paymentMethodLabel(form.forma_pagamento)} ·{' '}
                {form.status_pagamento}
              </p>
              {form.urgente ? (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-extrabold text-rose-700">
                  <Flag aria-hidden className="h-3.5 w-3.5" />
                  Urgente
                </p>
              ) : null}
            </SummaryBlock>
            <SummaryBlock title="Total">
              <p className="text-2xl font-extrabold text-frenchRose">
                {formatCurrency(total) ?? 'R$ 0,00'}
              </p>
            </SummaryBlock>
          </div>

          <div className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink">Itens</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const product = products.find(
                  (currentProduct) => String(currentProduct.id) === item.produto,
                );

                return (
                  <div
                    className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]"
                    key={item.id}
                  >
                    <div>
                      <p className="text-sm font-extrabold text-ink">
                        {item.quantidade}x {item.peca}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {product?.nome ?? 'Bordado não selecionado'} ·{' '}
                        {item.local_bordado || 'Local não informado'} ·{' '}
                        {item.descricao_bordado || 'Sem descrição'}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-frenchRose">
                      {formatCurrency(itemSubtotal(item)) ?? 'R$ 0,00'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {form.observacoes ? (
            <SummaryBlock title="Observações">
              <p className="text-sm leading-relaxed text-slate-600">
                {form.observacoes}
              </p>
            </SummaryBlock>
          ) : null}
        </section>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Total</p>
          <p className="text-2xl font-extrabold text-ink">
            {formatCurrency(total) ?? 'R$ 0,00'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="min-h-11 bg-slate-100 px-4 text-sm text-slate-700 hover:bg-slate-200"
            onClick={() =>
              step === 1 ? navigate('/pedidos') : setStep((step - 1) as OrderStep)
            }
            type="button"
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step < 3 ? (
            <Button
              className="min-h-11 px-4 text-sm"
              onClick={() => goToStep((step + 1) as OrderStep)}
              type="button"
            >
              Continuar
            </Button>
          ) : (
            <Button
              className="min-h-11 px-4 text-sm"
              isLoading={isSaving}
              loadingLabel="Salvando..."
              onClick={() => {
                void handleSubmit();
              }}
              type="button"
            >
              Confirmar Encomenda
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function OrderStepIndicator({ currentStep }: { currentStep: OrderStep }) {
  return (
    <nav
      aria-label="Etapas da nova encomenda"
      className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm"
    >
      <ol className="grid gap-3 sm:grid-cols-3">
        {orderSteps.map((stepItem) => {
          const isActive = stepItem.id === currentStep;
          const isDone = stepItem.id < currentStep;

          return (
            <li className="flex items-center gap-3" key={stepItem.id}>
              <span
                className={[
                  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold',
                  isActive || isDone
                    ? 'bg-frenchRose text-white'
                    : 'bg-slate-100 text-slate-400',
                ].join(' ')}
              >
                {stepItem.id}
              </span>
              <div>
                <p
                  className={[
                    'text-sm font-extrabold',
                    isActive ? 'text-ink' : 'text-slate-500',
                  ].join(' ')}
                >
                  {stepItem.label}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  {isDone ? 'Concluída' : isActive ? 'Em andamento' : 'Próxima'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SummaryBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
