import { Ban, Pencil, Trash2 } from 'lucide-react';
import { Order } from '../../../services/orders';
import { ActionButton } from '../buttons';

type OrderCardActionsProps = {
  clientName?: string;
  deletingId: number | null;
  isCanceled: boolean;
  isUpdating: boolean;
  onCancel: (order: Order) => void;
  onDelete: (order: Order) => void;
  onEdit: (order: Order) => void;
  order: Order;
};

export function OrderCardActions({
  clientName = 'cliente não identificado',
  deletingId,
  isCanceled,
  isUpdating,
  onCancel,
  onDelete,
  onEdit,
  order,
}: OrderCardActionsProps) {
  const handleButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    callback: (order: Order) => void,
  ) => {
    event.stopPropagation();
    callback(order);
  };

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <ActionButton
        aria-label={`Cancelar pedido de ${clientName}`}
        disabled={isCanceled || isUpdating}
        onClick={(event) => handleButtonClick(event, onCancel)}
        title={isCanceled ? 'Pedido já cancelado' : 'Cancelar pedido'}
        variant="danger"
      >
        <Ban aria-hidden className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton
        aria-label={`Editar pedido de ${clientName}`}
        onClick={(event) => handleButtonClick(event, onEdit)}
        title="Editar pedido"
      >
        <Pencil aria-hidden className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton
        aria-label={`Excluir pedido de ${clientName}`}
        disabled={deletingId === order.id}
        onClick={(event) => handleButtonClick(event, onDelete)}
        title="Excluir pedido"
        className="text-frenchRose hover:bg-chantilly/45"
      >
        <Trash2 aria-hidden className="h-3.5 w-3.5" />
      </ActionButton>
    </div>
  );
}
