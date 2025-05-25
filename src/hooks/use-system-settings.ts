
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

export type MapboxStyleType = 
  | 'mapbox_style_property_list'
  | 'mapbox_style_property_detail' 
  | 'mapbox_style_property_3d'
  | 'mapbox_style_analytics';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  const fetchSettings = async () => {
    try {
      console.log('useSystemSettings: Fetching settings...');
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('useSystemSettings: Supabase error:', error);
        throw error;
      }
      
      console.log('useSystemSettings: Settings loaded:', data?.length || 0);
      setSettings(data || []);
      setIsInitialized(true);
    } catch (err: any) {
      console.error('useSystemSettings: Error:', err);
      setError(err.message);
      setIsInitialized(true); // Mark as initialized even with error
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string | null) => {
    try {
      console.log('useSystemSettings: Updating setting:', key);
      
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
      console.error('useSystemSettings: Error updating setting:', err);
      setError(err.message);
      return false;
    }
  };

  const getSetting = (key: string): SystemSetting | null => {
    const setting = settings.find(s => s.key === key) || null;
    console.log('useSystemSettings: Get setting:', { 
      key, 
      found: !!setting, 
      hasValue: !!setting?.value 
    });
    return setting;
  };

  const getMapboxToken = (tokenType: MapboxTokenType): string | null => {
    if (!isInitialized) {
      console.log(`useSystemSettings: Not initialized for ${tokenType}`);
      return null;
    }
    
    const setting = getSetting(tokenType);
    const token = setting?.value || null;
    
    console.log(`useSystemSettings: Token for ${tokenType}:`, {
      found: !!setting,
      hasValue: !!token,
      tokenLength: token?.length || 0
    });
    
    return token;
  };

  const getMapboxStyle = (styleType: MapboxStyleType): string | null => {
    if (!isInitialized) {
      console.log(`useSystemSettings: Not initialized for ${styleType}`);
      return null;
    }
    
    const setting = getSetting(styleType);
    const style = setting?.value || null;
    
    console.log(`useSystemSettings: Style for ${styleType}:`, {
      found: !!setting,
      hasValue: !!style,
      style
    });
    
    return style;
  };

  // Initial fetch
  useEffect(() => {
    console.log('useSystemSettings: Initial fetch');
    fetchSettings();
    
    // Set timeout to avoid infinite loading
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.log('useSystemSettings: Timeout reached, marking as initialized');
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  return {
    settings,
    isLoading,
    error,
    isInitialized,
    updateSetting,
    getSetting,
    getMapboxToken,
    getMapboxStyle,
    refetch: fetchSettings
  };
};
