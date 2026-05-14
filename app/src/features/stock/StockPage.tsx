import { FormEvent, useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  History,
  Inbox,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { AlertMessage, EmptyState, LoadingRows } from '../../components/ui/Feedback';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { SelectField, TextAreaField } from '../../components/ui/FormFields';
import { IconButton } from '../../components/ui/IconButton';
import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { Surface, SurfaceHeader } from '../../components/ui/Surface';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import {
  createStockMovement,
  deleteMaterial,
  listMaterialsPage,
  listStockMovements,
  Material,
  StockMovement,
  StockMovementPayload,
} from '../../services/stock';

const initialBulkMovementForm: Omit<StockMovementPayload, 'material'> = {
  tipo: 'entrada',
  quantidade: '',
  observacao: '',
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function StockPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [situationFilter, setSituationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [isBulkMovementOpen, setIsBulkMovementOpen] = useState(false);
  const [bulkMovementForm, setBulkMovementForm] = useState(initialBulkMovementForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBulkMovement, setIsSavingBulkMovement] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadMaterials() {
      setIsLoading(true);

      try {
        const [response, movementsResponse] = await Promise.all([
          listMaterialsPage({
            page,
            pageSize,
            q: search,
            situacao: situationFilter,
            unidade: unitFilter,
          }),
          listStockMovements(),
        ]);

        if (isMounted) {
          setMaterials(response.results);
          setMovements(movementsResponse);
          setCount(response.count);
          setSelectedMaterialIds((currentIds) =>
            currentIds.filter((id) =>
              response.results.some((material) => material.id === id),
            ),
          );
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o estoque.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMaterials();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, refreshKey, search, situationFilter, unitFilter]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateUnitFilter(value: string) {
    setUnitFilter(value);
    setPage(1);
  }

  function updateSituationFilter(value: string) {
    setSituationFilter(value);
    setPage(1);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  const lowStockMaterials = materials.filter((material) => {
    const current = Number.parseFloat(material.quantidade_atual);
    const minimum = Number.parseFloat(material.estoque_minimo);

    return current <= minimum;
  });
  const materialsById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );
  const selectedMaterials = selectedMaterialIds
    .map((id) => materialsById.get(id))
    .filter((material): material is Material => Boolean(material));
  const allVisibleSelected =
    materials.length > 0 &&
    materials.every((material) => selectedMaterialIds.includes(material.id));

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  async function handleDelete(material: Material) {
    const confirmed = window.confirm(
      `Excluir "${material.nome}" do estoque? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(material.id);
    setError('');

    try {
      await deleteMaterial(material.id);
      setMaterials((currentMaterials) =>
        currentMaterials.filter(
          (currentMaterial) => currentMaterial.id !== material.id,
        ),
      );
    } catch {
      setError('Não foi possível excluir o item de estoque.');
    } finally {
      setDeletingId(null);
    }
  }

  function toggleMaterialSelection(materialId: number) {
    setSelectedMaterialIds((currentIds) =>
      currentIds.includes(materialId)
        ? currentIds.filter((id) => id !== materialId)
        : [...currentIds, materialId],
    );
  }

  function toggleVisibleSelection() {
    if (allVisibleSelected) {
      setSelectedMaterialIds([]);
      return;
    }

    setSelectedMaterialIds(materials.map((material) => material.id));
  }

  function updateBulkMovementField(
    field: keyof typeof initialBulkMovementForm,
    value: string,
  ) {
    setBulkMovementForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleBulkMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedMaterialIds.length === 0) {
      setError('Selecione ao menos um material para movimentar.');
      return;
    }

    setIsSavingBulkMovement(true);
    setError('');

    try {
      await Promise.all(
        selectedMaterialIds.map((materialId) =>
          createStockMovement({
            material: materialId,
            ...bulkMovementForm,
          }),
        ),
      );
      setBulkMovementForm(initialBulkMovementForm);
      setIsBulkMovementOpen(false);
      setSelectedMaterialIds([]);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch {
      setError('Não foi possível registrar a movimentação selecionada.');
    } finally {
      setIsSavingBulkMovement(false);
    }
  }

  return (
    <AppShell activePage="Estoque">
      <PageHeader
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-frenchRose/30 bg-white px-4 text-sm font-bold text-frenchRose shadow-sm transition hover:-translate-y-0.5 hover:bg-chantilly/30 hover:shadow-lg sm:min-h-9 sm:w-auto sm:text-xs"
              disabled={selectedMaterialIds.length === 0}
              onClick={() => setIsBulkMovementOpen((isOpen) => !isOpen)}
              type="button"
            >
              <ArrowUpDown aria-hidden className="h-4 w-4" />
              Movimentar selecionados
            </button>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg sm:min-h-9 sm:w-auto sm:text-xs"
              onClick={() => navigate('/estoque/novo')}
              type="button"
            >
              <Plus aria-hidden className="h-4 w-4" />
              Novo Material
            </button>
          </div>
        }
        breadcrumb="Dashboard / Estoque"
        title="Estoque"
      />

      <AlertMessage>{error}</AlertMessage>

      {isBulkMovementOpen ? (
        <Surface as="section" className="mb-5">
          <SurfaceHeader>
            <p className="text-xs font-semibold text-mauve">Movimentação em lote</p>
            <h2 className="mt-1 text-sm font-extrabold text-ink">
              {selectedMaterialIds.length} item(ns) selecionado(s)
            </h2>
          </SurfaceHeader>

          <form
            className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px]"
            onSubmit={handleBulkMovementSubmit}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Tipo"
                name="tipo_movimentacao_lote"
                onChange={(event) =>
                  updateBulkMovementField(
                    'tipo',
                    event.target.value as StockMovementPayload['tipo'],
                  )
                }
                value={bulkMovementForm.tipo}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </SelectField>

              <TextField
                label="Quantidade por item *"
                min="0.01"
                name="quantidade_movimentacao_lote"
                onChange={(event) =>
                  updateBulkMovementField('quantidade', event.target.value)
                }
                required
                step="0.01"
                type="number"
                value={bulkMovementForm.quantidade}
              />

              <TextAreaField
                className="sm:col-span-2"
                label="Observação"
                name="observacao_movimentacao_lote"
                onChange={(event) =>
                  updateBulkMovementField('observacao', event.target.value)
                }
                value={bulkMovementForm.observacao}
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
                disabled={isSavingBulkMovement}
                type="submit"
              >
                {isSavingBulkMovement ? 'Registrando...' : 'Registrar movimentação'}
              </button>
            </div>
          </form>
        </Surface>
      ) : null}

      <Surface>
        <FilterToolbar
          filters={
            <>
              <label className="sr-only" htmlFor="stock-unit-filter">
                Filtrar por unidade
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-40"
                id="stock-unit-filter"
                onChange={(event) => updateUnitFilter(event.target.value)}
                value={unitFilter}
              >
                <option value="">Todas as unidades</option>
                <option value="unidade">Unidade</option>
                <option value="cone">Cone</option>
                <option value="metro">Metro</option>
                <option value="kg">Kg</option>
                <option value="rolo">Rolo</option>
                <option value="pecas">Peças</option>
              </select>

              <label className="sr-only" htmlFor="stock-situation-filter">
                Filtrar por situação
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-40"
                id="stock-situation-filter"
                onChange={(event) => updateSituationFilter(event.target.value)}
                value={situationFilter}
              >
                <option value="">Todas as situações</option>
                <option value="reposicao">Reposição</option>
                <option value="ok">Ok</option>
              </select>
            </>
          }
          primary={
            <label className="relative block" htmlFor="stock-search">
              <span className="sr-only">Buscar material</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                id="stock-search"
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Buscar por nome ou descrição"
                type="search"
                value={search}
              />
            </label>
          }
        />

        {!isLoading && lowStockMaterials.length > 0 ? (
          <div className="grid gap-3 border-t border-slate-100 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
            {lowStockMaterials.slice(0, 6).map((material) => (
              <button
                className="relative rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left shadow-sm transition after:absolute after:-bottom-2 after:left-7 after:h-4 after:w-4 after:rotate-45 after:border-b after:border-r after:border-amber-200 after:bg-amber-50 hover:-translate-y-0.5 hover:shadow-md"
                key={material.id}
                onClick={() => navigate(`/estoque/${material.id}`)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-600">
                    <AlertTriangle aria-hidden className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-amber-900">
                      {material.nome}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-amber-800">
                      {material.quantidade_atual} em estoque, mínimo{' '}
                      {material.estoque_minimo}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {isLoading ? (
          <LoadingRows />
        ) : materials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      aria-label="Selecionar materiais visíveis"
                      checked={allVisibleSelected}
                      className="h-4 w-4 rounded border-slate-300 text-frenchRose focus:ring-frenchRose"
                      onChange={toggleVisibleSelection}
                      type="checkbox"
                    />
                  </th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3">Estoque mínimo</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((material) => {
                  const current = Number.parseFloat(material.quantidade_atual);
                  const minimum = Number.parseFloat(material.estoque_minimo);
                  const isLow = current <= minimum;

                  return (
                    <tr
                      className="cursor-pointer bg-white transition hover:bg-chantilly/20"
                      key={material.id}
                      onClick={() => navigate(`/estoque/${material.id}`)}
                    >
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Selecionar ${material.nome}`}
                          checked={selectedMaterialIds.includes(material.id)}
                          className="h-4 w-4 rounded border-slate-300 text-frenchRose focus:ring-frenchRose"
                          onChange={() => toggleMaterialSelection(material.id)}
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
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-xs font-bold',
                            isLow
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700',
                          ].join(' ')}
                        >
                          {isLow ? 'Reposição' : 'Ok'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconButton
                          aria-label={`Movimentar ${material.nome}`}
                          className="mr-1"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/estoque/${material.id}`);
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
                            navigate(`/estoque/${material.id}/editar`);
                          }}
                          title="Editar material"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          aria-label={`Excluir ${material.nome}`}
                          disabled={deletingId === material.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(material);
                          }}
                          title="Excluir material"
                          tone="danger"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Inbox aria-hidden className="h-5 w-5" />}
            title="Nenhum material cadastrado."
          />
        )}
        {count > pageSize ? (
          <PaginationControls
            count={count}
            onPageChange={setPage}
            onPageSizeChange={updatePageSize}
            page={page}
            pageSize={pageSize}
          />
        ) : null}
      </Surface>

      <Surface className="mt-5">
        <SurfaceHeader className="flex items-center gap-2">
          <History aria-hidden className="h-4 w-4 text-frenchRose" />
          <h2 className="text-sm font-extrabold text-ink">
            Histórico de Movimentações
          </h2>
        </SurfaceHeader>
        {movements.length > 0 ? (
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
                  const isEntry = movement.tipo === 'entrada';

                  return (
                    <tr className="bg-white" key={movement.id}>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">
                        {formatDateTime(movement.registrado_em)}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-ink">
                        {material?.nome ?? `Material #${movement.material}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-xs font-bold',
                            isEntry
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700',
                          ].join(' ')}
                        >
                          {isEntry ? 'Entrada' : 'Saída'}
                        </span>
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
        ) : (
          <EmptyState
            minHeightClassName="min-h-40"
            title="Nenhuma movimentação registrada."
          />
        )}
      </Surface>
    </AppShell>
  );
}
