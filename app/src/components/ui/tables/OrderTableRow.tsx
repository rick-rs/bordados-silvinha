import { Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Client } from '../../../services/clients';
import { Order, OrderItem, Product } from '../../../services/orders';
import { formatCurrency } from '../../../utils/format';
import {
  buildItemSummary,
  formatOrderNumber,
  getDeadlineState,
  paymentClassName,
  paymentLabel,
  paymentMethodLabel,
} from '../../../features/orders/orderUtils';
import { OrderStatusBadge } from '../badges';
import { OrderDeadlineCell } from '../tables';
import { OrderActionsCell } from '../tables';

type OrderTableRowProps = {
  client?: Client;
  deletingId: number | null;
  itemsByOrder: Map<number, OrderItem[]>;
  onAdvanceStatus: (order: Order, status: string) => void;
  onCancel: (order: Order) => void;
  onDelete: (order: Order) => void;
  onEdit: (order: Order) => void;
  order: Order;
  productsById: Map<number, Product>;
  updatingStatusId: number | null;
};

export function OrderTableRow({
  client,
  deletingId,
  itemsByOrder,
  onAdvanceStatus,
  onCancel,
  onDelete,
  onEdit,
  order,
  productsById,
  updatingStatusId,
}: OrderTableRowProps) {
  const navigate = useNavigate();

  const itemSummary = buildItemSummary(order.id, itemsByOrder, productsById);
  const total = formatCurrency(order.valor_total) ?? 'R$ 0,00';
  const payment = paymentLabel(order.status_pagamento);
  const paymentMethod = paymentMethodLabel(order.forma_pagamento ?? '');
  const deadline = getDeadlineState(order);
  const isCanceled = order.status === 'Cancelado';

  const borderClass =
    !isCanceled && deadline?.label.startsWith('Atrasado')
      ? 'border-l-4 border-l-rose-400'
      : !isCanceled && deadline
        ? 'border-l-4 border-l-amber-400'
        : '';

  return (
    <tr
      className={[
        'cursor-pointer align-top transition hover:bg-primary/5',
        isCanceled ? 'bg-slate-50 opacity-75' : 'bg-white',
        borderClass,
      ].join(' ')}
      onClick={() => navigate(`/pedidos/${order.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-extrabold text-ink">{formatOrderNumber(order.id)}</p>
          {order.urgente ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-extrabold text-danger">
              <Flag aria-hidden className="h-3 w-3" />
              Urgente
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {client?.nome ?? `Cliente #${order.cliente}`}
        </p>
      </td>
      <td className="max-w-80 px-4 py-3 text-slate-600">{itemSummary}</td>
      <td className="px-4 py-3">
        <OrderDeadlineCell deadline={order.prazo ?? ''} entryDate={order.data_pedido ?? undefined} />
      </td>
      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3">
        <p className="font-extrabold text-ink">{total}</p>
        <p className={`mt-1 text-xs font-bold ${paymentClassName(payment)}`}>
          {paymentMethod ? `${paymentMethod} · ${payment}` : payment}
        </p>
      </td>
      <td className="px-4 py-3 text-right">
        <OrderActionsCell
          deletingId={deletingId}
          onAdvanceStatus={onAdvanceStatus}
          onCancel={onCancel}
          onDelete={onDelete}
          onEdit={onEdit}
          order={order}
          updatingStatusId={updatingStatusId}
        />
      </td>
    </tr>
  );
}
