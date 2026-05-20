import { FormEvent } from 'react';
import { SelectField, TextAreaField } from '../../components/ui/forms';
import { Surface, SurfaceHeader } from '../../components/ui/surfaces';
import { TextField } from '../../components/ui/forms';
import { Material, StockMovementPayload } from '../../services/stock';

type StockMovementModalProps = {
  form: Omit<StockMovementPayload, 'material'>;
  isLoading: boolean;
  selectedMaterials: Material[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onFieldChange: (field: keyof Omit<StockMovementPayload, 'material'>, value: string) => void;
};

export function StockMovementModal({
  form,
  isLoading,
  selectedMaterials,
  onSubmit,
  onFieldChange,
}: StockMovementModalProps) {
  return (
    <Surface as="section" className="mb-5">
      <SurfaceHeader>
        <p className="text-xs font-semibold text-mauve">Movimentação em lote</p>
        <h2 className="mt-1 text-sm font-extrabold text-ink">
          {selectedMaterials.length} item(ns) selecionado(s)
        </h2>
      </SurfaceHeader>

      <form
        className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Tipo"
            name="tipo_movimentacao_lote"
            onChange={(event) =>
              onFieldChange('tipo', event.target.value as StockMovementPayload['tipo'])
            }
            value={form.tipo}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </SelectField>

          <TextField
            label="Quantidade por item *"
            min="0.01"
            name="quantidade_movimentacao_lote"
            onChange={(event) => onFieldChange('quantidade', event.target.value)}
            required
            step="0.01"
            type="number"
            value={form.quantidade}
          />

          <TextAreaField
            className="sm:col-span-2"
            label="Observação"
            name="observacao_movimentacao_lote"
            onChange={(event) => onFieldChange('observacao', event.target.value)}
            value={form.observacao}
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">Resumo</p>
          <div className="mt-3 grid max-h-36 gap-2 overflow-auto pr-1">
            {selectedMaterials.map((material) => (
              <div
                className="rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-600"
                key={material.id}
              >
                {material.nome}
                <span className="ml-1 font-semibold text-slate-400">
                  ({material.quantidade_atual} {material.unidade_medida})
                </span>
              </div>
            ))}
          </div>
          <button
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition hover:bg-froly disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Registrando...' : 'Registrar movimentação'}
          </button>
        </div>
      </form>
    </Surface>
  );
}
