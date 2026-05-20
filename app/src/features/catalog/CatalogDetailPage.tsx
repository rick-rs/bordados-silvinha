import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { DescriptionItem, DescriptionList } from '../../components/ui/descriptions';
import { AlertMessage } from '../../components/ui/feedback';
import { PageHeader } from '../../components/ui/headers';
import { Surface, SurfaceHeader } from '../../components/ui/surfaces';
import { getSession } from '../../services/auth';
import { getProduct, Product } from '../../services/orders';
import { formatCurrency } from '../../utils/format';

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
      <PageHeader
        actions={
          <Button
            className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
            onClick={() => navigate(`/catalogo/${id}/editar`)}
            title="Editar item"
            type="button"
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Editar
          </Button>
        }
        breadcrumb="Dashboard / Catálogo"
        title={product?.nome ?? 'Detalhes do Catálogo'}
      />

      <AlertMessage>{error}</AlertMessage>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-white shadow-sm" />
      ) : product ? (
        <Surface>
          {product.imagem_url ? (
            <img
              alt={product.nome}
              className="h-56 w-full rounded-t-lg object-cover"
              src={product.imagem_url}
            />
          ) : null}
          <SurfaceHeader>
            <h2 className="text-sm font-extrabold text-ink">Informações do Item</h2>
          </SurfaceHeader>
          <DescriptionList>
            <DescriptionItem label="Nome" value={product.nome} />
            <DescriptionItem label="Categoria" value={product.categoria} />
            <DescriptionItem label="Subcategoria" value={product.subcategoria} />
            <DescriptionItem label="Tipo" value={product.tipo} />
            <DescriptionItem
              label="Preço base"
              value={formatCurrency(product.preco_base) ?? 'R$ 0,00'}
            />
            <DescriptionItem
              label="Tempo estimado"
              value={
                product.tempo_estimado
                  ? `${Number(product.tempo_estimado).toLocaleString('pt-BR')} h`
                  : '-'
              }
            />
            <DescriptionItem label="Status" value={product.ativo ? 'Ativo' : 'Inativo'} />
            <DescriptionItem label="Descrição" value={product.descricao} />
          </DescriptionList>
        </Surface>
      ) : null}
    </AppShell>
  );
}
