import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { TextField } from '../../components/ui/forms';
import { ConfirmDialog } from '../../components/ui/dialogs';
import { AlertMessage } from '../../components/ui/feedback';
import { ApiError } from '../../services/api';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import {
  createOrderItem,
  deleteOrderItem,
  getOrder,
  listOrderItems,
  listProducts,
  OrderItemPayload,
  OrderPatchPayload,
  Product,
  updateOrderItem,
  updateOrder,
} from '../../services/orders';
import { formatCurrency } from '../../utils/format';
import { parseMoney, toDecimalString } from './orderUtils';

const channelOptions = ['Instagram', 'WhatsApp', 'Facebook', 'Marketplace', 'Outro'];
const paymentMethodOptions = ['Pix', 'Dinheiro', 'Cartao', 'Transferencia'];

type OrderEditForm = {
  cliente: string;
  prazo: string;
  canal: string;
  forma_pagamento: string;
  valor_pago: string;
  status: string;
  urgente: boolean;
  precisa_matriz: boolean;
  data_entrega: string;
  observacoes_entrega: string;
  motivo_cancelamento: string;
  observacoes: string;
};

type EditableOrderItem = {
  key: string;
  id?: number;
  produto: string;
  peca: string;
  local_bordado: string;
  descricao_bordado: string;
  quantidade: string;
  valor_unitario: string;
};

function emptyOrderItem(): EditableOrderItem {
  return {
    key: `new-${Date.now()}-${Math.random()}`,
    produto: '',
    peca: '',
    local_bordado: '',
    descricao_bordado: '',
    quantidade: '1',
    valor_unitario: '',
  };
}

function calculateItemTotal(item: EditableOrderItem) {
  const quantity = Number.parseInt(item.quantidade, 10);
  return (Number.isNaN(quantity) ? 0 : quantity) * parseMoney(item.valor_unitario);
}

const initialForm: OrderEditForm = {
  cliente: '',
  prazo: '',
  canal: 'WhatsApp',
  forma_pagamento: 'Pix',
  valor_pago: '0.00',
  status: 'Recebido',
  urgente: false,
  precisa_matriz: true,
  data_entrega: '',
  observacoes_entrega: '',
  motivo_cancelamento: '',
  observacoes: '',
};

function statusLabel(status: string) {
  return status === 'Em Producao' ? 'Em Produção' : status;
}

