import { DragEvent, useEffect, useMemo, useState } from 'react';

import { Client } from '../../services/clients';
import { Order, OrderItem, Product } from '../../services/orders';
import { statusLabel, statusOptions } from './orderUtils';
import { OrderCard } from '../../components/ui/OrderCard';
import { OrderTableRow } from '../../components/ui/OrderTableRow';

type OrdersViewProps = {
  clientsById: Map<number, Client>;
  deletingId: number | null;
  itemsByOrder: Map<number, OrderItem[]>;
  orders: Order[];
  productsById: Map<number, Product>;
  updatingStatusId: number | null;
};

type OrdersTableProps = OrdersViewProps & {
  onAdvanceStatus: (order: Order, status: string) => void;
  onCancel: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
};

export function OrdersTable({
  clientsById,
  deletingId,
  itemsByOrder,
  onAdvanceStatus,
  onCancel,
  onEdit,
  onDelete,
  orders,
  productsById,
  updatingStatusId,
}: OrdersTableProps) {
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
          {orders.map((order) => (
            <OrderTableRow
              key={order.id}
              client={clientsById.get(order.cliente)}
              deletingId={deletingId}
              itemsByOrder={itemsByOrder}
              onAdvanceStatus={onAdvanceStatus}
              onCancel={onCancel}
              onDelete={onDelete}
              onEdit={onEdit}
              order={order}
              productsById={productsById}
              updatingStatusId={updatingStatusId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type OrdersBoardProps = OrdersViewProps & {
  onCancel: (order: Order) => void;
  onDelete: (order: Order) => void;
  onEdit: (order: Order) => void;
  onStatusChange: (order: Order, status: string) => void;
};

export function OrdersBoard({
  clientsById,
  deletingId,
  itemsByOrder,
  onCancel,
  onDelete,
  onEdit,
  onStatusChange,
  orders,
  productsById,
  updatingStatusId,
}: OrdersBoardProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-w-full">
        {statusOptions.map((status) => {
          const columnOrders = ordersByStatus.get(status) ?? [];
          const isDraggingOver = dragOverStatus === status;

          return (
            <section
              className={[
                'flex min-h-[480px] flex-col rounded-lg border bg-white shadow-sm transition',
                isDraggingOver
                  ? 'border-primary bg-primary/10 ring-4 ring-primary/10'
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
              <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <h3 className="text-xs font-extrabold text-ink">
                  {statusLabel(status)}
                </h3>
                <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-extrabold text-primary-dark">
                  {columnOrders.length}
                </span>
              </header>
              <div className="grid flex-1 content-start gap-2.5 p-3">
                {columnOrders.length > 0 ? (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      clientsById={clientsById}
                      deletingId={deletingId}
                      itemsByOrder={itemsByOrder}
                      onCancel={onCancel}
                      onCardDrop={handleCardDrop}
                      onDelete={onDelete}
                      onDragEnd={() => setDragOverStatus(null)}
                      onDragStart={handleDragStart}
                      onEdit={onEdit}
                      order={order}
                      productsById={productsById}
                      setDragOverStatus={setDragOverStatus}
                      updatingStatusId={updatingStatusId}
                    />
                  ))
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
