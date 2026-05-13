import { apiRequest } from './api';

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
};

export type LoginCredentials = {
  email: string;
  senha: string;
};

export type LoginResponse = {
  usuario: Usuario;
};

const sessionKey = 'bordados-app:user';

export function login(credentials: LoginCredentials) {
  return apiRequest<LoginResponse>('/api/usuarios/login/', {
    method: 'POST',
    body: credentials,
  });
}

export function updateUserProfile(
  id: number,
  payload: Pick<Usuario, 'nome' | 'email'>,
) {
  return apiRequest<Usuario>(`/api/usuarios/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function changePassword(
  id: number,
  payload: { senha_atual: string; nova_senha: string },
) {
  return apiRequest<{ detail: string }>(`/api/usuarios/${id}/trocar-senha/`, {
    method: 'POST',
    body: payload,
  });
}

export function saveSession(usuario: Usuario) {
  localStorage.setItem(sessionKey, JSON.stringify(usuario));
}

export function getSession() {
  const storedSession = localStorage.getItem(sessionKey);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as Usuario;
  } catch {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(sessionKey);
}
