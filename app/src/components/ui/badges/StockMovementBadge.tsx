type StockMovementBadgeProps = {
  tipo: 'entrada' | 'saida';
};

export function StockMovementBadge({ tipo }: StockMovementBadgeProps) {
  const isEntry = tipo === 'entrada';

  return (
    <span
      className={[
        'rounded-full px-2 py-1 text-xs font-bold',
        isEntry ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      ].join(' ')}
    >
      {isEntry ? 'Entrada' : 'Saída'}
    </span>
  );
}
