import { FormEvent, useEffect, useState } from 'react';
import { History, Pencil, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import {
  createStockMovement,
  getMaterial,
  listStockMovements,
  Material,
  StockMovement,
  StockMovementPayload,
} from '../../services/stock';

const initialMovementForm: Omit<StockMovementPayload, 'material'> = {
  tipo: 'entrada',
  quantidade: '',
  observacao: '',
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-extrabold text-ink">{value || '-'}</dd>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function StockDetailPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [material, setMaterial] = useState<Material | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementForm, setMovementForm] = useState(initialMovementForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMovement, setIsSavingMovement] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const materialId = Number(id);

    async function loadMaterial() {
      if (!materialId) {
        setError('Material inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const [response, movementsResponse] = await Promise.all([
          getMaterial(materialId),
          listStockMovements(materialId),
        ]);

        if (isMounted) {
          setMaterial(response);
          setMovements(movementsResponse);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o material.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMaterial();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const current = material ? Number.parseFloat(material.quantidade_atual) : 0;
  const minimum = material ? Number.parseFloat(material.estoque_minimo) : 0;
  const isLow = current <= minimum;

  function updateMovementField(
    field: keyof typeof initialMovementForm,
    value: string,
  ) {
    setMovementForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const materialId = Number(id);

    if (!materialId) {
      setError('Material inválido.');
      return;
    }

    setIsSavingMovement(true);
    setError('');

    try {
      const movement = await createStockMovement({
        material: materialId,
        ...movementForm,
      });
      const updatedMaterial = await getMaterial(materialId);

      setMovements((currentMovements) => [movement, ...currentMovements]);
      setMaterial(updatedMaterial);
      setMovementForm(initialMovementForm);
    } catch {
      setError('Não foi possível registrar a movimentação de estoque.');
    } finally {
      setIsSavingMovement(false);
    }
  }

  return (
    <AppShell activePage="Estoque">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">Dashboard / Estoque</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            {material?.nome ?? 'Detalhes do Material'}
          </h1>
        </div>
        <Button
          className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
          onClick={() => navigate(`/estoque/${id}/editar`)}
          title="Editar material"
          type="button"
        >
          <Pencil aria-hidden className="h-4 w-4" />
          Editar
        </Button>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-white shadow-sm" />
      ) : material ? (
        <div className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink">
                Informações do Material
              </h2>
            </div>
            <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Nome" value={material.nome} />
              <DetailItem label="Unidade" value={material.unidade_medida} />
              <DetailItem label="Quantidade atual" value={material.quantidade_atual} />
              <DetailItem label="Estoque mínimo" value={material.estoque_minimo} />
              <DetailItem label="Situação" value={isLow ? 'Reposição' : 'Ok'} />
              <DetailItem label="Descrição" value={material.descricao} />
            </dl>
          </section>

          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={handleMovementSubmit}
            >
              <div className="mb-4 flex items-center gap-2">
                <Plus aria-hidden className="h-4 w-4 text-frenchRose" />
                <h2 className="text-sm font-extrabold text-ink">
                  Registrar Movimentação
                </h2>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2" htmlFor="tipo_movimentacao">
                  <span className="text-sm font-bold text-mauve">Tipo</span>
                  <select
                    className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                    id="tipo_movimentacao"
                    onChange={(event) =>
                      updateMovementField(
                        'tipo',
                        event.target.value as StockMovementPayload['tipo'],
                      )
                    }
                    value={movementForm.tipo}
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </label>

                <TextField
                  label="Quantidade *"
                  min="0.01"
                  name="quantidade_movimentacao"
                  onChange={(event) =>
                    updateMovementField('quantidade', event.target.value)
                  }
                  required
                  step="0.01"
                  type="number"
                  value={movementForm.quantidade}
                />

                <label className="grid gap-2" htmlFor="observacao_movimentacao">
                  <span className="text-sm font-bold text-mauve">Observação</span>
                  <textarea
                    className="min-h-24 rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                    id="observacao_movimentacao"
                    onChange={(event) =>
                      updateMovementField('observacao', event.target.value)
                    }
                    value={movementForm.observacao}
                  />
                </label>

                <Button
                  className="min-h-11 px-4 text-sm"
                  isLoading={isSavingMovement}
                  loadingLabel="Registrando..."
                  type="submit"
                >
                  Registrar
                </Button>
              </div>
            </form>

            <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <History aria-hidden className="h-4 w-4 text-frenchRose" />
                <h2 className="text-sm font-extrabold text-ink">
                  Histórico de Movimentações
                </h2>
              </div>
              {movements.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {movements.map((movement) => {
                    const isEntry = movement.tipo === 'entrada';
                    const Icon = isEntry ? TrendingUp : TrendingDown;

                    return (
                      <div
                        className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto]"
                        key={movement.id}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={[
                              'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full',
                              isEntry
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600',
                            ].join(' ')}
                          >
                            <Icon aria-hidden className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-extrabold text-ink">
                              {isEntry ? 'Entrada' : 'Saída'} de {movement.quantidade}{' '}
                              {material.unidade_medida}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {movement.observacao || 'Sem observação'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 sm:text-right">
                          {formatDateTime(movement.registrado_em)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid min-h-40 place-items-center px-6 py-8 text-center">
                  <p className="text-sm font-bold text-slate-500">
                    Nenhuma movimentação registrada.
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
