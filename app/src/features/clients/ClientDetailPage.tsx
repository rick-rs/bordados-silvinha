import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { DescriptionItem, DescriptionList } from '../../components/ui/DescriptionList';
import { AlertMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Surface, SurfaceHeader } from '../../components/ui/Surface';
import { getSession } from '../../services/auth';
import { Client, getClient } from '../../services/clients';

export function ClientDetailPage() {
  const user = getSession();
  const navigate = useNavigate();
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
      <PageHeader
        actions={
          <Button
            className="min-h-11 gap-2 px-4 text-sm sm:min-h-9 sm:text-xs"
            onClick={() => navigate(`/clientes/${id}/editar`)}
            title="Editar cliente"
            type="button"
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Editar
          </Button>
        }
        breadcrumb="Dashboard / Clientes"
        title={client?.nome ?? 'Detalhes do Cliente'}
      />

      <AlertMessage>{error}</AlertMessage>

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-white shadow-sm" />
      ) : client ? (
        <Surface>
          <SurfaceHeader>
            <h2 className="text-sm font-extrabold text-ink">
              Informações do Cliente
            </h2>
          </SurfaceHeader>
          <DescriptionList>
            <DescriptionItem label="Nome completo" value={client.nome} />
            <DescriptionItem label="Telefone/Whatsapp" value={client.telefone} />
            <DescriptionItem label="E-mail" value={client.email} />
            <DescriptionItem label="Rede social" value={client.rede_social} />
            <DescriptionItem label="CEP" value={client.cep} />
            <DescriptionItem label="Endereço" value={client.endereco} />
            <DescriptionItem label="Número" value={client.numero} />
            <DescriptionItem label="Complemento" value={client.complemento} />
            <DescriptionItem label="Bairro" value={client.bairro} />
            <DescriptionItem label="Cidade" value={client.cidade} />
            <DescriptionItem label="Estado" value={client.estado} />
          </DescriptionList>
        </Surface>
      ) : null}
    </AppShell>
  );
}
