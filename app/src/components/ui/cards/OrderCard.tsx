import { DragEvent, forwardRef, memo } from 'react';
import { Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Client } from '../../../services/clients';
import { Order, OrderItem, Product } from '../../../services/orders';
import { formatCurrency } from '../../../utils/format';
import {
  buildItemSummary,
  formatDate,
  getDeadlineState,
  paymentClassName,
  paymentLabel,
  paymentMethodLabel,
} from '../../../features/orders/orderUtils';
import { Badge } from '../badges';
import { DeadlineBadge } from '../badges';
import { OrderCardActions } from './OrderCardActions';

type OrderCardProps = {
  clientsById: Map<number, Client>;
  deletingId: number | null;
  itemsByOrder: Map<number, OrderItem[]>;
  onCancel: (order: Order) => void;
  onDelete: (order: Order) => void;
  onDragStart: (event: DragEvent<HTMLElement>, order: Order) => void;
  onDragEnd: (event: DragEvent<HTMLElement>) => void;
  onCardDrop: (event: DragEvent<HTMLElement>, order: Order) => void;
  onEdit: (order: Order) => void;
  order: Order;
  productsById: Map<number, Product>;
  setDragOverStatus: (status: string | null) => void;
  updatingStatusId: number | null;
};

export const OrderCard = memo(
  forwardRef<HTMLElement, OrderCardProps>(
    (
      {
        clientsById,
        deletingId,
        itemsByOrder,
        onCancel,
        onDelete,
        onCardDrop,
        onDragEnd,
        onDragStart,
        onEdit,
        order,
        productsById,
        setDragOverStatus,
        updatingStatusId,
      },
      ref,
    ) => {
      const navigate = useNavigate();

      const client = clientsById.get(order.cliente);
      const itemSummary = buildItemSummary(order.id, itemsByOrder, productsById);
      const payment = paymentLabel(order.status_pagamento);
      const paymentMethod = paymentMethodLabel(order.forma_pagamento ?? '');
      const isUpdating = updatingStatusId === order.id;
      const deadline = getDeadlineState(order);
      const isCanceled = order.status === 'Cancelado';

      const borderColorClass = !isCanceled
        && deadline?.label.startsWith('Atrasado')
        ? 'border-rose-200'
        : !isCanceled && deadline
          ? 'border-amber-200'
          : 'border-slate-200';

      return (
        <article
          ref={ref}
          className={[
            'cursor-grab rounded-lg border bg-white p-2 text-left shadow-sm transition overflow-hidden',
            'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
            isCanceled ? 'bg-slate-50 opacity-75' : '',
            borderColorClass,
            isUpdating ? 'opacity-60' : '',
          ].join(' ')}
          draggable={!isUpdating}
          onClick={() => navigate(`/pedidos/${order.id}`)}
          onDragEnd={onDragEnd}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDragOverStatus(order.status);
          }}
          onDragStart={(event) => onDragStart(event, order)}
          onDrop={(event) => onCardDrop(event, order)}
          title="Arraste para mudar o status ou a prioridade visual"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1">
                  <p className="text-sm font-extrabold text-ink truncate">
                    {client?.nome ?? `Cliente #${order.cliente}`}
                  </p>
                  {order.urgente ? (
                    <Badge variant="urgent" icon={<Flag className="h-3 w-3" />}>
                      Urgente
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] font-bold text-frenchRose">
                  {formatDate(order.prazo)}
                </p>
                <DeadlineBadge deadline={deadline} />
              </div>
            </div>

            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold truncate ${paymentClassName(payment)}`}>
              {paymentMethod ? `${paymentMethod} · ${payment}` : payment}
            </span>

            <p className="line-clamp-2 text-xs leading-snug text-slate-600 break-words">
              {itemSummary}
            </p>

            <div className="flex items-center justify-between gap-0.5">
              <p className="font-extrabold text-ink text-xs flex-1 truncate">
                {formatCurrency(order.valor_total) ?? 'R$ 0,00'}
              </p>
              <OrderCardActions
                clientName={client?.nome}
                deletingId={deletingId}
                isCanceled={isCanceled}
                isUpdating={isUpdating}
                onCancel={onCancel}
                onDelete={onDelete}
                onEdit={onEdit}
                order={order}
              />
            </div>
          </div>
        </article>
      );
    },
  ),
);

OrderCard.displayName = 'OrderCard';
