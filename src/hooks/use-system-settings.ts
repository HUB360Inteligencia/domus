
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
  const { user } = useAuth();

  const fetchSettings = async () => {
    try {
      console.log('useSystemSettings: Fetching settings from Supabase...');
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('useSystemSettings: Supabase error:', error);
        throw error;
      }
      
      console.log('useSystemSettings: Settings fetched:', {
        count: data?.length || 0,
        keys: data?.map(s => s.key) || []
      });
      
      setSettings(data || []);
      setError(null);
    } catch (err: any) {
      console.error('useSystemSettings: Error fetching settings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string | null) => {
    try {
      console.log('useSystemSettings: Updating setting:', { key, hasValue: !!value });
      
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
      
      console.log('useSystemSettings: Setting updated successfully:', key);
      return true;
    } catch (err: any) {
      console.error('useSystemSettings: Error updating setting:', err);
      setError(err.message);
      return false;
    }
  };

  const getSetting = (key: string): SystemSetting | null => {
    const setting = settings.find(setting => setting.key === key) || null;
    console.log('useSystemSettings: Getting setting:', { 
      key, 
      found: !!setting, 
      value: setting?.value,
      hasValue: !!setting?.value 
    });
    return setting;
  };

  const getMapboxToken = (tokenType: MapboxTokenType): string | null => {
    console.log(`useSystemSettings: Getting Mapbox token for ${tokenType}`);
    
    const setting = getSetting(tokenType);
    const token = setting?.value || null;
    
    console.log(`useSystemSettings: Token for ${tokenType}:`, {
      found: !!setting,
      hasValue: !!token,
      tokenLength: token?.length || 0,
      tokenStart: token ? token.substring(0, 10) + '...' : 'null'
    });
    
    return token;
  };

  const getMapboxStyle = (styleType: MapboxStyleType): string | null => {
    console.log(`useSystemSettings: Getting Mapbox style for ${styleType}`);
    
    const setting = getSetting(styleType);
    const style = setting?.value || null;
    
    console.log(`useSystemSettings: Style for ${styleType}:`, {
      found: !!setting,
      hasValue: !!style,
      style
    });
    
    return style;
  };

  useEffect(() => {
    console.log('useSystemSettings: Component mounted, fetching settings');
    fetchSettings();
  }, []);

  // Log current state whenever it changes
  useEffect(() => {
    console.log('useSystemSettings: State changed:', {
      settingsCount: settings.length,
      isLoading,
      error,
      settingsKeys: settings.map(s => s.key)
    });
  }, [settings, isLoading, error]);

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    getSetting,
    getMapboxToken,
    getMapboxStyle,
    refetch: fetchSettings
  };
};
