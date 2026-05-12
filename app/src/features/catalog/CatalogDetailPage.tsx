import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { getSession } from '../../services/auth';
import { getProduct, Product } from '../../services/orders';
import { formatCurrency } from '../../utils/format';

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

export function CatalogDetailPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const productId = Number(id);

    async function loadProduct() {
      if (!productId) {
        setError('Item inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getProduct(productId);

        if (isMounted) {
          setProduct(response);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o item do catálogo.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return (
    <AppShell activePage="Catálogo">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">
            Dashboard / Catálogo
          </p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            {product?.nome ?? 'Detalhes do Catálogo'}
          </h1>
        </div>
        <Button
          className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
          onClick={() => navigate(`/catalogo/${id}/editar`)}
          title="Editar item"
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
      ) : product ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Informações do Item</h2>
          </div>
          <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Nome" value={product.nome} />
            <DetailItem label="Categoria" value={product.categoria} />
            <DetailItem label="Subcategoria" value={product.subcategoria} />
            <DetailItem label="Tipo" value={product.tipo} />
            <DetailItem
              label="Preço base"
              value={formatCurrency(product.preco_base) ?? 'R$ 0,00'}
            />
            <DetailItem label="Status" value={product.ativo ? 'Ativo' : 'Inativo'} />
            <DetailItem label="Descrição" value={product.descricao} />
          </dl>
        </section>
      ) : null}
    </AppShell>
  );
}
