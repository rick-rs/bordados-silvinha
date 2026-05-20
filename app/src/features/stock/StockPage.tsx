import { FormEvent, useMemo, useState, useEffect } from 'react';
import { ArrowUpDown, History, Inbox, Plus, Search } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { ConfirmDialog } from '../../components/ui/dialogs';
import { AlertMessage, EmptyState, LoadingRows } from '../../components/ui/feedback';
import { FilterToolbar } from '../../components/ui/filters';
import { PageHeader } from '../../components/ui/headers';
import { PaginationControls } from '../../components/ui/pagination';
import { Surface, SurfaceHeader } from '../../components/ui/surfaces';
import { StockTableRow, StockMovementHistoryTable } from '../../components/ui/tables';
import { StockAlertCard } from '../../components/ui/cards';
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
import { StockMovementModal } from './StockMovementModal';

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
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
    setPendingDelete(material);
    setShowConfirm(true);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    setError('');
    setShowConfirm(false);
    try {
      await deleteMaterial(pendingDelete.id);
      setMaterials((currentMaterials) =>
        currentMaterials.filter(
          (currentMaterial) => currentMaterial.id !== pendingDelete.id,
        ),
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setError('Não foi possível excluir o item de estoque.');
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
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
            <Button
              className="w-full sm:w-auto disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none disabled:hover:bg-transparent disabled:hover:text-inherit"
              disabled={selectedMaterialIds.length === 0}
              onClick={() => setIsBulkMovementOpen((isOpen) => !isOpen)}
              type="button"
              tone="outline"
            >
              <ArrowUpDown aria-hidden className="h-4 w-4" />
              Movimentar selecionados
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate('/estoque/novo')}
              type="button"
              tone="primary"
            >
              <Plus aria-hidden className="h-4 w-4" />
              Novo Material
            </Button>
          </div>
        }
        breadcrumb="Dashboard / Estoque"
        title="Estoque"
      />

      <AlertMessage>{error}</AlertMessage>
      {showSuccess && (
        <AlertMessage className="mb-0 bg-green-100 border-green-400 text-green-700">
          Item excluído com sucesso!
        </AlertMessage>
      )}

      {isBulkMovementOpen ? (
        <StockMovementModal
          form={bulkMovementForm}
          isLoading={isSavingBulkMovement}
          selectedMaterials={selectedMaterials}
          onSubmit={handleBulkMovementSubmit}
          onFieldChange={updateBulkMovementField}
        />
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
              <StockAlertCard
                key={material.id}
                material={material}
                onClick={() => navigate(`/estoque/${material.id}`)}
              />
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
                {materials.map((material) => (
                  <StockTableRow
                    key={material.id}
                    material={material}
                    isSelected={selectedMaterialIds.includes(material.id)}
                    isDeletingId={deletingId}
                    onToggleSelect={() => toggleMaterialSelection(material.id)}
                    onNavigateMovement={() => navigate(`/estoque/${material.id}`)}
                    onNavigateEdit={() => navigate(`/estoque/${material.id}/editar`)}
                    onDelete={() => handleDelete(material)}
                  />
                ))}
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
      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deletingId !== null}
        title="Confirmar exclusão"
        description="Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        tone="danger"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />

      <Surface className="mt-5">
        <SurfaceHeader className="flex items-center gap-2">
          <History aria-hidden className="h-4 w-4 text-frenchRose" />
          <h2 className="text-sm font-extrabold text-ink">
            Histórico de Movimentações
          </h2>
        </SurfaceHeader>
        <StockMovementHistoryTable
          movements={movements}
          materialsById={materialsById}
          formatDateTime={formatDateTime}
        />
      </Surface>
    </AppShell>
  );
}
