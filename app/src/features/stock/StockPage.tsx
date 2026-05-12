import { useEffect, useState } from 'react';
import { Inbox, Pencil, Search, Trash2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { PaginationControls } from '../../components/ui/PaginationControls';
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
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">Dashboard / Estoque</p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Estoque</h1>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 px-4 py-3 lg:grid-cols-[1fr_160px_160px]">
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

          <label className="sr-only" htmlFor="stock-unit-filter">
            Filtrar por unidade
          </label>
          <select
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
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
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
            id="stock-situation-filter"
            onChange={(event) => updateSituationFilter(event.target.value)}
            value={situationFilter}
          >
            <option value="">Todas as situações</option>
            <option value="reposicao">Reposição</option>
            <option value="ok">Ok</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-4">
            {[0, 1, 2].map((item) => (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" key={item} />
            ))}
          </div>
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
                        <button
                          aria-label={`Editar ${material.nome}`}
                          className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/estoque/${material.id}/editar`);
                          }}
                          title="Editar material"
                          type="button"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`Excluir ${material.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deletingId === material.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(material);
                          }}
                          title="Excluir material"
                          type="button"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-frenchRose">
                <Inbox aria-hidden className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-600">
                Nenhum material cadastrado.
              </p>
            </div>
          </div>
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
      </section>
    </AppShell>
  );
}
