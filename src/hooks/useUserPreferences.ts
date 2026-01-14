import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserPreferences {
  id: string;
  user_id: string;
  stay_logged_in: boolean;
  email_notifications: boolean;
  browser_notifications: boolean;
  theme: 'dark' | 'light' | 'system';
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  stay_logged_in?: boolean;
  email_notifications?: boolean;
  browser_notifications?: boolean;
  theme?: 'dark' | 'light' | 'system';
  language?: string;
}

const defaultPreferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  stay_logged_in: false,
  email_notifications: true,
  browser_notifications: false,
  theme: 'dark',
  language: 'he',
};

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
        // Return default preferences if table doesn't exist or other error
        return {
          ...defaultPreferences,
          id: '',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserPreferences;
      }

      // If no preferences exist, return defaults
      if (!data) {
        return {
          ...defaultPreferences,
          id: '',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserPreferences;
      }

      return data as UserPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: UserPreferencesUpdate) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Try to upsert (insert or update)
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.id] });
    },
  });

  return {
    preferences: preferences || {
      ...defaultPreferences,
      id: '',
      user_id: user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserPreferences,
    isLoading,
    error,
    updatePreferences,
  };
}
