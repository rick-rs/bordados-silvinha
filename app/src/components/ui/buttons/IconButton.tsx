import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonTone = 'neutral' | 'danger' | 'primary';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: IconButtonTone;
};

const toneClasses: Record<IconButtonTone, string> = {
  danger: 'text-danger hover:bg-danger/10',
  neutral: 'text-slate-500 hover:bg-slate-100 hover:text-graphite',
  primary: 'text-primary-dark hover:bg-primary/10',
};

export function IconButton({
  children,
  className = '',
  tone = 'neutral',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60',
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

