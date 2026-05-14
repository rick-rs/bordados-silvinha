import { Scissors } from 'lucide-react';

import { appBrand } from '../../theme/brand';

type AppBrandProps = {
  compact?: boolean;
};

export function AppBrand({ compact = false }: AppBrandProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Scissors aria-hidden className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      <span>{appBrand.name}</span>
    </span>
  );
}
