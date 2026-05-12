import { apiRequest } from './api';
import {
  buildQuery,
  PaginatedResponse,
  PaginationParams,
  unwrapResults,
} from './pagination';

export type Client = {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  rede_social: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
};

export type ClientPayload = {
  nome: string;
  telefone: string;
  email: string;
  rede_social: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export type ClientPatchPayload = Partial<ClientPayload>;

export type ListClientsParams = PaginationParams & {
  q?: string;
  estado?: string;
};

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export function listClients() {
  return apiRequest<Client[] | PaginatedResponse<Client>>(
    `/api/clientes/${buildQuery({ page_size: 100 })}`,
  ).then(unwrapResults);
}

export function listClientsPage(params: ListClientsParams) {
  return apiRequest<PaginatedResponse<Client>>(
    `/api/clientes/${buildQuery({
      q: params.q,
      estado: params.estado,
      page: params.page,
      page_size: params.pageSize,
    })}`,
  );
}

export function getClient(id: number) {
  return apiRequest<Client>(`/api/clientes/${id}/`);
}

export function createClient(payload: ClientPayload) {
  return apiRequest<Client>('/api/clientes/', {
    method: 'POST',
    body: payload,
  });
}

export function updateClient(id: number, payload: ClientPatchPayload) {
  return apiRequest<Client>(`/api/clientes/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteClient(id: number) {
  return apiRequest<void>(`/api/clientes/${id}/`, {
    method: 'DELETE',
  });
}

export async function searchCep(cep: string) {
  const normalizedCep = cep.replace(/\D/g, '');

  if (normalizedCep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`);
  const data = (await response.json()) as ViaCepResponse;

  if (!response.ok || data.erro) {
    return null;
  }

  return {
    cep: data.cep ?? '',
    endereco: data.logradouro ?? '',
    complemento: data.complemento ?? '',
    bairro: data.bairro ?? '',
    cidade: data.localidade ?? '',
    estado: data.uf ?? '',
  };
}
