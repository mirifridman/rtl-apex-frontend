import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type Theme = 'dark' | 'light';

export function useTheme() {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first for immediate theme application
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch theme preference from database
  useEffect(() => {
    async function fetchThemePreference() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data?.theme_preference) {
          setThemeState(data.theme_preference as Theme);
        }
      } catch (err) {
        console.error('Error fetching theme preference:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchThemePreference();
  }, [user?.id]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to database if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);
      } catch (err) {
        console.error('Error saving theme preference:', err);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
}
