import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonTone = 'primary' | 'neutral' | 'danger' | 'outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  tone?: ButtonTone;
};

export function Button({
  children,
  className = '',
  disabled,
  isLoading = false,
  loadingLabel = 'Entrando...',
  tone = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-11 items-center justify-center rounded-lg border-0',
        'px-4 font-bold shadow-sm transition',
        tone === 'primary'
          ? 'bg-primary text-white hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg'
          : null,
        tone === 'danger'
          ? 'bg-rose-500 text-white hover:bg-rose-600 hover:-translate-y-0.5 hover:shadow-lg'
          : null,
        tone === 'outline'
          ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          : null,
        tone === 'neutral'
          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:-translate-y-0.5 hover:shadow-sm'
          : null,
        'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary/30',
        // UX/Acessibilidade: desabilitado não deve responder a hover (cor/transform/shadow)
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none disabled:hover:bg-current disabled:hover:text-current',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? loadingLabel : children}
    </button>
  );
}
