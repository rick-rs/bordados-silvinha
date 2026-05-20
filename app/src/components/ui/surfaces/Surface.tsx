import type { HTMLAttributes, ReactNode } from 'react';

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'aside' | 'section' | 'div';
  children?: ReactNode;
  padded?: boolean;
};

export function Surface({
  as: Component = 'section',
  children,
  className = '',
  padded = false,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={[
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        padded ? 'p-5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Component>
  );
}

type SurfaceHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceHeader({ children, className = '' }: SurfaceHeaderProps) {
  return (
    <div
      className={['border-b border-slate-100 px-4 py-3', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
