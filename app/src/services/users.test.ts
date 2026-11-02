import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUser, listUsers, updateUser } from './users';

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => data,
  };
}

describe('admin user service', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'bordados-app:token' ? 'test-token' : null),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists users using the existing authenticated API client', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(listUsers()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/usuarios\/$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('sends an initial password only when creating an account', async () => {
    const user = {
      id: 8,
      nome: 'Aprovador',
      email: 'aprovador@example.test',
      ativo: true,
      perfil: 'geral',
      pode_gerenciar_matrizes: true,
    };
    fetchMock.mockResolvedValue(jsonResponse(user));

    await expect(
      createUser({
        nome: user.nome,
        email: user.email,
        perfil: 'geral',
        pode_gerenciar_matrizes: true,
        senha_hash: 'initial-secret',
      }),
    ).resolves.toEqual(user);

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      nome: user.nome,
      email: user.email,
      perfil: 'geral',
      pode_gerenciar_matrizes: true,
      senha_hash: 'initial-secret',
    });
    expect(JSON.stringify(user)).not.toContain('senha_hash');
  });

  it('updates account status without sending credential fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 8, ativo: false, nome: 'Aprovador' }),
    );

    await updateUser(8, { ativo: false });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/usuarios\/8\/$/);
    expect(JSON.parse(options.body)).toEqual({ ativo: false });
    expect(options.body).not.toContain('senha');
  });
});