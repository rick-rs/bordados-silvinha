import { apiRequest } from './api';

export type AccessibilityPreferences = {
  text_size: 'standard' | 'large' | 'extra_large';
  high_contrast: boolean;
  reduced_motion: boolean;
  highlight_links: boolean;
  readable_font: boolean;
  increased_spacing: boolean;
};
export const defaultPreferences: AccessibilityPreferences = {
  text_size: 'standard', high_contrast: false, reduced_motion: false,
  highlight_links: false, readable_font: false, increased_spacing: false,
};
export function loadPreferences() {
  return apiRequest<AccessibilityPreferences>('/api/accessibility-profile/');
}
export function persistPreferences(preferences: AccessibilityPreferences) {
  return apiRequest<AccessibilityPreferences>('/api/accessibility-profile/', { method: 'PATCH', body: preferences });
}
export function resetPreferences() {
  return apiRequest<AccessibilityPreferences>('/api/accessibility-profile/', { method: 'POST' });
}
export function cachePreferences(id: number, preferences: AccessibilityPreferences) {
  try { localStorage.setItem(`bordados-app:accessibility:${id}`, JSON.stringify(preferences)); } catch { /* Backend remains the source of truth. */ }
}
export function cachedPreferences(id?: number): AccessibilityPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(`bordados-app:accessibility:${id}`) ?? 'null');
    if (!value || !['standard', 'large', 'extra_large'].includes(value.text_size)) return defaultPreferences;
    if (Object.keys(defaultPreferences).some(key => key !== 'text_size' && typeof value[key] !== 'boolean')) return defaultPreferences;
    return value;
  } catch { return defaultPreferences; }
}
export function applyPreferences(preferences: AccessibilityPreferences) {
  for (const [key, value] of Object.entries(preferences)) {
    document.documentElement.setAttribute(`data-a11y-${key.replace(/_/g, '-')}`, String(value));
  }
}
