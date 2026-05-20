import { useCallback, useState } from 'react';

export type OrderItemForm = {
  id: string;
  peca: string;
  produto: string;
  quantidade: string;
  valor_unitario: string;
};

function createEmptyItem(): OrderItemForm {
  return {
    id: String(Date.now() + Math.random()),
    peca: '',
    produto: '',
    quantidade: '1',
    valor_unitario: '',
  };
}

function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
}

function toDecimalString(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function itemSubtotal(item: OrderItemForm): number {
  const quantity = Number.parseInt(item.quantidade, 10);
  return (Number.isNaN(quantity) ? 0 : quantity) * parseMoney(item.valor_unitario);
}

export function useOrderItems(initialItems?: OrderItemForm[]) {
  const [items, setItems] = useState<OrderItemForm[]>(initialItems || [createEmptyItem()]);

  const updateItem = useCallback((id: string, field: keyof OrderItemForm, value: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }, []);

  const updateCatalogItem = useCallback(
    (id: string, productId: string, productName: string, productPrice: string) => {
      const suggestedUnitValue = parseMoney(productPrice);

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id
            ? {
                ...item,
                produto: productId,
                peca: productName,
                valor_unitario: suggestedUnitValue > 0 ? toDecimalString(suggestedUnitValue) : '',
              }
            : item,
        ),
      );
    },
    [],
  );

  const addItem = useCallback(() => {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) =>
      currentItems.length === 1 ? currentItems : currentItems.filter((item) => item.id !== id),
    );
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((currentTotal, item) => currentTotal + itemSubtotal(item), 0);
  }, [items]);

  const validateItems = useCallback(() => {
    return !items.some((item) => {
      const quantity = Number.parseInt(item.quantidade, 10);
      return (
        !item.produto ||
        Number.isNaN(quantity) ||
        quantity <= 0 ||
        parseMoney(item.valor_unitario) <= 0
      );
    });
  }, [items]);

  return {
    items,
    setItems,
    updateItem,
    updateCatalogItem,
    addItem,
    removeItem,
    getTotal,
    validateItems,
  };
}
