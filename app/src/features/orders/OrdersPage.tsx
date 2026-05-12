import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowRight,
  Columns3,
  Inbox,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import {
  createOrder,
  createOrderItem,
  deleteOrder,
  listOrderItems,
  listOrders,
  listProducts,
  Order,
  OrderItem,
  OrderItemPayload,
  OrderPayload,
  Product,
  updateOrder,
} from '../../services/orders';
import { formatCurrency } from '../../utils/format';

type OrdersView = 'list' | 'board';
const ordersViewStorageKey = 'bordados:orders-view';

const statusOptions = [
  'Recebido',
  'Aguardando Matriz',
  'Em Producao',
  'Pronto para Entrega',
  'Entregue',
  'Cancelado',
];

const paymentOptions = ['Pendente', 'Parcial', 'Pago'];
const channelOptions = ['Instagram', 'WhatsApp', 'Facebook', 'Marketplace', 'Outro'];
const paymentMethodOptions = ['Pix', 'Dinheiro', 'Cartao', 'Transferencia'];

type OrderItemForm = {
  id: string;
  peca: string;
  produto: string;
  descricao_bordado: string;
  quantidade: string;
  valor_unitario: string;
};

const initialOrderForm: Omit<OrderPayload, 'cliente' | 'valor_total'> & {
  cliente: string;
} = {
  cliente: '',
  prazo: '',
  canal: 'WhatsApp',
  forma_pagamento: 'Pix',
  status_pagamento: 'Pendente',
  observacoes: '',
};