function availableStatusOptions(
  currentStatus: string,
  precisaMatriz: boolean,
  totalValue: string,
  paidValue: string,
) {
  const statuses = [currentStatus];
  const total = Number(totalValue);
  const paid = Number(paidValue);
  const financiallyReleased =
    Number.isFinite(total) &&
    Number.isFinite(paid) &&
    total >= 0 &&
    (total < 50 || paid * 2 >= total);

  if (currentStatus === 'Recebido' && financiallyReleased) {
    statuses.push(precisaMatriz ? 'Aguardando Matriz' : 'Em Producao');
  } else if (currentStatus === 'Aguardando Matriz' && financiallyReleased) {
    statuses.push('Em Producao');
  } else if (currentStatus === 'Em Producao') {
    statuses.push('Pronto para Entrega');
  } else if (currentStatus === 'Pronto para Entrega') {
    statuses.push('Entregue');
  }

  if (currentStatus !== 'Entregue' && currentStatus !== 'Cancelado') {
    statuses.push('Cancelado');
  }

  return statuses;
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

export function OrderEditPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<OrderEditForm>(initialForm);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<EditableOrderItem[]>([]);
  const [originalItems, setOriginalItems] = useState<EditableOrderItem[]>([]);
  const [originalStatus, setOriginalStatus] = useState('Recebido');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const orderId = Number(id);

    async function loadOrder() {
      if (!orderId) {
        setError('Pedido inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const [order, clientsResponse, itemResponse, productResponse] = await Promise.all([
          getOrder(orderId),
          listClients(),
          listOrderItems(),
          listProducts(),
        ]);

        if (isMounted) {
          const orderItems = itemResponse
            .filter((item) => item.pedido === orderId)
            .map((item) => ({
              key: String(item.id),
              id: item.id,
              produto: String(item.produto),
              peca: item.peca ?? '',
              local_bordado: item.local_bordado ?? '',
              descricao_bordado: item.descricao_bordado ?? '',
              quantidade: String(item.quantidade),
              valor_unitario: item.valor_unitario,
            }));
          setForm({
            cliente: String(order.cliente),
            prazo: order.prazo ?? '',
            canal: order.canal ?? 'WhatsApp',
            forma_pagamento: order.forma_pagamento ?? 'Pix',
            valor_pago: order.valor_pago,
            status: order.status,
            urgente: order.urgente,
            precisa_matriz: order.precisa_matriz,
            data_entrega: order.data_entrega ?? '',
            observacoes_entrega: order.observacoes_entrega ?? '',
            motivo_cancelamento: order.motivo_cancelamento ?? '',
            observacoes: order.observacoes ?? '',
          });
          setItems(orderItems);
          setOriginalItems(orderItems);
          setOriginalStatus(order.status);
          setProducts(productResponse);
          setClients(clientsResponse);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o pedido.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateField(field: keyof OrderEditForm, value: string | boolean) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function updateItem(key: string, field: keyof EditableOrderItem, value: string) {
    setItems((currentItems) => currentItems.map((item) => {
      if (item.key !== key) return item;
      if (field === 'produto') {
        const product = products.find((currentProduct) => String(currentProduct.id) === value);
        return {
          ...item,
          produto: value,
          peca: product?.nome ?? item.peca,
          valor_unitario: product?.preco_base ?? item.valor_unitario,
        };
      }
      return { ...item, [field]: value };
    }));
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, emptyOrderItem()]);
  }

  function removeItem(key: string) {
    setItems((currentItems) => currentItems.filter((item) => item.key !== key));
  }

  function getItemsTotal() {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    const orderId = Number(id);

    if (!orderId) {
      setError('Pedido inválido.');
      setShowConfirm(false);
      return;
    }

    if (!items.length || items.some((item) => (
      !item.produto ||
      !Number.isInteger(Number(item.quantidade)) ||
      Number(item.quantidade) < 1 ||
      parseMoney(item.valor_unitario) <= 0
    ))) {
      setError('Inclua ao menos um item e informe produto, quantidade e valor unitário válidos.');
      setShowConfirm(false);
      return;
    }

    const payload: OrderPatchPayload = {
      cliente: Number(form.cliente),
      prazo: form.prazo,
      canal: form.canal,
      forma_pagamento: form.forma_pagamento,
      valor_pago: form.valor_pago,
      status: form.status,
      urgente: form.urgente,
      precisa_matriz: form.precisa_matriz,
      observacoes: form.observacoes,
    };

    setIsSaving(true);
    setError('');

    try {
      await updateOrder(orderId, { ...payload, status: originalStatus });

      const currentItemIds = new Set(items.flatMap((item) => item.id ? [item.id] : []));
      const removedItems = originalItems.filter((item) => item.id && !currentItemIds.has(item.id));

      for (const item of items) {
        const itemPayload: OrderItemPayload = {
          pedido: orderId,
          produto: Number(item.produto),
          peca: item.peca,
          local_bordado: item.local_bordado,
          descricao_bordado: item.descricao_bordado,
          quantidade: Number(item.quantidade),
          valor_unitario: toDecimalString(parseMoney(item.valor_unitario)),
        };

        if (item.id) {
          await updateOrderItem(item.id, itemPayload);
        } else {
          await createOrderItem(itemPayload);
        }
      }

      for (const item of removedItems) {
        await deleteOrderItem(item.id!);
      }

      const statusPayload: OrderPatchPayload = { status: form.status };
      if (form.status === 'Entregue') {
        statusPayload.data_entrega = form.data_entrega;
        statusPayload.observacoes_entrega = form.observacoes_entrega;
      }
      if (form.status === 'Cancelado') {
        statusPayload.motivo_cancelamento = form.motivo_cancelamento;
      }
      const order = await updateOrder(orderId, statusPayload);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate(`/pedidos/${order.id}`, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof ApiError
        ? saveError.message
        : 'Não foi possível salvar as alterações do pedido.');
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <AppShell activePage="Pedidos">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">
          Dashboard / Pedidos / Editar Pedido
        </p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Editar Pedido
        </h1>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="grid gap-3 p-5">
            {[0, 1, 2, 3].map((item) => (
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" key={item} />
            ))}
          </div>
        ) : (
          <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-2" htmlFor="cliente">
                <span className="text-sm font-bold text-mauve">Cliente *</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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

              <TextField
                label="Prazo *"
                name="prazo"
                onChange={(event) => updateField('prazo', event.target.value)}
                required
                type="date"
                value={form.prazo}
              />

              <label className="grid gap-2" htmlFor="status">
                <span className="text-sm font-bold text-mauve">Status</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="status"
                  onChange={(event) => updateField('status', event.target.value)}
                  value={form.status}
                >
                  {availableStatusOptions(
                    form.status,
                    form.precisa_matriz,
                      toDecimalString(getItemsTotal()),
                    form.valor_pago,
                  ).map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2" htmlFor="canal">
                <span className="text-sm font-bold text-mauve">Canal</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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

              <label className="grid gap-2" htmlFor="forma_pagamento">
                <span className="text-sm font-bold text-mauve">Forma de pagamento</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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

              <div className="grid content-center gap-2">
                <span className="text-sm font-bold text-mauve">Total calculado</span>
                <span className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-extrabold text-ink">
                  {formatCurrency(getItemsTotal()) ?? 'R$ 0,00'}
                </span>
              </div>

              <TextField
                label="Valor pago até agora"
                min="0"
                name="valor_pago"
                onChange={(event) => updateField('valor_pago', event.target.value)}
                step="0.01"
                type="number"
                value={form.valor_pago}
              />

              <label
                className="flex min-h-12 items-center gap-3 rounded-lg border border-frenchRose/20 bg-white px-4"
                htmlFor="urgente"
              >
                <input
                  checked={form.urgente}
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
                className="flex min-h-12 items-center gap-3 rounded-lg border border-frenchRose/20 bg-white px-4"
                htmlFor="precisa_matriz"
              >
                <input
                  checked={form.precisa_matriz}
                  className="h-4 w-4 rounded border-frenchRose/30 text-frenchRose focus:ring-frenchRose/20"
                  id="precisa_matriz"
                  onChange={(event) =>
                    updateField('precisa_matriz', event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="text-sm font-bold text-mauve">
                  Precisa de matriz para bordado
                </span>
              </label>

              {form.status === 'Entregue' ? (
                <TextField
                  label="Data de entrega"
                  name="data_entrega"
                  onChange={(event) => updateField('data_entrega', event.target.value)}
                  type="date"
                  value={form.data_entrega}
                />
              ) : null}
            </div>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-extrabold text-ink">Itens do pedido</h2>
                <Button className="min-h-9 px-3 text-xs" onClick={addItem} type="button">
                  <Plus aria-hidden className="h-4 w-4" />
                  Adicionar item
                </Button>
              </div>
              <div className="grid gap-4 p-4">
                {items.map((item, index) => (
                  <article className="grid gap-3 rounded-md border border-slate-200 p-4" key={item.key}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-ink">Item {index + 1}</h3>
                      <button
                        aria-label={`Remover item ${index + 1}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        disabled={items.length === 1}
                        onClick={() => removeItem(item.key)}
                        title="Remover item"
                        type="button"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="grid gap-2 lg:col-span-2" htmlFor={`produto-${item.key}`}>
                        <span className="text-sm font-bold text-mauve">Produto *</span>
                        <select
                          className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                          id={`produto-${item.key}`}
                          onChange={(event) => updateItem(item.key, 'produto', event.target.value)}
                          required
                          value={item.produto}
                        >
                          <option value="">Selecione</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.nome}</option>
                          ))}
                        </select>
                      </label>
                      <TextField
                        label="Peça"
                        name={`peca-${item.key}`}
                        onChange={(event) => updateItem(item.key, 'peca', event.target.value)}
                        value={item.peca}
                      />
                      <TextField
                        label="Quantidade *"
                        min="1"
                        name={`quantidade-${item.key}`}
                        onChange={(event) => updateItem(item.key, 'quantidade', event.target.value)}
                        required
                        type="number"
                        value={item.quantidade}
                      />
                      <TextField
                        label="Valor unitário *"
                        min="0.01"
                        name={`valor-${item.key}`}
                        onChange={(event) => updateItem(item.key, 'valor_unitario', event.target.value)}
                        required
                        step="0.01"
                        type="number"
                        value={item.valor_unitario}
                      />
                      <TextField
                        label="Local do bordado"
                        name={`local-${item.key}`}
                        onChange={(event) => updateItem(item.key, 'local_bordado', event.target.value)}
                        value={item.local_bordado}
                      />
                      <TextField
                        label="Descrição do bordado"
                        name={`descricao-${item.key}`}
                        onChange={(event) => updateItem(item.key, 'descricao_bordado', event.target.value)}
                        value={item.descricao_bordado}
                      />
                      <div className="grid content-center gap-1">
                        <span className="text-sm font-bold text-mauve">Subtotal</span>
                        <span className="font-extrabold text-ink">
                          {formatCurrency(calculateItemTotal(item)) ?? 'R$ 0,00'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
                <p className="text-right text-lg font-extrabold text-ink">
                  Total dos itens: {formatCurrency(getItemsTotal()) ?? 'R$ 0,00'}
                </p>
              </div>
            </section>

            {form.status === 'Entregue' ? (
              <label className="grid gap-2" htmlFor="observacoes_entrega">
                <span className="text-sm font-bold text-mauve">
                  Observações da entrega
                </span>
                <textarea
                  className="min-h-24 rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="observacoes_entrega"
                  onChange={(event) =>
                    updateField('observacoes_entrega', event.target.value)
                  }
                  value={form.observacoes_entrega}
                />
              </label>
            ) : null}

            {form.status === 'Cancelado' ? (
              <label className="grid gap-2" htmlFor="motivo_cancelamento">
                <span className="text-sm font-bold text-mauve">
                  Motivo do cancelamento *
                </span>
                <textarea
                  className="min-h-24 rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="motivo_cancelamento"
                  onChange={(event) =>
                    updateField('motivo_cancelamento', event.target.value)
                  }
                  required
                  value={form.motivo_cancelamento}
                />
              </label>
            ) : null}

            <label className="grid gap-2" htmlFor="observacoes">
              <span className="text-sm font-bold text-mauve">Observações</span>
              <textarea
                className="min-h-28 rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                id="observacoes"
                onChange={(event) => updateField('observacoes', event.target.value)}
                value={form.observacoes}
              />
            </label>

            <AlertMessage className="mb-0">{error}</AlertMessage>
            {showSuccess && (
              <AlertMessage className="mb-0 bg-green-100 border-green-400 text-green-700">
                Pedido salvo com sucesso!
              </AlertMessage>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={() => navigate(`/pedidos/${id}`)}
                type="button"
              >
                Cancelar
              </button>
              <Button
                className="min-h-11 px-5 text-sm"
                isLoading={isSaving}
                loadingLabel="Salvando..."
                type="submit"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </section>
      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        isLoading={isSaving}
        title="Confirmar alteração"
        description="Você tem certeza que deseja salvar as alterações? Esta ação não pode ser desfeita."
        tone="warning"
        confirmLabel="Salvar"
        cancelLabel="Cancelar"
      />
    </AppShell>
  );
}
