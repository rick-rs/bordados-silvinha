import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Search, UserRoundX } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { IconButton } from '../../components/ui/buttons';
import { ConfirmDialog } from '../../components/ui/dialogs';
import { AlertMessage, EmptyState, LoadingRows } from '../../components/ui/feedback';
import { PageHeader } from '../../components/ui/headers';
import { SelectField } from '../../components/ui/forms';
import { Surface } from '../../components/ui/surfaces';
import { getSession, type Usuario } from '../../services/auth';
import { createUser, listUsers, updateUser } from '../../services/users';
import { TextField } from '../../components/ui/forms';

type UserForm = {
  nome: string;
  email: string;
  password: string;
  perfil: Usuario['perfil'];
  pode_gerenciar_matrizes: boolean;
};

const emptyForm: UserForm = {
  nome: '',
  email: '',
  password: '',
  perfil: 'geral',
  pode_gerenciar_matrizes: false,
};

export function UsersAdminPage() {
  const session = getSession();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [pendingStatusUser, setPendingStatusUser] = useState<Usuario | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const result = await listUsers();
        if (active) {
          setUsers(result);
          setError('');
        }
      } catch {
        if (active) {
          setError('Não foi possível carregar as contas. Verifique sua permissão.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    if (session?.perfil === 'administrador') {
      void loadUsers();
    } else {
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [session?.perfil]);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      `${user.nome} ${user.email} ${user.perfil}`.toLocaleLowerCase().includes(term),
    );
  }, [search, users]);

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (session.perfil !== 'administrador') {
    return <Navigate replace to="/dashboard" />;
  }

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
    setNotice('');
    setIsFormOpen(true);
  }

  function openEditForm(user: Usuario) {
    setEditingUser(user);
    setForm({
      nome: user.nome,
      email: user.email,
      password: '',
      perfil: user.perfil,
      pode_gerenciar_matrizes: user.pode_gerenciar_matrizes,
    });
    setError('');
    setNotice('');
    setIsFormOpen(true);
  }

  function updateField<K extends keyof UserForm>(field: K, value: UserForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          perfil: form.perfil,
          pode_gerenciar_matrizes: form.pode_gerenciar_matrizes,
        });
        setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
        setNotice('Conta atualizada.');
      } else {
        const created = await createUser({
          nome: form.nome.trim(),
          email: form.email.trim(),
          perfil: form.perfil,
          pode_gerenciar_matrizes: form.pode_gerenciar_matrizes,
          senha_hash: form.password,
        });
        setUsers((current) => [...current, created].sort((a, b) => a.nome.localeCompare(b.nome)));
        setNotice('Conta criada.');
      }
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingUser(null);
    } catch {
      setError('Não foi possível salvar a conta. Confira os dados e suas permissões.');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive() {
    if (!pendingStatusUser) return;
    setError('');
    setIsSaving(true);
    try {
      const updated = await updateUser(pendingStatusUser.id, {
        ativo: !pendingStatusUser.ativo,
      });
      setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
      setNotice(updated.ativo ? 'Conta reativada.' : 'Conta desativada.');
    } catch {
      setError('Não foi possível alterar a situação da conta.');
    } finally {
      setPendingStatusUser(null);
      setIsSaving(false);
    }
  }

  return (
    <AppShell activePage="Usuários">
      <PageHeader
        actions={(
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-dark"
            onClick={openCreateForm}
            type="button"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Cadastrar usuário
          </button>
        )}
        breadcrumb="Administração / Contas"
        title="Usuários"
      />

      {error ? <AlertMessage className="mb-4">{error}</AlertMessage> : null}
      {notice ? <AlertMessage className="mb-4 bg-green-100 border-green-400 text-green-700">{notice}</AlertMessage> : null}

      {isFormOpen ? (
        <Surface as="section" className="mb-5 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-ink">
              {editingUser ? 'Editar conta' : 'Nova conta'}
            </h2>
            <button
              className="text-sm font-bold text-slate-600 underline"
              onClick={() => setIsFormOpen(false)}
              type="button"
            >
              Fechar
            </button>
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <TextField
              autoComplete="off"
              label="Nome"
              name="user-name"
              onChange={(event) => updateField('nome', event.target.value)}
              required
              value={form.nome}
            />
            <TextField
              autoComplete="off"
              label="E-mail"
              name="user-email"
              onChange={(event) => updateField('email', event.target.value)}
              required
              type="email"
              value={form.email}
            />
            {!editingUser ? (
              <TextField
                autoComplete="new-password"
                label="Senha inicial"
                minLength={8}
                name="user-initial-password"
                onChange={(event) => updateField('password', event.target.value)}
                required
                type="password"
                value={form.password}
              />
            ) : null}
            <SelectField
              label="Perfil principal"
              name="user-profile"
              onChange={(event) => updateField('perfil', event.target.value as Usuario['perfil'])}
              value={form.perfil}
            >
              <option value="geral">Usuário geral</option>
              <option value="administrador">Administrador</option>
            </SelectField>
            <label className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 px-4 sm:col-span-2">
              <input
                checked={form.pode_gerenciar_matrizes}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                onChange={(event) => updateField('pode_gerenciar_matrizes', event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-semibold text-slate-700">Pode gerenciar e aprovar matrizes</span>
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Salvando...' : editingUser ? 'Salvar alterações' : 'Criar conta'}
              </button>
              <button
                className="min-h-11 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-600"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Surface>
      ) : null}

      <Surface>
        <div className="border-b border-slate-100 p-4">
          <label className="relative block max-w-lg" htmlFor="user-search">
            <span className="sr-only">Buscar usuário</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="min-h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              id="user-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou e-mail"
              type="search"
              value={search}
            />
          </label>
        </div>
        {isLoading ? <LoadingRows /> : visibleUsers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome / E-mail</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Matrizes</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => (
                  <tr className="bg-white" key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-ink">{user.nome}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {user.perfil === 'administrador' ? 'Administrador' : 'Usuário geral'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {user.pode_gerenciar_matrizes ? 'Autorizado' : 'Não autorizado'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={user.ativo ? 'font-semibold text-green-700' : 'font-semibold text-slate-500'}>
                        {user.ativo ? 'Ativa' : 'Desativada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <IconButton
                        aria-label={`Editar ${user.nome}`}
                        onClick={() => openEditForm(user)}
                        title="Editar conta"
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        aria-label={`${user.ativo ? 'Desativar' : 'Reativar'} ${user.nome}`}
                        className="ml-1"
                        disabled={user.id === session.id || isSaving}
                        onClick={() => setPendingStatusUser(user)}
                        title={user.id === session.id ? 'Não é possível desativar sua própria conta' : user.ativo ? 'Desativar conta' : 'Reativar conta'}
                        tone={user.ativo ? 'danger' : 'neutral'}
                      >
                        {user.ativo ? <UserRoundX aria-hidden className="h-4 w-4" /> : <Check aria-hidden className="h-4 w-4" />}
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description={search ? 'Ajuste a busca e tente novamente.' : 'Cadastre contas e defina os acessos necessários.'}
            icon={<Search aria-hidden className="h-5 w-5" />}
            title={search ? 'Nenhum usuário encontrado.' : 'Nenhuma conta cadastrada.'}
          />
        )}
      </Surface>

      <ConfirmDialog
        confirmLabel={pendingStatusUser?.ativo ? 'Desativar conta' : 'Reativar conta'}
        description={pendingStatusUser?.ativo
          ? `A conta de ${pendingStatusUser.nome} perderá acesso ao sistema. Os dados serão preservados.`
          : `A conta de ${pendingStatusUser?.nome} poderá voltar a acessar o sistema.`}
        isLoading={isSaving}
        isOpen={Boolean(pendingStatusUser)}
        onCancel={() => setPendingStatusUser(null)}
        onConfirm={toggleActive}
        title={pendingStatusUser?.ativo ? 'Desativar conta?' : 'Reativar conta?'}
        tone={pendingStatusUser?.ativo ? 'danger' : 'info'}
      />
    </AppShell>
  );
}