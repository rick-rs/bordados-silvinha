import { apiRequest } from './api';

export type Material = {
  id: number;
  nome: string;
  descricao: string | null;
  unidade_medida: string;
  quantidade_atual: string;
  estoque_minimo: string;
};

export function listMaterials() {
  return apiRequest<Material[]>('/api/materiais/');
}

export function getMaterial(id: number) {
  return apiRequest<Material>(`/api/materiais/${id}/`);
}

export function deleteMaterial(id: number) {
  return apiRequest<void>(`/api/materiais/${id}/`, {
    method: 'DELETE',
  });
}
