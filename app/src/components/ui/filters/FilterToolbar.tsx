import type { ReactNode } from 'react';

type FilterToolbarProps = {
  primary?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
};

export function FilterToolbar({ actions, filters, primary }: FilterToolbarProps) {
  return (
    <div className="border-b border-slate-100 p-4">
      {(primary || actions) ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
          {primary ? <div className="min-w-0">{primary}</div> : <div />}
          {actions ? <div className="min-w-0 lg:justify-self-end">{actions}</div> : null}
        </div>
      ) : null}

      {filters ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
          {filters}
        </div>
      ) : null}
    </div>
  );
}
