import { AccessibilityContext } from './AccessibilityContext';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getSession } from '../../services/auth';
import { applyPreferences, cachePreferences, cachedPreferences, defaultPreferences, loadPreferences, persistPreferences, resetPreferences, type AccessibilityPreferences } from '../../services/accessibility';


export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(() => getSession()?.id);
  const [preferences, setPreferences] = useState(() => cachedPreferences(userId));
  const [loading, setLoading] = useState(Boolean(userId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const saving = useRef(false);

  useEffect(() => {
    const listener = () => setUserId(getSession()?.id);
    window.addEventListener('session-changed', listener);
    return () => window.removeEventListener('session-changed', listener);
  }, []);

  useEffect(() => {
    const current = ++generation.current;
    saving.current = false;
    setBusy(false);
    setError('');
    const cached = userId ? cachedPreferences(userId) : defaultPreferences;
    setPreferences(cached);
    applyPreferences(cached);
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    loadPreferences().then(value => {
      if (generation.current !== current) return;
      setPreferences(value); applyPreferences(value); cachePreferences(userId, value);
    }).catch(() => {
      if (generation.current === current) setError('Não foi possível carregar as preferências. Tente novamente antes de editar.');
    }).finally(() => { if (generation.current === current) setLoading(false); });
    return () => { generation.current = current + 1; };
  }, [userId, revision]);

  async function update(next: AccessibilityPreferences, reset = false) {
    if (!userId || loading || saving.current || error) return;
    const current = generation.current;
    const previous = preferences;
    saving.current = true;
    setBusy(true);
    setPreferences(next); applyPreferences(next);
    try {
      const saved = await (reset ? resetPreferences() : persistPreferences(next));
      if (generation.current !== current) return;
      setPreferences(saved); applyPreferences(saved); cachePreferences(userId, saved);
    } catch {
      if (generation.current !== current) return;
      setPreferences(previous); applyPreferences(previous);
      setError('Não foi possível salvar. A alteração foi desfeita. Recarregue as preferências para tentar novamente.');
    } finally {
      if (generation.current === current) { saving.current = false; setBusy(false); }
    }
  }

  return <AccessibilityContext.Provider value={{ preferences, busy, loading, error, update, reload: () => setRevision(value => value + 1) }}>
    {loading ? <main className="p-8" role="status">Carregando suas preferências de acessibilidade…</main> : children}
  </AccessibilityContext.Provider>;
}