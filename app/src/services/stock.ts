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

export type MaterialPayload = {
  nome: string;
  descricao: string;
  unidade_medida: string;
  quantidade_atual: string;
  estoque_minimo: string;
};

export type MaterialPatchPayload = Partial<MaterialPayload>;

export type StockMovement = {
  id: number;
  material: number;
  tipo: 'entrada' | 'saida';
  quantidade: string;
  observacao: string | null;
  registrado_em: string;
};

export type StockMovementPayload = {
  material: number;
  tipo: 'entrada' | 'saida';
  quantidade: string;
  observacao: string;
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

export function createMaterial(payload: MaterialPayload) {
  return apiRequest<Material>('/api/materiais/', {
    method: 'POST',
    body: payload,
  });
}

export function updateMaterial(id: number, payload: MaterialPatchPayload) {
  return apiRequest<Material>(`/api/materiais/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
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

export function listStockMovements(materialId?: number) {
  return apiRequest<StockMovement[] | PaginatedResponse<StockMovement>>(
    `/api/movimentacoes-estoque/${buildQuery({
      material: materialId,
      page_size: 100,
    })}`,
  ).then(unwrapResults);
}

export function createStockMovement(payload: StockMovementPayload) {
  return apiRequest<StockMovement>('/api/movimentacoes-estoque/', {
    method: 'POST',
    body: payload,
  });
}
