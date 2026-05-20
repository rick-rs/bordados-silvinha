import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { AlertMessage, LoadingRows } from '../../components/ui/feedback';
import { SelectField, TextAreaField } from '../../components/ui/forms';
import { PageHeader } from '../../components/ui/headers';
import { Surface } from '../../components/ui/surfaces';
import { TextField } from '../../components/ui/forms';
import { getSession } from '../../services/auth';
import { ConfirmDialog } from '../../components/ui/dialogs';
import {
  createMaterial,
  getMaterial,
  MaterialPayload,
  updateMaterial,
} from '../../services/stock';

const initialForm: MaterialPayload = {
  nome: '',
  descricao: '',
  unidade_medida: 'unidade',
  quantidade_atual: '',
  estoque_minimo: '',
};

function StockFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<MaterialPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isEditing = mode === 'edit';

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    let isMounted = true;
    const materialId = Number(id);

    async function loadMaterial() {
      if (!materialId) {
        setError('Material inválido.');
        setIsLoading(false);
        return;
      }

      try {
        const material = await getMaterial(materialId);

        if (isMounted) {
          setForm({
            nome: material.nome,
            descricao: material.descricao ?? '',
            unidade_medida: material.unidade_medida,
            quantidade_atual: material.quantidade_atual,
            estoque_minimo: material.estoque_minimo,
          });
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar o material.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMaterial();

    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateField(field: keyof MaterialPayload, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isEditing) {
      setShowConfirm(true);
      return;
    }
    await handleConfirmSave();
  }

  async function handleConfirmSave() {
    const materialId = Number(id);
    if (isEditing && !materialId) {
      setError('Material inválido.');
      setShowConfirm(false);
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const material = isEditing
        ? await updateMaterial(materialId, form)
        : await createMaterial(form);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      navigate(`/estoque/${material.id}`, { replace: true });
    } catch {
      setError('Não foi possível salvar o material.');
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <AppShell activePage="Estoque">
      <PageHeader
        breadcrumb={`Dashboard / Estoque / ${
          isEditing ? 'Editar Material' : 'Novo Material'
        }`}
        title={isEditing ? 'Editar Material' : 'Novo Material'}
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

            <div className="grid gap-5 sm:grid-cols-3">
              <SelectField
                label="Unidade"
                name="unidade_medida"
                onChange={(event) => updateField('unidade_medida', event.target.value)}
                value={form.unidade_medida}
              >
                <option value="unidade">Unidade</option>
                <option value="cone">Cone</option>
                <option value="metro">Metro</option>
                <option value="kg">Kg</option>
                <option value="rolo">Rolo</option>
                <option value="pecas">Peças</option>
              </SelectField>
              <TextField
                label="Quantidade atual *"
                min="0"
                name="quantidade_atual"
                onChange={(event) => updateField('quantidade_atual', event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.quantidade_atual}
              />
              <TextField
                label="Estoque mínimo *"
                min="0"
                name="estoque_minimo"
                onChange={(event) => updateField('estoque_minimo', event.target.value)}
                required
                step="0.01"
                type="number"
                value={form.estoque_minimo}
              />
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
                Item de estoque salvo com sucesso!
              </AlertMessage>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={() => navigate(isEditing ? `/estoque/${id}` : '/estoque')}
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
                {isEditing ? 'Salvar Alterações' : 'Salvar Material'}
              </Button>
            </div>
          </form>
        )}
      </Surface>
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
    </AppShell>
  );
}

export function StockNewPage() {
  return <StockFormPage mode="create" />;
}

export function StockEditPage() {
  return <StockFormPage mode="edit" />;
}
