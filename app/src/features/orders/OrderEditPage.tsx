import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { TextField } from '../../components/ui/forms';
import { ConfirmDialog } from '../../components/ui/dialogs';
import { AlertMessage } from '../../components/ui/feedback';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import {
  getOrder,
  OrderPatchPayload,
  updateOrder,
} from '../../services/orders';

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

type OrderEditForm = {
  cliente: string;
  prazo: string;
  canal: string;
  forma_pagamento: string;
  status_pagamento: string;
  status: string;
  urgente: boolean;
  data_entrega: string;
  observacoes_entrega: string;
  motivo_cancelamento: string;
  observacoes: string;
  valor_total: string;
};

const initialForm: OrderEditForm = {
  cliente: '',
  prazo: '',
  canal: 'WhatsApp',
  forma_pagamento: 'Pix',
  status_pagamento: 'Pendente',
  status: 'Recebido',
  urgente: false,
  data_entrega: '',
  observacoes_entrega: '',
  motivo_cancelamento: '',
  observacoes: '',
  valor_total: '0.00',
};

function statusLabel(status: string) {
  return status === 'Em Producao' ? 'Em Produção' : status;
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
        const [order, clientsResponse] = await Promise.all([
          getOrder(orderId),
          listClients(),
        ]);

        if (isMounted) {
          setForm({
            cliente: String(order.cliente),
            prazo: order.prazo ?? '',
            canal: order.canal ?? 'WhatsApp',
            forma_pagamento: order.forma_pagamento ?? 'Pix',
            status_pagamento: order.status_pagamento ?? 'Pendente',
            status: order.status,
            urgente: order.urgente,
            data_entrega: order.data_entrega ?? '',
            observacoes_entrega: order.observacoes_entrega ?? '',
            motivo_cancelamento: order.motivo_cancelamento ?? '',
            observacoes: order.observacoes ?? '',
            valor_total: order.valor_total,
          });
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

    const payload: OrderPatchPayload = {
      cliente: Number(form.cliente),
      prazo: form.prazo,
      canal: form.canal,
      forma_pagamento: form.forma_pagamento,
      status_pagamento: form.status_pagamento,
      status: form.status,
      urgente: form.urgente,
      observacoes: form.observacoes,
      valor_total: form.valor_total,
    };

    if (form.status === 'Entregue') {
      payload.data_entrega = form.data_entrega;
      payload.observacoes_entrega = form.observacoes_entrega;
    }

    if (form.status === 'Cancelado') {
      payload.motivo_cancelamento = form.motivo_cancelamento;
    }

    setIsSaving(true);
    setError('');

    try {
      const order = await updateOrder(orderId, payload);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate(`/pedidos/${order.id}`, { replace: true });
    } catch {
      setError('Não foi possível salvar as alterações do pedido.');
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
                  {statusOptions.map((status) => (
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

              <label className="grid gap-2" htmlFor="status_pagamento">
                <span className="text-sm font-bold text-mauve">Status pagamento</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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

              <TextField
                label="Valor total *"
                min="0"
                name="valor_total"
                onChange={(event) => updateField('valor_total', event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.valor_total}
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
