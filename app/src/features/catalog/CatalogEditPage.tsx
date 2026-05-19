import { FormEvent, useEffect, useState } from 'react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { AlertMessage, LoadingRows } from '../../components/ui/Feedback';
import { SelectField, TextAreaField } from '../../components/ui/FormFields';
import { PageHeader } from '../../components/ui/PageHeader';
import { Surface } from '../../components/ui/Surface';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import {
  createProduct,
  getProduct,
  ProductPayload,
  updateProduct,
} from '../../services/orders';

const initialForm: ProductPayload = {
  nome: '',
  descricao: '',
  imagem_url: '',
  preco_base: '',
  tempo_estimado: '',
  categoria: '',
  subcategoria: '',
  tipo: 'bordado',
  ativo: true,
};

type CatalogFormPageProps = {
  mode: 'create' | 'edit';
};

export function CatalogNewPage() {
  return <CatalogFormPage mode="create" />;
}

export function CatalogEditPage() {
  return <CatalogFormPage mode="edit" />;
}

function CatalogFormPage({ mode }: CatalogFormPageProps) {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<ProductPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      return undefined;
    }

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
            tempo_estimado: product.tempo_estimado ?? '',
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
  }, [id, mode]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateField(field: keyof ProductPayload, value: string | boolean) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    const productId = Number(id);

    if (mode === 'edit' && !productId) {
      setError('Item inválido.');
      setShowConfirm(false);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const product =
        mode === 'create'
          ? await createProduct(form)
          : await updateProduct(productId, form);
      navigate(`/catalogo/${product.id}`, { replace: true });
    } catch {
      setError(
        mode === 'create'
          ? 'Não foi possível cadastrar o item do catálogo.'
          : 'Não foi possível salvar o item do catálogo.',
      );
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
      if (!error && mode === 'edit') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  }

  return (
    <AppShell activePage="Catálogo">
      <PageHeader
        breadcrumb={`Dashboard / Catálogo / ${
          mode === 'create' ? 'Novo Item' : 'Editar Item'
        }`}
        title={mode === 'create' ? 'Novo Item' : 'Editar Item'}
      />

      <Surface className="mx-auto max-w-3xl">
        {isLoading ? (
          <LoadingRows count={4} rowClassName="h-14" />
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
              <SelectField
                label="Tipo"
                name="tipo"
                onChange={(event) => updateField('tipo', event.target.value)}
                value={form.tipo}
              >
                <option value="peca">Peça</option>
                <option value="bordado">Bordado</option>
              </SelectField>
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
              <TextField
                label="Tempo estimado (h)"
                min="0"
                name="tempo_estimado"
                onChange={(event) => updateField('tempo_estimado', event.target.value)}
                step="0.25"
                type="number"
                value={form.tempo_estimado}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <label className="flex items-center gap-3 pt-8 text-sm font-bold text-graphite">
                <input
                  checked={form.ativo}
                  className="h-4 w-4 accent-primary"
                  onChange={(event) => updateField('ativo', event.target.checked)}
                  type="checkbox"
                />
                Ativo
              </label>
            </div>

            <TextAreaField
              label="Descrição"
              name="descricao"
              onChange={(event) => updateField('descricao', event.target.value)}
              value={form.descricao}
            />

            <AlertMessage className="mb-0">{error}</AlertMessage>
            {showSuccess && (
              <AlertMessage className="mb-0 bg-green-100 border-green-400 text-green-700">
                Produto salvo com sucesso!
              </AlertMessage>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                tone="outline"
                onClick={() => navigate(mode === 'create' ? '/catalogo' : `/catalogo/${id}`)}
              >
                Cancelar
              </Button>
              <Button
                className="min-h-11 px-5 text-sm"
                isLoading={isSaving}
                loadingLabel="Salvando..."
                type="submit"
              >
                {mode === 'create' ? 'Cadastrar Item' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
        <ConfirmDialog
          isOpen={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmSave}
          isLoading={isSaving}
          title="Confirmar alteração"
          description="Você tem certeza que deseja salvar as alterações? Esta ação não pode ser desfeita."
          tone="warning"
          confirmLabel="Salvar"
          cancelLabel="Cancelar"
        />
      </Surface>
    </AppShell>
  );
}
