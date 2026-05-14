import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { AlertMessage } from '../../components/ui/Feedback';
import { TextField } from '../../components/ui/TextField';
import { ApiError } from '../../services/api';
import { getSession, login, saveSession } from '../../services/auth';
import { appBrand } from '../../theme/brand';

type LoginForm = {
  email: string;
  senha: string;
};

const initialForm: LoginForm = {
  email: '',
  senha: '',
};

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = getSession();

  function updateField(field: keyof LoginForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await login(form);
      saveSession(response.usuario);
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      const message =
        loginError instanceof ApiError
          ? loginError.message
          : 'Nao foi possivel entrar. Tente novamente.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (currentUser) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-chantilly/60 via-white to-illusion/40 px-4 py-8">
      <section
        className="w-full max-w-[420px] rounded-lg border border-frenchRose/20 bg-white/90 p-6 shadow-softPink sm:p-8"
        aria-labelledby="login-title"
      >
        <div className="mb-7">
          <p className="mb-2 text-sm font-bold uppercase tracking-normal text-frenchRose">
            {appBrand.name}
          </p>
          <h1 className="text-3xl font-bold leading-tight text-ink" id="login-title">
            Entrar
          </h1>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <TextField
            autoComplete="email"
            label="E-mail"
            name="email"
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="seu@email.com"
            required
            type="email"
            value={form.email}
          />

          <TextField
            autoComplete="current-password"
            label="Senha"
            name="senha"
            onChange={(event) => updateField('senha', event.target.value)}
            placeholder="Digite sua senha"
            required
            type="password"
            value={form.senha}
          />

          <AlertMessage className="mb-0" role="alert">
            {error}
          </AlertMessage>

          <Button className="mt-1" isLoading={isSubmitting} type="submit">
            Logar
          </Button>
        </form>
      </section>
    </main>
  );
}
