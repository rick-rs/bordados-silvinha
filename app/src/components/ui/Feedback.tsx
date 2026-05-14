import type { HTMLAttributes, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

type AlertMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function AlertMessage({
  children,
  className = '',
  ...props
}: AlertMessageProps) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={[
        'mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </p>
  );
}

type EmptyStateProps = {
  description?: string;
  icon?: ReactNode;
  minHeightClassName?: string;
  title: string;
};

export function EmptyState({
  description,
  icon,
  minHeightClassName = 'min-h-56',
  title,
}: EmptyStateProps) {
  return (
    <div className={`grid ${minHeightClassName} place-items-center px-6 py-10 text-center`}>
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-frenchRose">
          {icon ?? <Inbox aria-hidden className="h-5 w-5" />}
        </div>
        <p className="mt-3 text-sm font-bold text-slate-600">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

type LoadingRowsProps = {
  count?: number;
  rowClassName?: string;
};

export function LoadingRows({
  count = 3,
  rowClassName = 'h-16',
}: LoadingRowsProps) {
  return (
    <div className="grid gap-3 p-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          className={`${rowClassName} animate-pulse rounded-lg bg-slate-100`}
          key={index}
        />
      ))}
    </div>
  );
}
