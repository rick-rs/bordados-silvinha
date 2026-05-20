type StockStatusBadgeProps = {
  isLow: boolean;
};

export function StockStatusBadge({ isLow }: StockStatusBadgeProps) {
  return (
    <span
      className={[
        'rounded-full px-2 py-1 text-xs font-bold',
        isLow ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700',
      ].join(' ')}
    >
      {isLow ? 'Reposição' : 'Ok'}
    </span>
  );
}
