import { statusLabel, statusClassName } from '../../../features/orders/orderUtils';

type OrderStatusBadgeProps = {
  status: string;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClassName(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
