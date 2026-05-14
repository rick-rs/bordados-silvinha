import { useEffect, useState } from 'react';
import {
  Download,
  Grid2X2,
  Image,
  Inbox,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { FilterToolbar } from '../../components/ui/FilterToolbar';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { getSession } from '../../services/auth';
import { deleteProduct, listProductsPage, Product } from '../../services/orders';

type CatalogView = 'list' | 'cards';
const catalogViewStorageKey = 'bordados:catalog-view';

function formatMoney(value: string) {
  const amount = Number.parseFloat(value);

  if (Number.isNaN(amount)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(amount);
}

function getInitialCatalogView(): CatalogView {
  const storedView = window.localStorage.getItem(catalogViewStorageKey);

  return storedView === 'cards' || storedView === 'list' ? storedView : 'list';
}

function csvEscape(value: string | number | boolean | null | undefined) {
  const normalizedValue = value === null || value === undefined ? '' : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function buildCatalogCsv(products: Product[]) {
  const headers = [
    'ID',
    'Nome',
    'Categoria',
    'Subcategoria',
    'Tipo',
    'Preco Base',
    'Tempo Estimado',
    'Status',
    'Descricao',
    'Imagem URL',
  ];
  const rows = products.map((product) => [
    product.id,
    product.nome,
    product.categoria,
    product.subcategoria,
    product.tipo,
    product.preco_base,
    product.tempo_estimado,
    product.ativo ? 'Ativo' : 'Inativo',
    product.descricao,
    product.imagem_url,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(';'))
    .join('\n');
}

export function CatalogPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [catalogView, setCatalogView] = useState<CatalogView>(getInitialCatalogView);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const response = await listProductsPage({
          ativo: activeFilter,
          page,
          pageSize,
          q: search,
          tipo: typeFilter,
        });

        if (isMounted) {
          setProducts(response.results);
          setCount(response.count);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o catálogo.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, page, pageSize, search, typeFilter]);

  useEffect(() => {
    window.localStorage.setItem(catalogViewStorageKey, catalogView);
  }, [catalogView]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateTypeFilter(value: string) {
    setTypeFilter(value);
    setPage(1);
  }

  function updateActiveFilter(value: string) {
    setActiveFilter(value);
    setPage(1);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Excluir "${product.nome}" do catálogo? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setError('');

    try {
      await deleteProduct(product.id);
      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== product.id),
      );
    } catch {
      setError(
        'Não foi possível excluir o item. Verifique se ele possui pedidos vinculados.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExportCatalog() {
    setIsExporting(true);
    setError('');

    try {
      const pageSizeForExport = 100;
      let currentPage = 1;
      let exportedProducts: Product[] = [];
      let totalCount = 0;

      do {
        const response = await listProductsPage({
          ativo: activeFilter,
          page: currentPage,
          pageSize: pageSizeForExport,
          q: search,
          tipo: typeFilter,
        });

        exportedProducts = [...exportedProducts, ...response.results];
        totalCount = response.count;
        currentPage += 1;
      } while (exportedProducts.length < totalCount);

      const csv = buildCatalogCsv(exportedProducts);
      const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `catalogo-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Não foi possível exportar o catálogo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AppShell activePage="Catálogo">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">Dashboard / Catálogo</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Catálogo
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className={[
              'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition',
              'hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60',
              'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-froly/30',
              'sm:min-h-9 sm:w-auto sm:text-xs',
            ].join(' ')}
            disabled={isExporting}
            onClick={handleExportCatalog}
            type="button"
          >
            <Download aria-hidden className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
          <button
            className={[
              'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition',
              'hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg',
              'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-froly/30',
              'sm:min-h-9 sm:w-auto sm:text-xs',
            ].join(' ')}
            onClick={() => navigate('/catalogo/novo')}
            type="button"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Novo Item
          </button>
        </div>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <FilterToolbar
          actions={
            <div className="inline-grid min-h-10 w-full grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-extrabold text-slate-500 sm:w-[190px]">
            <button
              aria-label="Visualizar catálogo em lista"
              className={[
                'inline-flex items-center justify-center gap-2 rounded-md px-3 transition',
                catalogView === 'list'
                  ? 'bg-white text-frenchRose shadow-sm'
                  : 'hover:text-ink',
              ].join(' ')}
              onClick={() => setCatalogView('list')}
              type="button"
            >
              <List aria-hidden className="h-4 w-4" />
              Lista
            </button>
            <button
              aria-label="Visualizar catálogo em cards"
              className={[
                'inline-flex items-center justify-center gap-2 rounded-md px-3 transition',
                catalogView === 'cards'
                  ? 'bg-white text-frenchRose shadow-sm'
                  : 'hover:text-ink',
              ].join(' ')}
              onClick={() => setCatalogView('cards')}
              type="button"
            >
              <Grid2X2 aria-hidden className="h-4 w-4" />
              Cards
            </button>
          </div>
          }
          filters={
            <>
              <label className="sr-only" htmlFor="catalog-type-filter">
                Filtrar por tipo
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-40"
                id="catalog-type-filter"
                onChange={(event) => updateTypeFilter(event.target.value)}
                value={typeFilter}
              >
                <option value="">Todos os tipos</option>
                <option value="peca">Peça</option>
                <option value="bordado">Bordado</option>
              </select>

              <label className="sr-only" htmlFor="catalog-active-filter">
                Filtrar por status
              </label>
              <select
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-40"
                id="catalog-active-filter"
                onChange={(event) => updateActiveFilter(event.target.value)}
                value={activeFilter}
              >
                <option value="">Todos os status</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </>
          }
          primary={
            <label className="relative block" htmlFor="catalog-search">
              <span className="sr-only">Buscar item do catálogo</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                id="catalog-search"
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Buscar por nome, categoria ou descrição"
                type="search"
                value={search}
              />
            </label>
          }
        />

        {isLoading ? (
          <div className="grid gap-3 p-4">
            {[0, 1, 2].map((item) => (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" key={item} />
            ))}
          </div>
        ) : products.length > 0 && catalogView === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Tempo</th>
                  <th className="px-4 py-3">Preço Base</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    className="cursor-pointer bg-white transition hover:bg-chantilly/20"
                    key={product.id}
                    onClick={() => navigate(`/catalogo/${product.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-ink">{product.nome}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.descricao || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.categoria || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.tipo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.tempo_estimado
                        ? `${Number(product.tempo_estimado).toLocaleString('pt-BR')} h`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-frenchRose">
                      {formatMoney(product.preco_base)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.ativo ? 'Ativo' : 'Inativo'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        aria-label={`Editar ${product.nome}`}
                        className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/catalogo/${product.id}/editar`);
                        }}
                        title="Editar item"
                        type="button"
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Excluir ${product.nome}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === product.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(product);
                        }}
                        title="Excluir item"
                        type="button"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-frenchRose/30 hover:shadow-md"
                key={product.id}
                onClick={() => navigate(`/catalogo/${product.id}`)}
              >
                {product.imagem_url ? (
                  <img
                    alt={product.nome}
                    className="h-40 w-full object-cover"
                    src={product.imagem_url}
                  />
                ) : (
                  <div className="grid h-40 place-items-center bg-chantilly/25 text-frenchRose">
                    <Image aria-hidden className="h-9 w-9" />
                  </div>
                )}
                <div className="grid gap-3 p-4">
                  <div>
                    <p className="font-extrabold text-ink">{product.nome}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {product.descricao || 'Sem descrição'}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {product.tempo_estimado
                        ? `Tempo estimado: ${Number(
                            product.tempo_estimado,
                          ).toLocaleString('pt-BR')} h`
                        : 'Tempo estimado não informado'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-chantilly/45 px-2 py-1 text-xs font-bold text-frenchRose">
                      {product.tipo}
                    </span>
                    <p className="font-extrabold text-frenchRose">
                      {formatMoney(product.preco_base)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-slate-500">
                      {product.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <div>
                      <button
                        aria-label={`Editar ${product.nome}`}
                        className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/catalogo/${product.id}/editar`);
                        }}
                        title="Editar item"
                        type="button"
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Excluir ${product.nome}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === product.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(product);
                        }}
                        title="Excluir item"
                        type="button"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-frenchRose">
                <Inbox aria-hidden className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-600">
                Nenhum item no catálogo.
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
