import { useEffect, useState } from 'react';
import { Inbox, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { getSession } from '../../services/auth';
import { deleteProduct, listProducts, Product } from '../../services/orders';

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

export function CatalogPage() {
  const user = getSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const response = await listProducts();

        if (isMounted) {
          setProducts(response);
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
  }, []);

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

  return (
    <AppShell activePage="Catálogo">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">Dashboard / Catálogo</p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Catálogo</h1>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-extrabold text-ink">Itens do Catálogo</h2>
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-4">
            {[0, 1, 2].map((item) => (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" key={item} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Preço Base</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr className="bg-white" key={product.id}>
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
                    <td className="px-4 py-3 font-extrabold text-frenchRose">
                      {formatMoney(product.preco_base)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.ativo ? 'Ativo' : 'Inativo'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        aria-label={`Excluir ${product.nome}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product)}
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
      </section>
    </AppShell>
  );
}
