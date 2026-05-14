import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from './Button';

type ConfirmDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel?: string;
  description?: string;
  isLoading?: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: 'danger' | 'neutral';
};

export function ConfirmDialog({
  cancelLabel = 'Cancelar',
  children,
  confirmLabel = 'Confirmar',
  description,
  isLoading = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  const isDanger = tone === 'danger';

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/35 px-4 py-6"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5">
          <span
            className={[
              'grid h-10 w-10 shrink-0 place-items-center rounded-full',
              isDanger ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600',
            ].join(' ')}
          >
            <AlertTriangle aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {children ? <div className="grid gap-4 p-5">{children}</div> : null}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-4 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <Button
            className={[
              'min-h-11 px-4 text-sm',
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 disabled:hover:bg-rose-600'
                : '',
            ].join(' ')}
            isLoading={isLoading}
            loadingLabel="Processando..."
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
