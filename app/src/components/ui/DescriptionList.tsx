import type { ReactNode } from 'react';

type DescriptionItemProps = {
  label: string;
  value: ReactNode;
};

export function DescriptionItem({ label, value }: DescriptionItemProps) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-extrabold text-ink">{value || '-'}</dd>
    </div>
  );
}

type DescriptionListProps = {
  children: ReactNode;
  className?: string;
};

export function DescriptionList({
  children,
  className = 'sm:grid-cols-2 lg:grid-cols-3',
}: DescriptionListProps) {
  return (
    <dl className={['grid gap-5 p-5 text-sm', className].filter(Boolean).join(' ')}>
      {children}
    </dl>
  );
}
