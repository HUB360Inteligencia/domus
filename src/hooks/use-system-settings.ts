
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface SystemSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export type MapboxTokenType = 
  | 'mapbox_token_property_list'
  | 'mapbox_token_property_detail' 
  | 'mapbox_token_property_3d'
  | 'mapbox_token_analytics';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching system settings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string | null) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value, 
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;
      
      // Update local state
      setSettings(prev => 
        prev.map(setting => 
          setting.key === key 
            ? { ...setting, value, updated_at: new Date().toISOString() }
            : setting
        )
      );
      
      return true;
    } catch (err: any) {
      console.error('Error updating setting:', err);
      setError(err.message);
      return false;
    }
  };

  const getSetting = (key: string): SystemSetting | null => {
    return settings.find(setting => setting.key === key) || null;
  };

  const getMapboxToken = (tokenType: MapboxTokenType): string | null => {
    const setting = getSetting(tokenType);
    return setting?.value || null;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    getSetting,
    getMapboxToken,
    refetch: fetchSettings
  };
};
