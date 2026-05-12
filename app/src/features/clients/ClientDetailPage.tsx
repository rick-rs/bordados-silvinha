import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { getSession } from '../../services/auth';
import { Client, getClient } from '../../services/clients';

function showEditPlaceholder() {
  window.alert('A edição será implementada em uma próxima etapa.');
}

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

export function ClientDetailPage() {
  const user = getSession();
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const clientId = Number(id);

    async function loadClient() {
      if (!clientId) {
        setError('Cliente inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getClient(clientId);

        if (isMounted) {
          setClient(response);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o cliente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadClient();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return (
    <AppShell activePage="Clientes">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">
            Dashboard / Clientes
          </p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            {client?.nome ?? 'Detalhes do Cliente'}
          </h1>
        </div>
        <Button
          className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
          onClick={showEditPlaceholder}
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
      ) : client ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">
              Informações do Cliente
            </h2>
          </div>
          <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Nome completo" value={client.nome} />
            <DetailItem label="Telefone/Whatsapp" value={client.telefone} />
            <DetailItem label="E-mail" value={client.email} />
            <DetailItem label="Rede social" value={client.rede_social} />
            <DetailItem label="CEP" value={client.cep} />
            <DetailItem label="Endereço" value={client.endereco} />
            <DetailItem label="Número" value={client.numero} />
            <DetailItem label="Complemento" value={client.complemento} />
            <DetailItem label="Bairro" value={client.bairro} />
            <DetailItem label="Cidade" value={client.cidade} />
            <DetailItem label="Estado" value={client.estado} />
          </dl>
        </section>
      ) : null}
    </AppShell>
  );
}
