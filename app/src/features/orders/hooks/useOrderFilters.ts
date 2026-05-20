import { useEffect, useMemo, useState } from 'react';
import { Client, listClients } from '../../../services/clients';
import {
  listOrderItems,
  listOrdersPage,
  listProducts,
  Order,
  OrderItem,
  Product,
} from '../../../services/orders';

export type OrdersFilterState = {
  statusFilter: string;
  paymentFilter: string;
  channelFilter: string;
  dateFromFilter: string;
  dateToFilter: string;
  search: string;
  page: number;
  pageSize: number;
  refresh: number; // trigger para refetch após updates (status/cancel/delete)
};

export type OrdersFilterData = {
  orders: Order[];
  clients: Client[];
  items: OrderItem[];
  products: Product[];
  count: number;
  isLoading: boolean;
  error: string;
};

export function useOrderFilters(filters: OrdersFilterState) {
  const [data, setData] = useState<OrdersFilterData>({
    orders: [],
    clients: [],
    items: [],
    products: [],
    count: 0,
    isLoading: true,
    error: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        const [ordersResponse, clientsResponse, itemsResponse, productsResponse] =
          await Promise.all([
            listOrdersPage({
              canal: filters.channelFilter,
              page: filters.page,
              pageSize: filters.pageSize,
              prazo_fim: filters.dateToFilter,
              prazo_inicio: filters.dateFromFilter,
              q: filters.search,
              status: filters.statusFilter,
              status_pagamento: filters.paymentFilter,
            }),
            listClients(),
            listOrderItems(),
            listProducts(),
          ]);

        if (isMounted) {
          setData({
            orders: ordersResponse.results,
            clients: clientsResponse,
            items: itemsResponse,
            products: productsResponse,
            count: ordersResponse.count,
            isLoading: false,
            error: '',
          });
        }
      } catch {
        if (isMounted) {
          setData((currentData) => ({
            ...currentData,
            isLoading: false,
            error: 'Não foi possível carregar os pedidos.',
          }));
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [
    filters.channelFilter,
    filters.dateFromFilter,
    filters.dateToFilter,
    filters.page,
    filters.pageSize,
    filters.paymentFilter,
    filters.refresh,
    filters.search,
    filters.statusFilter,
  ]);

  const clientsById = useMemo(
    () => new Map(data.clients.map((client) => [client.id, client])),
    [data.clients],
  );

  const productsById = useMemo(
    () => new Map(data.products.map((product) => [product.id, product])),
    [data.products],
  );

  const itemsByOrder = useMemo(() => {
    const groupedItems = new Map<number, OrderItem[]>();

    data.items.forEach((item) => {
      groupedItems.set(item.pedido, [...(groupedItems.get(item.pedido) ?? []), item]);
    });

    return groupedItems;
  }, [data.items]);

  return {
    ...data,
    clientsById,
    productsById,
    itemsByOrder,
  };
}
