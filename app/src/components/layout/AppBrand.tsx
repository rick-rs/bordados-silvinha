import { appBrand } from '../../theme/brand';

type AppBrandProps = {
  compact?: boolean;
};

export function AppBrand({ compact = false }: AppBrandProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/simbolo.svg"
        alt={`${appBrand.name} logo`}
        className={compact ? 'h-4 w-4 object-contain' : 'h-6 w-6 object-contain'}
      />
      <span>{appBrand.name}</span>
    </span>
  );
}