function createEmptyItem(): OrderItemForm {
  return {
    id: String(Date.now() + Math.random()),
    peca: '',
    produto: '',
    descricao_bordado: '',
    quantidade: '1',
    valor_unitario: '',
  };
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatOrderNumber(id: number) {
  return `#${String(id).padStart(3, '0')}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function statusLabel(status: string | null) {
  if (status === 'Em Producao') {
    return 'Em Produção';
  }

  return status || 'Recebido';
}

function getNextStatus(status: string) {
  const currentIndex = statusOptions.indexOf(status);

  if (currentIndex < 0 || currentIndex === statusOptions.length - 1) {
    return null;
  }

  return statusOptions[currentIndex + 1];
}

function paymentLabel(payment: string | null) {
  return payment || 'Pendente';
}

function paymentMethodLabel(paymentMethod: string) {
  if (paymentMethod === 'Cartao') {
    return 'Cartão';
  }

  if (paymentMethod === 'Transferencia') {
    return 'Transferência';
  }

  return paymentMethod;
}

function parseMoney(value: string) {
  const normalizedValue = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const parsedValue = Number.parseFloat(normalizedValue);

  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function toDecimalString(value: number) {
  return value.toFixed(2);
}

function itemSubtotal(item: OrderItemForm) {
  const quantity = Number.parseInt(item.quantidade, 10);

  return (Number.isNaN(quantity) ? 0 : quantity) * parseMoney(item.valor_unitario);
}

function statusClassName(status: string | null) {
  const normalizedStatus = normalizeText(statusLabel(status));

  if (normalizedStatus === 'em producao') {
    return 'bg-blue-50 text-blue-700';
  }

  if (normalizedStatus === 'aguardando matriz') {
    return 'bg-purple-50 text-purple-700';
  }

  if (normalizedStatus === 'entregue') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (normalizedStatus === 'cancelado') {
    return 'bg-rose-50 text-rose-700';
  }

  if (normalizedStatus === 'pronto para entrega') {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function paymentClassName(payment: string | null) {
  if (payment === 'Pago') {
    return 'text-emerald-600';
  }

  if (payment === 'Parcial') {
    return 'text-amber-600';
  }

  return 'text-orange-500';
}

function buildItemSummary(
  orderId: number,
  itemsByOrder: Map<number, OrderItem[]>,
  productsById: Map<number, Product>,
) {
  const items = itemsByOrder.get(orderId) ?? [];

  if (items.length === 0) {
    return '-';
  }

  return items
    .slice(0, 2)
    .map((item) => {
      const product = productsById.get(item.produto);
      const description = item.descricao_bordado || product?.nome || item.peca || 'Item';

      return `${item.quantidade}x ${description}`;
    })
    .join(', ')
    .concat(items.length > 2 ? ` +${items.length - 2}` : '');
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
  const [search, setSearch] = useState('');
  const [ordersView, setOrdersView] = useState<OrdersView>(getInitialOrdersView);
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
            listOrders(),
            listClients(),
            listOrderItems(),
            listProducts(),
          ]);

        if (isMounted) {
          setOrders(ordersResponse);
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
  }, []);

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

  const filteredOrders = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return orders.filter((order) => {
      const client = clientsById.get(order.cliente);
      const itemSummary = buildItemSummary(order.id, itemsByOrder, productsById);
      const searchableText = normalizeText(
        [
          formatOrderNumber(order.id),
          client?.nome ?? '',
          itemSummary,
          order.observacoes ?? '',
        ].join(' '),
      );

      return (
        (!statusFilter || order.status === statusFilter) &&
        (!paymentFilter || paymentLabel(order.status_pagamento) === paymentFilter) &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [clientsById, itemsByOrder, orders, paymentFilter, productsById, search, statusFilter]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateStatusFilter(event: ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(event.target.value);
  }

  function updatePaymentFilter(event: ChangeEvent<HTMLSelectElement>) {
    setPaymentFilter(event.target.value);
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
        <div className="grid gap-3 border-b border-slate-100 px-4 py-3 lg:grid-cols-[180px_180px_1fr_auto]">
          <label className="sr-only" htmlFor="status-filter">
            Filtrar por status
          </label>
          <select
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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

          <label className="sr-only" htmlFor="payment-filter">
            Filtrar por pagamento
          </label>
          <select
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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

          <label className="relative block" htmlFor="order-search">
            <span className="sr-only">Buscar cliente ou número do pedido</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
              id="order-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente ou nº pedido"
              type="search"
              value={search}
            />
          </label>

          <div className="inline-grid min-h-10 grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-extrabold text-slate-500">
            <button
              aria-label="Visualizar pedidos em lista"
              className={[
                'inline-flex items-center justify-center gap-2 rounded-md px-3 transition',
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
                'inline-flex items-center justify-center gap-2 rounded-md px-3 transition',
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
        </div>

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
      </section>
    </AppShell>
  );
}

export function NewOrderPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialOrderForm);
  const [items, setItems] = useState<OrderItemForm[]>([createEmptyItem()]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
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

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const embroideryProducts = products.filter(
    (product) => product.ativo && product.tipo === 'bordado',
  );
  const productOptions = embroideryProducts.length > 0
    ? embroideryProducts
    : products.filter((product) => product.ativo);
  const total = items.reduce((currentTotal, item) => currentTotal + itemSubtotal(item), 0);

  function updateField(field: keyof typeof form, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    const orderPayload: OrderPayload = {
      cliente: Number(form.cliente),
      prazo: form.prazo,
      canal: form.canal,
      forma_pagamento: form.forma_pagamento,
      status_pagamento: form.status_pagamento,
      observacoes: form.observacoes,
      valor_total: toDecimalString(total),
    };

    try {
      const order = await createOrder(orderPayload);
      const itemPayloads: OrderItemPayload[] = items.map((item) => ({
        pedido: order.id,
        produto: Number(item.produto),
        peca: item.peca,
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

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Dados do Pedido</h2>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2" htmlFor="cliente">
              <span className="text-sm font-bold text-mauve">Cliente *</span>
              <select
                className="min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                disabled={isLoadingOptions}
                id="cliente"
                onChange={(event) => updateField('cliente', event.target.value)}
                required
                value={form.cliente}
              >
                <option value="">Selecione</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nome}
                  </option>
                ))}
              </select>
            </label>

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

            <label className="grid gap-2 sm:col-span-2 lg:col-span-3" htmlFor="observacoes">
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
                  <h3 className="text-sm font-extrabold text-ink">Item {index + 1}</h3>
                  <button
                    aria-label={`Remover item ${index + 1}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={items.length === 1}
                    onClick={() => removeItem(item.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr_1.4fr_120px_150px_150px]">
                  <TextField
                    label="Peça *"
                    name={`peca-${item.id}`}
                    onChange={(event) => updateItem(item.id, 'peca', event.target.value)}
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

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Total</p>
            <p className="text-2xl font-extrabold text-ink">
              {formatCurrency(total) ?? 'R$ 0,00'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="min-h-11 bg-slate-100 px-4 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => navigate('/pedidos')}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              className="min-h-11 px-4 text-sm"
              isLoading={isSaving}
              loadingLabel="Salvando..."
              type="submit"
            >
              Salvar Encomenda
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function OrdersTable({
  clientsById,
  deletingId,
  itemsByOrder,
  onAdvanceStatus,
  onEdit,
  onDelete,
  orders,
  productsById,
  updatingStatusId,
}: {
  clientsById: Map<number, Client>;
  deletingId: number | null;
  itemsByOrder: Map<number, OrderItem[]>;
  onAdvanceStatus: (order: Order, status: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  orders: Order[];
  productsById: Map<number, Product>;
  updatingStatusId: number | null;
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
          <tr>
            <th className="px-4 py-3">Pedido / Cliente</th>
            <th className="px-4 py-3">Itens</th>
            <th className="px-4 py-3">Prazo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Valor / Pgto.</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const client = clientsById.get(order.cliente);
            const itemSummary = buildItemSummary(order.id, itemsByOrder, productsById);
            const total = formatCurrency(order.valor_total) ?? 'R$ 0,00';
            const payment = paymentLabel(order.status_pagamento);
            const nextStatus = getNextStatus(order.status);

            return (
              <tr
                className="cursor-pointer bg-white align-top transition hover:bg-chantilly/20"
                key={order.id}
                onClick={() => navigate(`/pedidos/${order.id}`)}
              >
                <td className="px-4 py-3">
                  <p className="font-extrabold text-ink">{formatOrderNumber(order.id)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {client?.nome ?? `Cliente #${order.cliente}`}
                  </p>
                </td>
                <td className="max-w-80 px-4 py-3 text-slate-600">{itemSummary}</td>
                <td className="px-4 py-3">
                  <p className="font-extrabold text-frenchRose">
                    {formatDate(order.prazo)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.data_pedido ? `Entrada ${formatDate(order.data_pedido)}` : '-'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${statusClassName(
                      order.status,
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-extrabold text-ink">{total}</p>
                  <p className={`mt-1 text-xs font-bold ${paymentClassName(payment)}`}>
                    {payment}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    aria-label={`Avançar pedido ${formatOrderNumber(order.id)} para o próximo status`}
                    className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!nextStatus || updatingStatusId === order.id}
                    onClick={(event) => {
                      event.stopPropagation();

                      if (nextStatus) {
                        onAdvanceStatus(order, nextStatus);
                      }
                    }}
                    title={
                      nextStatus
                        ? `Avançar para ${statusLabel(nextStatus)}`
                        : 'Pedido no último status'
                    }
                    type="button"
                  >
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Editar pedido ${formatOrderNumber(order.id)}`}
                    className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(order);
                    }}
                    title="Editar pedido"
                    type="button"
                  >
                    <Pencil aria-hidden className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Excluir pedido ${formatOrderNumber(order.id)}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingId === order.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(order);
                    }}
                    title="Excluir pedido"
                    type="button"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrdersBoard({
  clientsById,
  deletingId,
  itemsByOrder,
  onDelete,
  onEdit,
  onStatusChange,
  orders,
  productsById,
  updatingStatusId,
}: {
  clientsById: Map<number, Client>;
  deletingId: number | null;
  itemsByOrder: Map<number, OrderItem[]>;
  onDelete: (order: Order) => void;
  onEdit: (order: Order) => void;
  onStatusChange: (order: Order, status: string) => void;
  orders: Order[];
  productsById: Map<number, Product>;
  updatingStatusId: number | null;
}) {
  const navigate = useNavigate();
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);

  useEffect(() => {
    setOrderedIds((currentIds) => {
      const orderIds = orders.map((order) => order.id);
      const keptIds = currentIds.filter((id) => orderIds.includes(id));
      const newIds = orderIds.filter((id) => !keptIds.includes(id));

      return [...keptIds, ...newIds];
    });
  }, [orders]);

  const orderedOrders = useMemo(() => {
    const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));

    return [...orders].sort(
      (leftOrder, rightOrder) =>
        (orderIndex.get(leftOrder.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderIndex.get(rightOrder.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [orderedIds, orders]);

  const ordersByStatus = useMemo(() => {
    const groupedOrders = new Map<string, Order[]>();

    statusOptions.forEach((status) => {
      groupedOrders.set(status, []);
    });

    orderedOrders.forEach((order) => {
      const status = statusOptions.includes(order.status) ? order.status : 'Recebido';
      groupedOrders.set(status, [...(groupedOrders.get(status) ?? []), order]);
    });

    return groupedOrders;
  }, [orderedOrders]);

  function moveOrderBefore(draggedOrderId: number, targetOrderId: number) {
    if (draggedOrderId === targetOrderId) {
      return;
    }

    setOrderedIds((currentIds) => {
      const nextIds = currentIds.filter((id) => id !== draggedOrderId);
      const targetIndex = nextIds.indexOf(targetOrderId);

      if (targetIndex < 0) {
        return [...nextIds, draggedOrderId];
      }

      nextIds.splice(targetIndex, 0, draggedOrderId);
      return nextIds;
    });
  }

  function moveOrderToColumnEnd(orderId: number) {
    setOrderedIds((currentIds) => [
      ...currentIds.filter((id) => id !== orderId),
      orderId,
    ]);
  }

  function handleDragStart(event: DragEvent<HTMLElement>, order: Order) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(order.id));
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: string) {
    event.preventDefault();
    setDragOverStatus(null);

    const orderId = Number(event.dataTransfer.getData('text/plain'));
    const order = orders.find((currentOrder) => currentOrder.id === orderId);

    if (!order) {
      return;
    }

    moveOrderToColumnEnd(order.id);
    onStatusChange(order, status);
  }

  function handleCardDrop(event: DragEvent<HTMLElement>, targetOrder: Order) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverStatus(null);

    const draggedOrderId = Number(event.dataTransfer.getData('text/plain'));
    const draggedOrder = orders.find(
      (currentOrder) => currentOrder.id === draggedOrderId,
    );

    if (!draggedOrder || draggedOrder.id === targetOrder.id) {
      return;
    }

    moveOrderBefore(draggedOrder.id, targetOrder.id);

    if (draggedOrder.status !== targetOrder.status) {
      onStatusChange(draggedOrder, targetOrder.status);
    }
  }

  return (
    <div className="overflow-x-auto bg-slate-50/60 p-4">
      <div className="grid min-w-[1180px] grid-cols-6 gap-3">
        {statusOptions.map((status) => {
          const columnOrders = ordersByStatus.get(status) ?? [];
          const isDraggingOver = dragOverStatus === status;

          return (
            <section
              className={[
                'flex min-h-[520px] flex-col rounded-lg border bg-white shadow-sm transition',
                isDraggingOver
                  ? 'border-frenchRose bg-chantilly/20 ring-4 ring-frenchRose/10'
                  : 'border-slate-200',
              ].join(' ')}
              key={status}
              onDragLeave={() => setDragOverStatus(null)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDragOverStatus(status);
              }}
              onDrop={(event) => handleDrop(event, status)}
            >
              <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
                <h3 className="text-xs font-extrabold text-ink">
                  {statusLabel(status)}
                </h3>
                <span className="rounded-full bg-chantilly/45 px-2 py-1 text-[11px] font-extrabold text-frenchRose">
                  {columnOrders.length}
                </span>
              </header>

              <div className="grid flex-1 content-start gap-3 p-3">
                {columnOrders.length > 0 ? (
                  columnOrders.map((order) => {
                    const client = clientsById.get(order.cliente);
                    const itemSummary = buildItemSummary(
                      order.id,
                      itemsByOrder,
                      productsById,
                    );
                    const payment = paymentLabel(order.status_pagamento);
                    const isUpdating = updatingStatusId === order.id;

                    return (
                      <article
                        className={[
                          'cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition',
                          'hover:-translate-y-0.5 hover:border-frenchRose/30 hover:shadow-md',
                          isUpdating ? 'opacity-60' : '',
                        ].join(' ')}
                        draggable={!isUpdating}
                        key={order.id}
                        onClick={() => navigate(`/pedidos/${order.id}`)}
                        onDragEnd={() => setDragOverStatus(null)}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          setDragOverStatus(order.status);
                        }}
                        onDragStart={(event) => handleDragStart(event, order)}
                        onDrop={(event) => handleCardDrop(event, order)}
                        title="Arraste para mudar o status ou a prioridade visual"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-ink">
                              {client?.nome ?? `Cliente #${order.cliente}`}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-frenchRose">
                              {formatDate(order.prazo)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${paymentClassName(
                              payment,
                            )}`}
                          >
                            {payment}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                          {itemSummary}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-ink">
                            {formatCurrency(order.valor_total) ?? 'R$ 0,00'}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              aria-label={`Editar pedido de ${
                                client?.nome ?? 'cliente não identificado'
                              }`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                              onClick={(event) => {
                                event.stopPropagation();
                                onEdit(order);
                              }}
                              title="Editar pedido"
                              type="button"
                            >
                              <Pencil aria-hidden className="h-4 w-4" />
                            </button>
                            <button
                              aria-label={`Excluir pedido de ${
                                client?.nome ?? 'cliente não identificado'
                              }`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={deletingId === order.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                onDelete(order);
                              }}
                              title="Excluir pedido"
                              type="button"
                            >
                              <Trash2 aria-hidden className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center">
                    <p className="text-xs font-bold text-slate-400">
                      Arraste pedidos para cá
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
