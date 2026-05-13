import { Order, OrderItem, Product } from '../../services/orders';

export const statusOptions = [
  'Recebido',
  'Aguardando Matriz',
  'Em Producao',
  'Pronto para Entrega',
  'Entregue',
  'Cancelado',
];

export const paymentOptions = ['Pendente', 'Parcial', 'Pago'];
export const channelOptions = ['Instagram', 'WhatsApp', 'Facebook', 'Marketplace', 'Outro'];
export const paymentMethodOptions = ['Pix', 'Dinheiro', 'Cartao', 'Transferencia'];

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function formatOrderNumber(id: number) {
  return `#${String(id).padStart(3, '0')}`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function statusLabel(status: string | null) {
  if (status === 'Em Producao') {
    return 'Em Produção';
  }

  return status || 'Recebido';
}

export function getNextStatus(status: string) {
  if (['Entregue', 'Cancelado'].includes(status)) {
    return null;
  }

  const currentIndex = statusOptions.indexOf(status);

  if (currentIndex < 0 || currentIndex === statusOptions.length - 1) {
    return null;
  }

  return statusOptions[currentIndex + 1];
}

export function paymentLabel(payment: string | null) {
  return payment || 'Pendente';
}

export function paymentMethodLabel(paymentMethod: string) {
  if (paymentMethod === 'Cartao') {
    return 'Cartão';
  }

  if (paymentMethod === 'Transferencia') {
    return 'Transferência';
  }

  return paymentMethod;
}

export function parseMoney(value: string) {
  const normalizedValue = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const parsedValue = Number.parseFloat(normalizedValue);

  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

export function toDecimalString(value: number) {
  return value.toFixed(2);
}

export function statusClassName(status: string | null) {
  const normalizedStatus = normalizeText(statusLabel(status));

  if (normalizedStatus === 'em producao') {
    return 'bg-blue-50 text-blue-700';
  }

  if (normalizedStatus === 'aguardando matriz') {
    return 'bg-purple-50 text-purple-700';
  }

  if (normalizedStatus === 'entregue') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (normalizedStatus === 'cancelado') {
    return 'bg-rose-50 text-rose-700';
  }

  if (normalizedStatus === 'pronto para entrega') {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-slate-100 text-slate-700';
}

export function paymentClassName(payment: string | null) {
  if (payment === 'Pago') {
    return 'text-emerald-600';
  }

  if (payment === 'Parcial') {
    return 'text-amber-600';
  }

  return 'text-orange-500';
}

function parseDateOnly(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function getDeadlineState(order: Order) {
  if (['Entregue', 'Cancelado'].includes(order.status)) {
    return null;
  }

  const dueDate = parseDateOnly(order.prazo);

  if (!dueDate) {
    return null;
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = Math.ceil(
    (dueDate.getTime() - todayStart.getTime()) / 86_400_000,
  );

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);

    return {
      tone: 'bg-rose-50 text-rose-700 ring-rose-100',
      label: overdueDays === 1 ? 'Atrasado 1 dia' : `Atrasado ${overdueDays} dias`,
    };
  }

  if (diffDays <= 3) {
    return {
      tone: 'bg-amber-50 text-amber-700 ring-amber-100',
      label:
        diffDays === 0
          ? 'Vence hoje'
          : diffDays === 1
            ? 'Vence amanhã'
            : `Vence em ${diffDays} dias`,
    };
  }

  return null;
}

export function buildItemSummary(
  orderId: number,
  itemsByOrder: Map<number, OrderItem[]>,
  productsById: Map<number, Product>,
) {
  const items = itemsByOrder.get(orderId) ?? [];

  if (items.length === 0) {
    return '-';
  }

  return items
    .slice(0, 2)
    .map((item) => {
      const product = productsById.get(item.produto);
      const description = item.descricao_bordado || product?.nome || item.peca || 'Item';

      return `${item.quantidade}x ${description}`;
    })
    .join(', ')
    .concat(items.length > 2 ? ` +${items.length - 2}` : '');
}
