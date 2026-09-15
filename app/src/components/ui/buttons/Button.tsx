import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonTone = 'primary' | 'neutral' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  size?: ButtonSize;
  tone?: ButtonTone;
};

const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold shadow-sm transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none disabled:hover:bg-current disabled:hover:text-current';

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-12 px-5 text-lg',
};

const toneStyles: Record<ButtonTone, string> = {
  primary:
    'bg-primary text-white hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg',
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 hover:-translate-y-0.5 hover:shadow-lg',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  neutral:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:-translate-y-0.5 hover:shadow-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      disabled,
      isLoading = false,
      loadingLabel = 'Entrando...',
      size = 'md',
      tone = 'primary',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const buttonClass = [baseStyles, sizeStyles[size], toneStyles[tone], className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={buttonClass}
        disabled={disabled || isLoading}
        type={type}
        {...props}
      >
        {isLoading ? loadingLabel : children}
      </button>
    );
  },
);

Button.displayName = 'Button';
