import { FormEvent, useEffect, useState } from 'react';
import { Inbox, Plus, Search } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { AlertMessage, EmptyState, LoadingRows } from '../../components/ui/feedback';
import { ConfirmDialog } from '../../components/ui/dialogs';
import { FilterToolbar } from '../../components/ui/filters';
import { ClientTableRow } from '../../components/ui/tables';
import { PageHeader } from '../../components/ui/headers';
import { PaginationControls } from '../../components/ui/pagination';
import { Button } from '../../components/ui/buttons';
import { Surface } from '../../components/ui/surfaces';
import { TextField } from '../../components/ui/forms';
import {
  Client,
  ClientPayload,
  createClient,
  deleteClient,
  getClient,
  listClientsPage,
  searchCep,
  updateClient,
} from '../../services/clients';
import { getSession } from '../../services/auth';

const initialForm: ClientPayload = {
  nome: '',
  telefone: '',
  email: '',
  rede_social: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

export function ClientsPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      setIsLoading(true);

      try {
        const response = await listClientsPage({
          estado: stateFilter,
          page,
          pageSize,
          q: search,
        });

        if (isMounted) {
          setClients(response.results);
          setCount(response.count);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar os clientes.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, search, stateFilter]);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStateFilter(value: string) {
    setStateFilter(value.toUpperCase());
    setPage(1);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  async function handleDelete(client: Client) {
    setPendingDelete(client);
    setShowConfirm(true);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    setError('');
    setShowConfirm(false);
    try {
      await deleteClient(pendingDelete.id);
      setClients((currentClients) =>
        currentClients.filter((currentClient) => currentClient.id !== pendingDelete.id),
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setError(
        'Não foi possível excluir o cliente. Verifique se ele possui pedidos vinculados.',
      );
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  return (
    <AppShell activePage="Clientes">
      <PageHeader
        actions={
          <Link to="/clientes/novo">
            <Button className="w-full sm:w-auto sm:self-auto" tone="primary">
              <Plus aria-hidden className="h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        }
        breadcrumb="Dashboard / Clientes"
        title="Clientes"
      />

      {!!error && (
        <AlertMessage className="mb-4 bg-rose-100 border-rose-400 text-rose-700">
          {error}
        </AlertMessage>
      )}
      {showSuccess && (
        <AlertMessage className="mb-0 bg-green-100 border-green-400 text-green-700">
          Item excluído com sucesso!
        </AlertMessage>
      )}

      <Surface>
        <FilterToolbar
          filters={
            <>
              <label className="sr-only" htmlFor="client-state-filter">
                Filtrar por estado
              </label>
              <input
                className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold uppercase text-slate-700 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15 xl:w-32"
                id="client-state-filter"
                maxLength={2}
                onChange={(event) => updateStateFilter(event.target.value)}
                placeholder="Estado"
                value={stateFilter}
              />
            </>
          }
          primary={
            <label className="relative block" htmlFor="client-search">
              <span className="sr-only">Buscar cliente</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                id="client-search"
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Buscar por nome, telefone, e-mail ou cidade"
                type="search"
                value={search}
              />
            </label>
          }
        />

        {isLoading ? (
          <LoadingRows />
        ) : clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone/Whatsapp</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <ClientTableRow
                    client={client}
                    deletingId={deletingId}
                    key={client.id}
                    onNavigate={() => navigate(`/clientes/${client.id}`)}
                    onEdit={() => navigate(`/clientes/${client.id}/editar`)}
                    onDelete={() => handleDelete(client)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Inbox aria-hidden className="h-5 w-5" />}
            title="Nenhum cliente cadastrado ainda."
            description="Cadastre o primeiro cliente para começar a organizar seus pedidos."
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
    </AppShell>
  );
}

export function NewClientPage() {
  const user = getSession();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [lastSearchedCep, setLastSearchedCep] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  function updateField(field: keyof ClientPayload, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  useEffect(() => {
    let isMounted = true;
    const normalizedCep = form.cep.replace(/\D/g, '');

    if (normalizedCep.length !== 8 || normalizedCep === lastSearchedCep) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingCep(true);

      try {
        const address = await searchCep(normalizedCep);

        if (address && isMounted) {
          setForm((currentForm) => ({
            ...currentForm,
            cep: address.cep,
            endereco: address.endereco,
            complemento: address.complemento,
            bairro: address.bairro,
            cidade: address.cidade,
            estado: address.estado,
          }));
        }
      } finally {
        if (isMounted) {
          setLastSearchedCep(normalizedCep);
          setIsSearchingCep(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.cep, lastSearchedCep]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await createClient(form);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate('/clientes', { replace: true });
    } catch {
      setError('Não foi possível salvar o cliente.');
    } finally {
      setIsSaving(false);
    }
  }

  // Removido bloco duplicado de verificação de login e handleSubmit

  return (
    <>
      <ClientFormPage
        breadcrumb="Dashboard / Clientes / Novo Cliente"
        error={error}
        form={form}
        isSaving={isSaving}
        isSearchingCep={isSearchingCep}
        onCancel={() => navigate('/clientes')}
        onChange={updateField}
        onSubmit={handleSubmit}
        submitLabel="Salvar"
        title="Novo Cliente"
      />
      {showSuccess && (
        <AlertMessage className="mb-0 bg-green-100 border-green-400 text-green-700">
          Cliente salvo com sucesso!
        </AlertMessage>
      )}
    </>
  );
}

export function EditClientPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [lastSearchedCep, setLastSearchedCep] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
        const client = await getClient(clientId);

        if (isMounted) {
          setForm({
            nome: client.nome,
            telefone: client.telefone ?? '',
            email: client.email ?? '',
            rede_social: client.rede_social ?? '',
            cep: client.cep ?? '',
            endereco: client.endereco ?? '',
            numero: client.numero ?? '',
            complemento: client.complemento ?? '',
            bairro: client.bairro ?? '',
            cidade: client.cidade ?? '',
            estado: client.estado ?? '',
          });
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

  function updateField(field: keyof ClientPayload, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  useEffect(() => {
    let isMounted = true;
    const normalizedCep = form.cep.replace(/\D/g, '');

    if (normalizedCep.length !== 8 || normalizedCep === lastSearchedCep) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingCep(true);

      try {
        const address = await searchCep(normalizedCep);

        if (address && isMounted) {
          setForm((currentForm) => ({
            ...currentForm,
            cep: address.cep,
            endereco: address.endereco || currentForm.endereco,
            complemento: address.complemento || currentForm.complemento,
            bairro: address.bairro || currentForm.bairro,
            cidade: address.cidade || currentForm.cidade,
            estado: address.estado || currentForm.estado,
          }));
        }
      } finally {
        if (isMounted) {
          setLastSearchedCep(normalizedCep);
          setIsSearchingCep(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.cep, lastSearchedCep]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    const clientId = Number(id);
    if (!clientId) {
      setError('Cliente inválido.');
      setShowConfirm(false);
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const client = await updateClient(clientId, form);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate(`/clientes/${client.id}`, { replace: true });
    } catch {
      setError('Não foi possível salvar as alterações do cliente.');
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <ClientFormPage
        breadcrumb="Dashboard / Clientes / Editar Cliente"
        error={error}
        form={form}
        isLoading={isLoading}
        isSaving={isSaving}
        isSearchingCep={isSearchingCep}
        onCancel={() => navigate(`/clientes/${id}`)}
        onChange={updateField}
        onSubmit={handleSubmit}
        submitLabel="Salvar Alterações"
        title="Editar Cliente"
      />
      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        isLoading={isSaving}
        title="Confirmar alteração"
        description="Você tem certeza que deseja salvar as alterações? Esta ação não pode ser desfeita."
        tone="warning"
        confirmLabel="Salvar"
        cancelLabel="Cancelar"
      />
      {showSuccess && (
        <AlertMessage className="mb-0 bg-green-100 border-green-400 text-green-700">
          Cliente salvo com sucesso!
        </AlertMessage>
      )}
    </>
  );
}

function ClientFormPage({
  breadcrumb,
  error,
  form,
  isLoading = false,
  isSaving,
  isSearchingCep,
  onCancel,
  onChange,
  onSubmit,
  submitLabel,
  title,
}: {
  breadcrumb: string;
  error: string;
  form: ClientPayload;
  isLoading?: boolean;
  isSaving: boolean;
  isSearchingCep: boolean;
  onCancel: () => void;
  onChange: (field: keyof ClientPayload, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  title: string;
}) {
  return (
    <AppShell activePage="Clientes">
      <PageHeader breadcrumb={breadcrumb} title={title} />

      <Surface className="mx-auto max-w-3xl">
        {isLoading ? (
          <LoadingRows count={4} rowClassName="h-14" />
        ) : (
          <form className="grid gap-5 p-5 sm:p-6" onSubmit={onSubmit}>
            <TextField
              label="Nome Completo *"
              name="nome"
              onChange={(event) => onChange('nome', event.target.value)}
              required
              value={form.nome}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Telefone/Whatsapp *"
                name="telefone"
                onChange={(event) => onChange('telefone', event.target.value)}
                required
                value={form.telefone}
              />
              <TextField
                label="E-mail"
                name="email"
                onChange={(event) => onChange('email', event.target.value)}
                type="email"
                value={form.email}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Rede Social"
                name="rede_social"
                onChange={(event) => onChange('rede_social', event.target.value)}
                placeholder="Ex: @usuario_instagram"
                value={form.rede_social}
              />
              <TextField
                label={isSearchingCep ? 'CEP (buscando...)' : 'CEP'}
                name="cep"
                onChange={(event) => onChange('cep', event.target.value)}
                value={form.cep}
              />
            </div>

            <TextField
              label="Endereço"
              name="endereco"
              onChange={(event) => onChange('endereco', event.target.value)}
              value={form.endereco}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Número"
                name="numero"
                onChange={(event) => onChange('numero', event.target.value)}
                value={form.numero}
              />
              <TextField
                label="Complemento"
                name="complemento"
                onChange={(event) => onChange('complemento', event.target.value)}
                value={form.complemento}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Bairro"
                name="bairro"
                onChange={(event) => onChange('bairro', event.target.value)}
                value={form.bairro}
              />
              <TextField
                label="Cidade"
                name="cidade"
                onChange={(event) => onChange('cidade', event.target.value)}
                value={form.cidade}
              />
            </div>

            <TextField
              className="sm:max-w-[50%]"
              label="Estado"
              maxLength={2}
              name="estado"
              onChange={(event) => onChange('estado', event.target.value.toUpperCase())}
              value={form.estado}
            />

            <AlertMessage className="mb-0">{error}</AlertMessage>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={onCancel}
                type="button"
              >
                Cancelar
              </button>
              <Button
                className="min-h-11 px-5 text-sm"
                isLoading={isSaving}
                loadingLabel="Salvando..."
                type="submit"
              >
                {submitLabel}
              </Button>
            </div>
          </form>
        )}
      </Surface>
    </AppShell>
  );
}
