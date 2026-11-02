import { apiRequest } from './api';
import type { Usuario } from './auth';

export type AdminUserPayload = Pick<
  Usuario,
  'nome' | 'email' | 'perfil' | 'pode_gerenciar_matrizes'
>;

export type CreateAdminUserPayload = AdminUserPayload & {
  senha_hash: string;
};

export type UpdateAdminUserPayload = Partial<AdminUserPayload> & {
  ativo?: boolean;
};

export function listUsers() {
  return apiRequest<Usuario[]>('/api/usuarios/');
}

export function createUser(payload: CreateAdminUserPayload) {
  return apiRequest<Usuario>('/api/usuarios/', {
    method: 'POST',
    body: payload,
  });
}

export function updateUser(id: number, payload: UpdateAdminUserPayload) {
  return apiRequest<Usuario>(`/api/usuarios/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}