import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
};

export function Button({
  children,
  className = '',
  disabled,
  isLoading = false,
  loadingLabel = 'Entrando...',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-12 items-center justify-center rounded-lg border-0',
        'bg-frenchRose px-5 font-bold text-white shadow-sm transition',
        'hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg',
        'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-froly/30',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-frenchRose',
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
