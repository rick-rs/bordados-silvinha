import { useEffect, useState } from 'react';
import { Flag, Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { DescriptionItem, DescriptionList } from '../../components/ui/descriptions';
import { AlertMessage } from '../../components/ui/feedback';
import { PageHeader } from '../../components/ui/headers';
import { Surface, SurfaceHeader } from '../../components/ui/surfaces';
import { getSession } from '../../services/auth';
import { Client, listClients } from '../../services/clients';
import {
  getOrder,
  listOrderItems,
  listProducts,
  Order,
  OrderItem,
  Product,
} from '../../services/orders';
import { formatCurrency } from '../../utils/format';

function formatOrderNumber(id: number) {
  return `#${String(id).padStart(3, '0')}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function statusLabel(status: string | null) {
  return status === 'Em Producao' ? 'Em Produção' : status || 'Recebido';
}

export function OrderDetailPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productsById, setProductsById] = useState<Map<number, Product>>(
    () => new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        const [orderResponse, clientsResponse, itemsResponse, productsResponse] =
          await Promise.all([
            getOrder(orderId),
            listClients(),
            listOrderItems(),
            listProducts(),
          ]);

        if (isMounted) {
          setOrder(orderResponse);
          setClient(
            clientsResponse.find((item) => item.id === orderResponse.cliente) ?? null,
          );
          setItems(itemsResponse.filter((item) => item.pedido === orderResponse.id));
          setProductsById(
            new Map(productsResponse.map((product) => [product.id, product])),
          );
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

  return (
    <AppShell activePage="Pedidos">
      <PageHeader
        actions={
          <Button
            className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
            onClick={() => navigate(`/pedidos/${id}/editar`)}
            title="Editar pedido"
            type="button"
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Editar
          </Button>
        }
        breadcrumb="Dashboard / Pedidos"
        title={order ? formatOrderNumber(order.id) : 'Detalhes do Pedido'}
      />

      <AlertMessage>{error}</AlertMessage>

      {isLoading ? (
        <Surface className="h-56 animate-pulse" />
      ) : order ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Surface>
            <SurfaceHeader>
              <h2 className="text-sm font-extrabold text-ink">Itens do Pedido</h2>
            </SurfaceHeader>
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const product = productsById.get(item.produto);

                return (
                  <div className="grid gap-2 px-4 py-4" key={item.id}>
                    <p className="text-sm font-extrabold text-ink">
                      {item.quantidade}x {product?.nome ?? item.peca ?? 'Item'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Local: {item.local_bordado || '-'} ·{' '}
                      {item.descricao_bordado || 'Sem descrição'}
                    </p>
                    <p className="text-xs font-bold text-frenchRose">
                      Subtotal {formatCurrency(item.subtotal) ?? 'R$ 0,00'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Surface>

          <Surface as="aside">
            <SurfaceHeader>
              <h2 className="text-sm font-extrabold text-ink">Resumo</h2>
            </SurfaceHeader>
            <DescriptionList className="grid-cols-1">
              <DescriptionItem
                label="Cliente"
                value={client?.nome ?? `Cliente #${order.cliente}`}
              />
              <DescriptionItem
                label="Prazo"
                value={
                  <span className="text-frenchRose">{formatDate(order.prazo)}</span>
                }
              />
              <DescriptionItem
                label="Urgência"
                value={
                  order.urgente ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-extrabold text-rose-700">
                      <Flag aria-hidden className="h-3.5 w-3.5" />
                      Urgente
                    </span>
                  ) : (
                    'Normal'
                  )
                }
              />
              <DescriptionItem label="Status" value={statusLabel(order.status)} />
              <DescriptionItem
                label="Data de entrega"
                value={formatDate(order.data_entrega)}
              />
              <DescriptionItem
                label="Total"
                value={
                  <span className="text-lg">
                    {formatCurrency(order.valor_total) ?? 'R$ 0,00'}
                  </span>
                }
              />
              <DescriptionItem
                label="Obs. entrega"
                value={order.observacoes_entrega || '-'}
              />
            </DescriptionList>
          </Surface>
        </div>
      ) : null}
    </AppShell>
  );
}
