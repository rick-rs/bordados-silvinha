import { describe, expect, it } from 'vitest';

import { itemSubtotal } from './useOrderItems';

describe('itemSubtotal', () => {
  it('parses Brazilian decimal commas as cents, not thousands', () => {
    expect(
      itemSubtotal({
        id: 'item-1',
        peca: 'Teste',
        produto: '1',
        quantidade: '3',
        valor_unitario: '30,00',
      }),
    ).toBe(90);
  });
});