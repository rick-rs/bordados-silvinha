import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'urgent' | 'success' | 'warning' | 'danger';

type BadgeProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  urgent: 'bg-rose-50 text-rose-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
};

export function Badge({
  children,
  className = '',
  icon,
  variant = 'default',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${variantStyles[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
