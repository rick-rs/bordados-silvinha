import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { getSession } from '../../services/auth';
import {
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

export function StockEditPage() {
  const user = getSession();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<MaterialPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [id]);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  function updateField(field: keyof MaterialPayload, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const materialId = Number(id);

    if (!materialId) {
      setError('Material inválido.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const material = await updateMaterial(materialId, form);
      navigate(`/estoque/${material.id}`, { replace: true });
    } catch {
      setError('Não foi possível salvar o material.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell activePage="Estoque">
      <header className="mb-5 sm:mb-6">
        <p className="text-xs font-semibold text-mauve">
          Dashboard / Estoque / Editar Material
        </p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Editar Material
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

            <div className="grid gap-5 sm:grid-cols-3">
              <label className="grid gap-2" htmlFor="unidade_medida">
                <span className="text-sm font-bold text-mauve">Unidade</span>
                <select
                  className="min-h-12 rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15"
                  id="unidade_medida"
                  onChange={(event) => updateField('unidade_medida', event.target.value)}
                  value={form.unidade_medida}
                >
                  <option value="unidade">Unidade</option>
                  <option value="cone">Cone</option>
                  <option value="metro">Metro</option>
                  <option value="kg">Kg</option>
                  <option value="rolo">Rolo</option>
                  <option value="pecas">Peças</option>
                </select>
              </label>
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
                onClick={() => navigate(`/estoque/${id}`)}
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
