import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
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
import { IconButton } from '../../components/ui/IconButton';
import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { Surface } from '../../components/ui/Surface';
import { getSession } from '../../services/auth';
import { deleteMaterial, listMaterialsPage, Material } from '../../services/stock';

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
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadMaterials() {
      setIsLoading(true);

      try {
        const response = await listMaterialsPage({
          page,
          pageSize,
          q: search,
          situacao: situationFilter,
          unidade: unitFilter,
        });

        if (isMounted) {
          setMaterials(response.results);
          setCount(response.count);
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
  }, [page, pageSize, search, situationFilter, unitFilter]);

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

  return (
    <AppShell activePage="Estoque">
      <PageHeader
        actions={
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg sm:min-h-9 sm:w-auto sm:text-xs"
            onClick={() => navigate('/estoque/novo')}
            type="button"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Novo Material
          </button>
        }
        breadcrumb="Dashboard / Estoque"
        title="Estoque"
      />

      <AlertMessage>{error}</AlertMessage>

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
    </AppShell>
  );
}
