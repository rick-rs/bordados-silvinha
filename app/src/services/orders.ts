import { apiRequest } from './api';

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
  observacoes: string;
  valor_total: string;
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
  preco_base: string;
  categoria: string | null;
  subcategoria: string | null;
  tipo: string;
  ativo: boolean;
};

export function listOrders() {
  return apiRequest<Order[]>('/api/pedidos/');
}

export function createOrder(payload: OrderPayload) {
  return apiRequest<Order>('/api/pedidos/', {
    method: 'POST',
    body: payload,
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
  return apiRequest<Product[]>('/api/produtos/');
}
