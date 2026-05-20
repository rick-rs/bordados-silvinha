import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'default' | 'danger';
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ children, className = '', variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default:
        'text-slate-500 transition hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40',
      danger:
        'text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex h-6 w-6 items-center justify-center rounded flex-shrink-0 ${variantClasses[variant]} ${className}`}
        type="button"
        {...props}
      >
        {children}
      </button>
    );
  },
);

ActionButton.displayName = 'ActionButton';
