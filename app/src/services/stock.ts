import { apiRequest } from './api';
import {
  buildQuery,
  PaginatedResponse,
  PaginationParams,
  unwrapResults,
} from './pagination';

export type Material = {
  id: number;
  nome: string;
  descricao: string | null;
  unidade_medida: string;
  quantidade_atual: string;
  estoque_minimo: string;
};

export type ListMaterialsParams = PaginationParams & {
  q?: string;
  unidade?: string;
  situacao?: string;
};

export function listMaterials() {
  return apiRequest<Material[] | PaginatedResponse<Material>>(
    `/api/materiais/${buildQuery({ page_size: 100 })}`,
  ).then(unwrapResults);
}

export function getMaterial(id: number) {
  return apiRequest<Material>(`/api/materiais/${id}/`);
}

export function listMaterialsPage(params: ListMaterialsParams) {
  return apiRequest<PaginatedResponse<Material>>(
    `/api/materiais/${buildQuery({
      q: params.q,
      unidade: params.unidade,
      situacao: params.situacao,
      page: params.page,
      page_size: params.pageSize,
    })}`,
  );
}

export function deleteMaterial(id: number) {
  return apiRequest<void>(`/api/materiais/${id}/`, {
    method: 'DELETE',
  });
}
