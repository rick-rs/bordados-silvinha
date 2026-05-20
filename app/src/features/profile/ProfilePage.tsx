import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { AlertMessage } from '../../components/ui/feedback';
import { PageHeader } from '../../components/ui/headers';
import { Surface, SurfaceHeader } from '../../components/ui/surfaces';
import { TextField } from '../../components/ui/forms';
import {
  changePassword,
  getSession,
  saveSession,
  updateUserProfile,
} from '../../services/auth';

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
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setIsSavingProfile(true);

    try {
      const updatedUser = await updateUserProfile(currentUser.id, {
        nome: profileForm.nome,
        email: profileForm.email,
      });
      saveSession(updatedUser);
      setProfileMessage('Dados da conta atualizados.');
    } catch {
      setProfileError('Não foi possível atualizar os dados da conta.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      setPasswordError('A confirmação precisa ser igual à nova senha.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await changePassword(currentUser.id, {
        senha_atual: passwordForm.senhaAtual,
        nova_senha: passwordForm.novaSenha,
      });
      setPasswordForm(initialPasswordForm);
      setPasswordMessage('Senha atualizada com sucesso.');
    } catch {
      setPasswordError('Não foi possível atualizar a senha.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <AppShell activePage="Perfil">
      <PageHeader breadcrumb="Conta e configurações" title="Perfil" />

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Surface as="article">
          <SurfaceHeader className="px-5 py-4">
            <h2 className="text-sm font-extrabold text-ink">Dados da Conta</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Edite as informações usadas para identificar seu acesso.
            </p>
          </SurfaceHeader>

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

            <AlertMessage className="mb-0 border-wewak/50 bg-illusion/30 text-mauve">
              {profileMessage}
            </AlertMessage>

            <AlertMessage className="mb-0">{profileError}</AlertMessage>

            <Button
              className="min-h-11 w-full px-5 text-sm sm:w-auto sm:justify-self-start"
              isLoading={isSavingProfile}
              loadingLabel="Salvando..."
              type="submit"
            >
              Salvar alterações
            </Button>
          </form>
        </Surface>

        <Surface as="article">
          <SurfaceHeader className="px-5 py-4">
            <h2 className="text-sm font-extrabold text-ink">Trocar Senha</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Defina uma nova senha para acessar sua conta.
            </p>
          </SurfaceHeader>

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

            <AlertMessage className="mb-0 border-wewak/50 bg-illusion/30 text-mauve">
              {passwordMessage}
            </AlertMessage>

            <Button
              className="min-h-11 w-full px-5 text-sm sm:w-auto sm:justify-self-start"
              isLoading={isSavingPassword}
              loadingLabel="Atualizando..."
              type="submit"
            >
              Atualizar senha
            </Button>
          </form>
        </Surface>
      </section>
    </AppShell>
  );
}
