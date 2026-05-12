import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import {
  getProduct,
  ProductPayload,
  updateProduct,
} from '../../services/orders';

const initialForm: ProductPayload = {
  nome: '',
  descricao: '',
  imagem_url: '',
  preco_base: '',
  categoria: '',
  subcategoria: '',
  tipo: 'bordado',
  ativo: true,
};

export function CatalogEditPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<ProductPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const productId = Number(id);

    async function loadProduct() {
      if (!productId) {
        setError('Item inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const product = await getProduct(productId);

        if (isMounted) {
          setForm({
            nome: product.nome,
            descricao: product.descricao ?? '',
            imagem_url: product.imagem_url ?? '',
            preco_base: product.preco_base,
            categoria: product.categoria ?? '',
            subcategoria: product.subcategoria ?? '',
            tipo: product.tipo,
            ativo: product.ativo,
          });
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o item.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateField(field: keyof ProductPayload, value: string | boolean) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const productId = Number(id);

    if (!productId) {
      setError('Item inválido.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const product = await updateProduct(productId, form);
      navigate(`/catalogo/${product.id}`, { replace: true });
    } catch {
      setError('Não foi possível salvar o item do catálogo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell activePage="Catálogo">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">
          Dashboard / Catálogo / Editar Item
        </p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Editar Item
        </h1>
      </header>

      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="grid gap-3 p-5 sm:p-6">
            {[0, 1, 2, 3].map((item) => (
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" key={item} />
            ))}
          </div>
        ) : (
          <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit}>
            <TextField
              label="Nome *"
              name="nome"
              onChange={(event) => updateField('nome', event.target.value)}
              required
              value={form.nome}
            />

            <TextField
              label="URL da foto"
              name="imagem_url"
              onChange={(event) => updateField('imagem_url', event.target.value)}
              placeholder="https://..."
              type="url"
              value={form.imagem_url}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Categoria"
                name="categoria"
                onChange={(event) => updateField('categoria', event.target.value)}
                value={form.categoria}
              />
              <TextField
                label="Subcategoria"
                name="subcategoria"
                onChange={(event) => updateField('subcategoria', event.target.value)}
                value={form.subcategoria}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <label className="grid gap-2" htmlFor="tipo">
                <span className="text-sm font-bold text-mauve">Tipo</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="tipo"
                  onChange={(event) => updateField('tipo', event.target.value)}
                  value={form.tipo}
                >
                  <option value="peca">Peça</option>
                  <option value="bordado">Bordado</option>
                </select>
              </label>
              <TextField
                label="Preço Base *"
                min="0"
                name="preco_base"
                onChange={(event) => updateField('preco_base', event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.preco_base}
              />
              <label className="flex items-center gap-3 pt-8 text-sm font-bold text-mauve">
                <input
                  checked={form.ativo}
                  className="h-4 w-4 accent-frenchRose"
                  onChange={(event) => updateField('ativo', event.target.checked)}
                  type="checkbox"
                />
                Ativo
              </label>
            </div>

            <label className="grid gap-2" htmlFor="descricao">
              <span className="text-sm font-bold text-mauve">Descrição</span>
              <textarea
                className="min-h-28 rounded-lg border border-frenchRose/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                id="descricao"
                onChange={(event) => updateField('descricao', event.target.value)}
                value={form.descricao}
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-frenchRose/30 bg-chantilly/40 px-4 py-3 text-sm leading-relaxed text-rose-900">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={() => navigate(`/catalogo/${id}`)}
                type="button"
              >
                Cancelar
              </button>
              <Button
                className="min-h-11 px-5 text-sm"
                isLoading={isSaving}
                loadingLabel="Salvando..."
                type="submit"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </section>
    </AppShell>
  );
}
