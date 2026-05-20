import { formatDate, getDeadlineState } from '../../../features/orders/orderUtils';

type OrderDeadlineCellProps = {
  deadline: string;
  entryDate?: string;
};

export function OrderDeadlineCell({ deadline, entryDate }: OrderDeadlineCellProps) {
  const deadlineState = getDeadlineState({ prazo: deadline } as any);

  return (
    <div>
      <p className="font-extrabold text-primary-dark">{formatDate(deadline)}</p>
      {deadlineState ? (
        <p
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-extrabold ring-1 ${deadlineState.tone}`}
        >
          {deadlineState.label}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-slate-500">
        {entryDate ? `Entrada ${formatDate(entryDate)}` : '-'}
      </p>
    </div>
  );
}
