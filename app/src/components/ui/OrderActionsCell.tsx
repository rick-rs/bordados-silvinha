import { ArrowRight, Ban, Pencil, Trash2 } from 'lucide-react';
import { Order } from '../../services/orders';
import { formatOrderNumber, getNextStatus, statusLabel } from '../../features/orders/orderUtils';

type OrderActionsCellProps = {
  deletingId: number | null;
  onAdvanceStatus: (order: Order, status: string) => void;
  onCancel: (order: Order) => void;
  onDelete: (order: Order) => void;
  onEdit: (order: Order) => void;
  order: Order;
  updatingStatusId: number | null;
};

export function OrderActionsCell({
  deletingId,
  onAdvanceStatus,
  onCancel,
  onDelete,
  onEdit,
  order,
  updatingStatusId,
}: OrderActionsCellProps) {
  const nextStatus = getNextStatus(order.status);
  const isCanceled = order.status === 'Cancelado';

  const handleButtonClick = (
    event: React.MouseEvent,
    callback: (order: Order, ...args: any[]) => void,
    ...args: any[]
  ) => {
    event.stopPropagation();
    callback(order, ...args);
  };

  return (
    <div className="flex gap-1">
      <button
        aria-label={`Avançar pedido ${formatOrderNumber(order.id)} para o próximo status`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!nextStatus || updatingStatusId === order.id}
        onClick={(event) => {
          if (nextStatus) {
            handleButtonClick(event, onAdvanceStatus, nextStatus);
          }
        }}
        title={
          nextStatus ? `Avançar para ${statusLabel(nextStatus)}` : 'Pedido no último status'
        }
        type="button"
      >
        <ArrowRight aria-hidden className="h-4 w-4" />
      </button>

      <button
        aria-label={`Cancelar pedido ${formatOrderNumber(order.id)}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
        disabled={isCanceled || updatingStatusId === order.id}
        onClick={(event) => handleButtonClick(event, onCancel)}
        title={isCanceled ? 'Pedido já cancelado' : 'Cancelar pedido'}
        type="button"
      >
        <Ban aria-hidden className="h-4 w-4" />
      </button>

      <button
        aria-label={`Editar pedido ${formatOrderNumber(order.id)}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
        onClick={(event) => handleButtonClick(event, onEdit)}
        title="Editar pedido"
        type="button"
      >
        <Pencil aria-hidden className="h-4 w-4" />
      </button>

      <button
        aria-label={`Excluir pedido ${formatOrderNumber(order.id)}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={deletingId === order.id}
        onClick={(event) => handleButtonClick(event, onDelete)}
        title="Excluir pedido"
        type="button"
      >
        <Trash2 aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
