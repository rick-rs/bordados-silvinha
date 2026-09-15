import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/buttons';
import { PageHeader } from '../../components/ui/headers';
import { Surface } from '../../components/ui/surfaces';
import { getSession } from '../../services/auth';
import { defaultPreferences, type AccessibilityPreferences } from '../../services/accessibility';
import { useAccessibility } from './AccessibilityContext';

const toggles = [
  ['high_contrast', 'Alto contraste', 'Use cores com contraste reforçado em toda a aplicação.'],
  ['reduced_motion', 'Reduzir animações e movimentos', 'A preferência do sistema operacional também é respeitada.'],
  ['highlight_links', 'Destacar links e elementos interativos', 'Adicione sublinhados e contornos para identificar ações.'],
  ['readable_font', 'Fonte com maior legibilidade', 'Use Arial, uma fonte familiar com formas simples.'],
  ['increased_spacing', 'Aumentar espaçamento', 'Amplie o espaço entre letras, palavras, linhas e elementos.'],
] as const;

export function AccessibilityPage() {
  const { preferences, busy, loading, error, update, reload } = useAccessibility();
  const [previewMessage, setPreviewMessage] = useState('');
  if (!getSession()) return <Navigate replace to="/login" />;
  return <AppShell activePage="Perfil">
    <PageHeader breadcrumb="Perfil e configurações" title="Acessibilidade" />
    <Link className="mb-5 inline-block underline text-primary-dark" to="/perfil">Voltar ao perfil</Link>
    <p className="mb-5">Personalize a interface. As alterações são aplicadas imediatamente e salvas na sua conta.</p>
    <p className="mb-4" role="status">{busy ? 'Salvando preferências…' : error ? '' : 'Preferências sincronizadas com sua conta.'}</p>
    {error && <div className="mb-5"><p role="alert">{error}</p><Button className="mt-3" onClick={reload}>Recarregar preferências</Button></div>}
    <section className="grid items-start gap-5 lg:grid-cols-2">
      <Surface as="section" className="p-5">
        <h2 className="mb-4 text-xl font-bold" id="preferences-title">Preferências de interface</h2>
        <fieldset aria-labelledby="preferences-title" className="grid gap-5" disabled={busy || loading || Boolean(error)}>
          <div className="grid gap-2"><label className="font-bold" htmlFor="text-size">Tamanho do texto</label>
            <select className="min-h-11 rounded-lg border border-slate-500 bg-white px-3" id="text-size" value={preferences.text_size} onChange={event => void update({ ...preferences, text_size: event.target.value as AccessibilityPreferences['text_size'] })}>
              <option value="standard">Padrão</option><option value="large">Grande</option><option value="extra_large">Extra grande</option>
            </select>
          </div>
          {toggles.map(([key, label, description]) => <div key={key}>
            <label className="flex min-h-11 items-center gap-3 font-bold" htmlFor={key}>
              <input className="h-5 w-5 shrink-0 accent-primary-dark" id={key} type="checkbox" checked={preferences[key]} aria-describedby={`${key}-description`} onChange={event => void update({ ...preferences, [key]: event.target.checked })} />{label}
            </label><p className="mt-1 text-sm text-slate-700" id={`${key}-description`}>{description}</p>
          </div>)}
          <Button tone="outline" onClick={() => void update(defaultPreferences, true)}>Restaurar configurações padrão</Button>
        </fieldset>
      </Surface>
      <Surface as="section" className="p-5" aria-labelledby="preview-title">
        <h2 className="mb-5 text-xl font-bold" id="preview-title">Pré-visualização</h2>
        <h3 className="mb-3 text-lg font-bold">Título de exemplo</h3>
        <p className="mb-5">Este é um texto de exemplo para visualizar suas configurações de acessibilidade.</p>
        <a className="mb-5 inline-block text-primary-dark underline" href="#preview-action">Link de exemplo</a>
        <div><Button id="preview-action" onClick={() => setPreviewMessage('Botão de exemplo acionado com sucesso.')}>Botão de exemplo</Button></div>
        <p className="mt-4" role="status">{previewMessage}</p>
      </Surface>
    </section>
  </AppShell>;
}
