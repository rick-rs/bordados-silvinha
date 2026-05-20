import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';

import { IconButton } from '../buttons';
import { StockStatusBadge } from '../badges';
import type { Material } from '../../../services/stock';

interface StockTableRowProps {
  material: Material;
  isSelected: boolean;
  isDeletingId: number | null;
  onToggleSelect: (materialId: number) => void;
  onNavigateMovement: () => void;
  onNavigateEdit: () => void;
  onDelete: () => void;
}

export function StockTableRow({
  material,
  isSelected,
  isDeletingId,
  onToggleSelect,
  onNavigateMovement,
  onNavigateEdit,
  onDelete,
}: StockTableRowProps) {
  const current = Number.parseFloat(material.quantidade_atual);
  const minimum = Number.parseFloat(material.estoque_minimo);
  const isLow = current <= minimum;

  return (
    <tr className="cursor-pointer bg-white align-top transition hover:bg-primary/5">
      <td className="px-4 py-3">
        <input
          aria-label={`Selecionar ${material.nome}`}
          checked={isSelected}
          className="h-4 w-4 rounded border-slate-300 text-frenchRose focus:ring-frenchRose"
          onChange={() => onToggleSelect(material.id)}
          onClick={(event) => event.stopPropagation()}
          type="checkbox"
        />
      </td>
      <td className="px-4 py-3">
        <p className="font-extrabold text-ink">{material.nome}</p>
        <p className="mt-1 text-xs text-slate-500">
          {material.descricao || '-'}
        </p>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {material.unidade_medida}
      </td>
      <td className="px-4 py-3 font-extrabold text-ink">
        {material.quantidade_atual}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {material.estoque_minimo}
      </td>
      <td className="px-4 py-3">
        <StockStatusBadge isLow={isLow} />
      </td>
      <td className="px-4 py-3 text-right">
        <IconButton
          aria-label={`Movimentar ${material.nome}`}
          className="mr-1"
          onClick={(event) => {
            event.stopPropagation();
            onNavigateMovement();
          }}
          title="Movimentar estoque"
        >
          <ArrowUpDown aria-hidden className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label={`Editar ${material.nome}`}
          className="mr-1"
          onClick={(event) => {
            event.stopPropagation();
            onNavigateEdit();
          }}
          title="Editar material"
        >
          <Pencil aria-hidden className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label={`Excluir ${material.nome}`}
          disabled={isDeletingId === material.id}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          title="Excluir material"
          tone="danger"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </IconButton>
      </td>
    </tr>
  );
}
