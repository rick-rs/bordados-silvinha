import { StockMovementBadge } from '../badges';
import { EmptyState } from '../feedback';
import type { StockMovement, Material } from '../../../services/stock';

interface StockMovementHistoryTableProps {
  movements: StockMovement[];
  materialsById: Map<number, Material>;
  formatDateTime: (date: string) => string;
}

export function StockMovementHistoryTable({
  movements,
  materialsById,
  formatDateTime,
}: StockMovementHistoryTableProps) {
  if (movements.length === 0) {
    return (
      <EmptyState
        minHeightClassName="min-h-40"
        title="Nenhuma movimentação registrada."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
          <tr>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Material</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Quantidade</th>
            <th className="px-4 py-3">Observação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {movements.slice(0, 12).map((movement) => {
            const material = materialsById.get(movement.material);

            return (
              <tr
                className="transition duration-150 ease-in-out bg-white hover:shadow-sm hover:bg-slate-50"
                key={movement.id}
              >
                <td className="px-4 py-3 text-xs font-bold text-slate-500">
                  {formatDateTime(movement.registrado_em)}
                </td>
                <td className="px-4 py-3 font-extrabold text-ink">
                  {material?.nome ?? `Material #${movement.material}`}
                </td>
                <td className="px-4 py-3">
                  <StockMovementBadge tipo={movement.tipo} />
                </td>
                <td className="px-4 py-3 font-extrabold text-ink">
                  {movement.quantidade} {material?.unidade_medida ?? ''}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {movement.observacao || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
