import { apiRequest } from './api';
import {
  buildQuery,
  PaginatedResponse,
  PaginationParams,
  unwrapResults,
} from './pagination';

export type Order = {
  id: number;
  cliente: number;
  data_pedido: string | null;
  prazo: string | null;
  data_entrega: string | null;
  canal: string | null;
  forma_pagamento: string | null;
  status_pagamento: string | null;
  urgente: boolean;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  valor_total: string;
  status: string;
  criado_em: string;
  atualizado_em: string;
};

export type OrderPayload = {
  cliente: number;
  prazo: string;
  canal: string;
  forma_pagamento: string;
  status_pagamento: string;
  urgente?: boolean;
  observacoes: string;
  valor_total: string;
};

export type OrderPatchPayload = Partial<OrderPayload> & {
  status?: string;
};

export type OrderItem = {
  id: number;
  pedido: number;
  produto: number;
  peca: string | null;
  descricao_bordado: string | null;
  quantidade: number;
  valor_unitario: string;
  subtotal: string;
};

export type OrderItemPayload = {
  pedido: number;
  produto: number;
  peca: string;
  descricao_bordado: string;
  quantidade: number;
  valor_unitario: string;
};

export type Product = {
  id: number;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  preco_base: string;
  tempo_estimado: string | null;
  categoria: string | null;
  subcategoria: string | null;
  tipo: string;
  ativo: boolean;
};

export type ProductPayload = {
  nome: string;
  descricao: string;
  imagem_url: string;
  preco_base: string;
  tempo_estimado: string;
  categoria: string;
  subcategoria: string;
  tipo: string;
  ativo: boolean;
};

export type ProductPatchPayload = Partial<ProductPayload>;

export type ListProductsParams = PaginationParams & {
  q?: string;
  tipo?: string;
  ativo?: string;
};

export type ListOrdersParams = PaginationParams & {
  q?: string;
  status?: string;
  status_pagamento?: string;
  canal?: string;
  prazo_inicio?: string;
  prazo_fim?: string;
};

export function listOrders() {
  return apiRequest<Order[] | PaginatedResponse<Order>>(
    `/api/pedidos/${buildQuery({ page_size: 100 })}`,
  ).then(unwrapResults);
}

export function listOrdersPage(params: ListOrdersParams) {
  return apiRequest<PaginatedResponse<Order>>(
    `/api/pedidos/${buildQuery({
      q: params.q,
      status: params.status,
      status_pagamento: params.status_pagamento,
      canal: params.canal,
      prazo_inicio: params.prazo_inicio,
      prazo_fim: params.prazo_fim,
      page: params.page,
      page_size: params.pageSize,
    })}`,
  );
}

export function getOrder(id: number) {
  return apiRequest<Order>(`/api/pedidos/${id}/`);
}

export function createOrder(payload: OrderPayload) {
  return apiRequest<Order>('/api/pedidos/', {
    method: 'POST',
    body: payload,
  });
}

export function updateOrder(id: number, payload: OrderPatchPayload) {
  return apiRequest<Order>(`/api/pedidos/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteOrder(id: number) {
  return apiRequest<void>(`/api/pedidos/${id}/`, {
    method: 'DELETE',
  });
}

export function listOrderItems() {
  return apiRequest<OrderItem[]>('/api/itens-pedido/');
}

export function createOrderItem(payload: OrderItemPayload) {
  return apiRequest<OrderItem>('/api/itens-pedido/', {
    method: 'POST',
    body: payload,
  });
}

export function listProducts() {
  return apiRequest<Product[] | PaginatedResponse<Product>>(
    `/api/produtos/${buildQuery({ page_size: 100 })}`,
  ).then(unwrapResults);
}

export function getProduct(id: number) {
  return apiRequest<Product>(`/api/produtos/${id}/`);
}

export function createProduct(payload: ProductPayload) {
  return apiRequest<Product>('/api/produtos/', {
    method: 'POST',
    body: payload,
  });
}

export function listProductsPage(params: ListProductsParams) {
  return apiRequest<PaginatedResponse<Product>>(
    `/api/produtos/${buildQuery({
      q: params.q,
      tipo: params.tipo,
      ativo: params.ativo,
      page: params.page,
      page_size: params.pageSize,
    })}`,
  );
}

export function updateProduct(id: number, payload: ProductPatchPayload) {
  return apiRequest<Product>(`/api/produtos/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteProduct(id: number) {
  return apiRequest<void>(`/api/produtos/${id}/`, {
    method: 'DELETE',
  });
}
