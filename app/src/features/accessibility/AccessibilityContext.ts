import { createContext, useContext } from 'react';
import type { AccessibilityPreferences } from '../../services/accessibility';

export const AccessibilityContext = createContext<{
  preferences: AccessibilityPreferences; busy: boolean; loading: boolean; error: string;
  update: (preferences: AccessibilityPreferences, reset?: boolean) => Promise<void>;
  reload: () => void;
} | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('AccessibilityProvider is required');
  return context;
}
