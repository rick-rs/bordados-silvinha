import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { getSession } from '../../services/auth';
import { getMaterial, Material } from '../../services/stock';

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

export function StockDetailPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const response = await getMaterial(materialId);

        if (isMounted) {
          setMaterial(response);
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
      ) : null}
    </AppShell>
  );
}
