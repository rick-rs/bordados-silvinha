import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getSession, saveSession } from '../../services/auth';

type ProfileForm = {
  nome: string;
  email: string;
};

type PasswordForm = {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
};

const initialPasswordForm: PasswordForm = {
  senhaAtual: '',
  novaSenha: '',
  confirmarSenha: '',
};

export function ProfilePage() {
  const user = getSession();
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    nome: user?.nome ?? '',
    email: user?.email ?? '',
  });
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  const currentUser = user;

  function updateProfileField(field: keyof ProfileForm, value: string) {
    setProfileForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function updatePasswordField(field: keyof PasswordForm, value: string) {
    setPasswordForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSession({
      ...currentUser,
      nome: profileForm.nome,
      email: profileForm.email,
    });
    setProfileMessage('Dados da conta atualizados para visualização local.');
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      setPasswordError('A confirmação precisa ser igual à nova senha.');
      return;
    }

    setPasswordForm(initialPasswordForm);
    setPasswordMessage('Senha pronta para ser atualizada quando ligarmos ao backend.');
  }

  return (
    <AppShell activePage="Perfil">
      <header className="mb-6">
        <p className="text-xs font-semibold text-mauve">Conta e configurações</p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Perfil</h1>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-ink">Dados da Conta</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Edite as informações usadas para identificar seu acesso.
            </p>
          </div>

          <form className="grid gap-5 p-5" onSubmit={handleProfileSubmit}>
            <TextField
              autoComplete="name"
              label="Nome"
              name="nome"
              onChange={(event) => updateProfileField('nome', event.target.value)}
              placeholder="Seu nome"
              required
              value={profileForm.nome}
            />

            <TextField
              autoComplete="email"
              label="E-mail"
              name="email"
              onChange={(event) => updateProfileField('email', event.target.value)}
              placeholder="seu@email.com"
              required
              type="email"
              value={profileForm.email}
            />

            {profileMessage ? (
              <p className="rounded-lg border border-wewak/50 bg-illusion/30 px-4 py-3 text-sm leading-relaxed text-mauve">
                {profileMessage}
              </p>
            ) : null}

            <Button className="min-h-11 w-full px-5 text-sm sm:w-auto sm:justify-self-start" type="submit">
              Salvar alterações
            </Button>
          </form>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-ink">Trocar Senha</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Defina uma nova senha para acessar sua conta.
            </p>
          </div>

          <form className="grid gap-5 p-5" onSubmit={handlePasswordSubmit}>
            <TextField
              autoComplete="current-password"
              label="Senha atual"
              name="senhaAtual"
              onChange={(event) =>
                updatePasswordField('senhaAtual', event.target.value)
              }
              placeholder="Digite sua senha atual"
              required
              type="password"
              value={passwordForm.senhaAtual}
            />

            <TextField
              autoComplete="new-password"
              label="Nova senha"
              name="novaSenha"
              onChange={(event) => updatePasswordField('novaSenha', event.target.value)}
              placeholder="Digite a nova senha"
              required
              type="password"
              value={passwordForm.novaSenha}
            />

            <TextField
              autoComplete="new-password"
              error={passwordError}
              label="Confirmar nova senha"
              name="confirmarSenha"
              onChange={(event) =>
                updatePasswordField('confirmarSenha', event.target.value)
              }
              placeholder="Repita a nova senha"
              required
              type="password"
              value={passwordForm.confirmarSenha}
            />

            {passwordMessage ? (
              <p className="rounded-lg border border-wewak/50 bg-illusion/30 px-4 py-3 text-sm leading-relaxed text-mauve">
                {passwordMessage}
              </p>
            ) : null}

            <Button className="min-h-11 w-full px-5 text-sm sm:w-auto sm:justify-self-start" type="submit">
              Atualizar senha
            </Button>
          </form>
        </article>
      </section>
    </AppShell>
  );
}
