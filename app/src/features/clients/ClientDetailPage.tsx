import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { DescriptionItem, DescriptionList } from '../../components/ui/DescriptionList';
import { AlertMessage, EmptyState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Surface, SurfaceHeader } from '../../components/ui/Surface';
import { getSession } from '../../services/auth';
import { Client, getClient } from '../../services/clients';
import { listOrders, Order } from '../../services/orders';
import { formatCurrency } from '../../utils/format';
import {
  formatDate,
  formatOrderNumber,
  paymentClassName,
  paymentLabel,
  statusClassName,
  statusLabel,
} from '../orders/orderUtils';

export function ClientDetailPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const clientId = Number(id);

    async function loadClient() {
      if (!clientId) {
        setError('Cliente inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const [clientResponse, ordersResponse] = await Promise.all([
          getClient(clientId),
          listOrders(),
        ]);

        if (isMounted) {
          setClient(clientResponse);
          setOrders(ordersResponse.filter((order) => order.cliente === clientId));
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o cliente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadClient();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const totalSpent = orders
    .filter((order) => order.status !== 'Cancelado')
    .reduce((total, order) => total + Number.parseFloat(order.valor_total || '0'), 0);

  return (
    <AppShell activePage="Clientes">
      <PageHeader
        actions={
          <Button
            className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
            onClick={() => navigate(`/clientes/${id}/editar`)}
            title="Editar cliente"
            type="button"
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Editar
          </Button>
        }
        breadcrumb="Dashboard / Clientes"
        title={client?.nome ?? 'Detalhes do Cliente'}
      />

      <AlertMessage>{error}</AlertMessage>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-white shadow-sm" />
      ) : client ? (
        <div className="grid gap-5">
          <Surface>
            <SurfaceHeader>
              <h2 className="text-sm font-extrabold text-ink">
                Informações do Cliente
              </h2>
            </SurfaceHeader>
            <DescriptionList>
              <DescriptionItem label="Nome completo" value={client.nome} />
              <DescriptionItem label="Telefone/Whatsapp" value={client.telefone} />
              <DescriptionItem label="E-mail" value={client.email} />
              <DescriptionItem label="Rede social" value={client.rede_social} />
              <DescriptionItem label="CEP" value={client.cep} />
              <DescriptionItem label="Endereço" value={client.endereco} />
              <DescriptionItem label="Número" value={client.numero} />
              <DescriptionItem label="Complemento" value={client.complemento} />
              <DescriptionItem label="Bairro" value={client.bairro} />
              <DescriptionItem label="Cidade" value={client.cidade} />
              <DescriptionItem label="Estado" value={client.estado} />
            </DescriptionList>
          </Surface>

          <Surface>
            <SurfaceHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-mauve">Histórico comercial</p>
                <h2 className="mt-1 text-sm font-extrabold text-ink">
                  Pedidos do Cliente
                </h2>
              </div>
              <div className="grid gap-1 rounded-lg bg-slate-50 px-4 py-3 text-right">
                <span className="text-xs font-bold text-slate-500">
                  Total gasto
                </span>
                <strong className="text-xl font-extrabold text-frenchRose">
                  {formatCurrency(totalSpent) ?? 'R$ 0,00'}
                </strong>
              </div>
            </SurfaceHeader>

            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">Prazo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Pagamento</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr
                        className="cursor-pointer bg-white transition hover:bg-chantilly/20"
                        key={order.id}
                        onClick={() => navigate(`/pedidos/${order.id}`)}
                      >
                        <td className="px-4 py-3 font-extrabold text-frenchRose">
                          {formatOrderNumber(order.id)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(order.prazo)}
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
                        <td
                          className={`px-4 py-3 font-bold ${paymentClassName(
                            order.status_pagamento,
                          )}`}
                        >
                          {paymentLabel(order.status_pagamento)}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-ink">
                          {formatCurrency(order.valor_total) ?? 'R$ 0,00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                minHeightClassName="min-h-40"
                title="Nenhum pedido registrado para este cliente."
              />
            )}
          </Surface>
        </div>
      ) : null}
    </AppShell>
  );
}
