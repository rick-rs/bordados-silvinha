import { AlertTriangle } from 'lucide-react';
import { Material } from '../../../services/stock';

type StockAlertCardProps = {
  material: Material;
  onClick: (material: Material) => void;
};

export function StockAlertCard({ material, onClick }: StockAlertCardProps) {
  return (
    <button
      className="relative rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left shadow-sm transition after:absolute after:-bottom-2 after:left-7 after:h-4 after:w-4 after:rotate-45 after:border-b after:border-r after:border-amber-200 after:bg-amber-50 hover:-translate-y-0.5 hover:shadow-md"
      onClick={() => onClick(material)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-600">
          <AlertTriangle aria-hidden className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-amber-900">{material.nome}</p>
          <p className="mt-1 text-xs font-semibold text-amber-800">
            {material.quantidade_atual} em estoque, mínimo {material.estoque_minimo}
          </p>
        </div>
      </div>
    </button>
  );
}
