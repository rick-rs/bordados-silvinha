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
