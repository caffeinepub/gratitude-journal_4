import { useEffect, useState } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerUserProfile, useSetThemePreference } from './useQueries';
import { Theme } from '../backend';

type ThemeState = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

export function useTheme() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const setThemePreferenceMutation = useSetThemePreference();

  const [themeState, setThemeState] = useState<ThemeState>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Convert backend Theme enum to ThemeState
  const backendThemeToState = (theme: Theme): ThemeState => {
    switch (theme) {
      case Theme.light:
        return 'light';
      case Theme.dark:
        return 'dark';
      case Theme.systemPreferred:
      default:
        return 'system';
    }
  };

  // Convert ThemeState to backend Theme enum
  const stateToBackendTheme = (state: ThemeState): Theme => {
    switch (state) {
      case 'light':
        return Theme.light;
      case 'dark':
        return Theme.dark;
      case 'system':
      default:
        return Theme.systemPreferred;
    }
  };

  // Detect system theme preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Load user's saved theme preference when authenticated
  useEffect(() => {
    if (identity && userProfile && !profileLoading) {
      const savedTheme = backendThemeToState(userProfile.themePreference);
      setThemeState(savedTheme);
    } else if (!identity) {
      // Reset to system when logged out
      setThemeState('system');
    }
  }, [identity, userProfile, profileLoading]);

  // Apply theme to document and listen for system changes
  useEffect(() => {
    const applyTheme = (theme: ResolvedTheme) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      setResolvedTheme(theme);
    };

    if (themeState === 'system') {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(themeState as ResolvedTheme);
    }
  }, [themeState]);

  // Toggle theme: system → light → dark → system
  const toggleTheme = async () => {
    const nextTheme: ThemeState = 
      themeState === 'system' ? 'light' :
      themeState === 'light' ? 'dark' : 'system';

    setThemeState(nextTheme);

    // Save to backend if authenticated
    if (identity) {
      try {
        await setThemePreferenceMutation.mutateAsync(stateToBackendTheme(nextTheme));
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  return {
    theme: themeState,
    resolvedTheme,
    toggleTheme,
    isLoading: profileLoading,
  };
}
