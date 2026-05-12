import { FormEvent, useEffect, useState } from 'react';
import { Inbox, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import {
  Client,
  ClientPayload,
  createClient,
  deleteClient,
  listClientsPage,
  searchCep,
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

function EmptyState() {
  return (
    <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-chantilly/50 text-xl text-frenchRose">
          <Inbox aria-hidden className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-600">
          Nenhum cliente cadastrado ainda.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Cadastre o primeiro cliente para começar a organizar seus pedidos.
        </p>
      </div>
    </div>
  );
}

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
    const confirmed = window.confirm(
      `Excluir o cliente "${client.nome}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(client.id);
    setError('');

    try {
      await deleteClient(client.id);
      setClients((currentClients) =>
        currentClients.filter((currentClient) => currentClient.id !== client.id),
      );
    } catch {
      setError(
        'Não foi possível excluir o cliente. Verifique se ele possui pedidos vinculados.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function showEditPlaceholder() {
    window.alert('A edição será implementada em uma próxima etapa.');
  }

  return (
    <AppShell activePage="Clientes">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-mauve">Dashboard / Clientes</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Clientes
          </h1>
        </div>
        <Link
          className={[
            'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-frenchRose px-4 text-sm font-bold text-white shadow-sm transition',
            'hover:-translate-y-0.5 hover:bg-froly hover:shadow-lg',
            'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-froly/30',
            'sm:min-h-9 sm:w-auto sm:text-xs',
          ].join(' ')}
          to="/clientes/novo"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Novo Cliente
        </Link>
      </header>

      {error ? (
        <p className="mb-5 rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 px-4 py-3 lg:grid-cols-[1fr_140px]">
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

          <label className="sr-only" htmlFor="client-state-filter">
            Filtrar por estado
          </label>
          <input
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold uppercase text-slate-700 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
            id="client-state-filter"
            maxLength={2}
            onChange={(event) => updateStateFilter(event.target.value)}
            placeholder="Estado"
            value={stateFilter}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-4">
            {[0, 1, 2].map((item) => (
              <div
                className="h-16 animate-pulse rounded-lg bg-slate-100"
                key={item}
              />
            ))}
          </div>
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
                  <tr
                    className="cursor-pointer bg-white transition hover:bg-chantilly/20"
                    key={client.id}
                    onClick={() => navigate(`/clientes/${client.id}`)}
                  >
                    <td className="px-4 py-3 font-extrabold text-ink">
                      {client.nome}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {client.telefone || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {client.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {client.cidade || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {client.estado || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        aria-label={`Editar cliente ${client.nome}`}
                        className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                        onClick={(event) => {
                          event.stopPropagation();
                          showEditPlaceholder();
                        }}
                        type="button"
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Excluir cliente ${client.nome}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-frenchRose transition hover:bg-chantilly/45 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === client.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(client);
                        }}
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
          <EmptyState />
        )}
        <PaginationControls
          count={count}
          onPageChange={setPage}
          onPageSizeChange={updatePageSize}
          page={page}
          pageSize={pageSize}
        />
      </section>
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
      navigate('/clientes', { replace: true });
    } catch {
      setError('Não foi possível salvar o cliente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell activePage="Clientes">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">
          Dashboard / Clientes / Novo Cliente
        </p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Novo Cliente
        </h1>
      </header>

      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white shadow-sm">
        <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit}>
          <TextField
            label="Nome Completo *"
            name="nome"
            onChange={(event) => updateField('nome', event.target.value)}
            required
            value={form.nome}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Telefone/Whatsapp *"
              name="telefone"
              onChange={(event) => updateField('telefone', event.target.value)}
              required
              value={form.telefone}
            />
            <TextField
              label="E-mail"
              name="email"
              onChange={(event) => updateField('email', event.target.value)}
              type="email"
              value={form.email}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Rede Social"
              name="rede_social"
              onChange={(event) => updateField('rede_social', event.target.value)}
              placeholder="Ex: @usuario_instagram"
              value={form.rede_social}
            />
            <TextField
              label={isSearchingCep ? 'CEP (buscando...)' : 'CEP'}
              name="cep"
              onChange={(event) => updateField('cep', event.target.value)}
              value={form.cep}
            />
          </div>

          <TextField
            label="Endereço"
            name="endereco"
            onChange={(event) => updateField('endereco', event.target.value)}
            value={form.endereco}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Número"
              name="numero"
              onChange={(event) => updateField('numero', event.target.value)}
              value={form.numero}
            />
            <TextField
              label="Complemento"
              name="complemento"
              onChange={(event) => updateField('complemento', event.target.value)}
              value={form.complemento}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Bairro"
              name="bairro"
              onChange={(event) => updateField('bairro', event.target.value)}
              value={form.bairro}
            />
            <TextField
              label="Cidade"
              name="cidade"
              onChange={(event) => updateField('cidade', event.target.value)}
              value={form.cidade}
            />
          </div>

          <TextField
            className="sm:max-w-[50%]"
            label="Estado"
            maxLength={2}
            name="estado"
            onChange={(event) =>
              updateField('estado', event.target.value.toUpperCase())
            }
            value={form.estado}
          />

          {error ? (
            <p className="rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              onClick={() => navigate('/clientes')}
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
              Salvar
            </Button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
