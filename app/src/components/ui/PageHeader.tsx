import type { ReactNode } from 'react';

type PageHeaderProps = {
  actions?: ReactNode;
  breadcrumb: string;
  title: string;
};

export function PageHeader({ actions, breadcrumb, title }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold text-mauve">{breadcrumb}</p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
      </div>
      {actions ? <div className="min-w-0 w-full sm:w-auto">{actions}</div> : null}
    </header>
  );
}
