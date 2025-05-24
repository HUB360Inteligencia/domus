
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
      console.log('useSystemSettings: Starting fetch...');
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
      
      console.log('useSystemSettings: Raw data received:', data);
      console.log('useSystemSettings: Settings count:', data?.length || 0);
      
      // Log each setting for debugging
      data?.forEach(setting => {
        console.log(`useSystemSettings: Setting ${setting.key}:`, {
          hasValue: !!setting.value,
          valueLength: setting.value?.length || 0,
          valuePreview: setting.value ? setting.value.substring(0, 20) + '...' : 'null'
        });
      });
      
      setSettings(data || []);
      setError(null);
      setIsInitialized(true);
      
      console.log('useSystemSettings: Settings loaded successfully');
    } catch (err: any) {
      console.error('useSystemSettings: Error fetching settings:', err);
      setError(err.message);
      setIsInitialized(true); // Still mark as initialized even with error
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
    if (!isInitialized) {
      console.log('useSystemSettings: getSetting called before initialization:', key);
      return null;
    }
    
    const setting = settings.find(setting => setting.key === key) || null;
    console.log('useSystemSettings: Getting setting:', { 
      key, 
      found: !!setting, 
      value: setting?.value,
      hasValue: !!setting?.value,
      isInitialized,
      totalSettings: settings.length
    });
    return setting;
  };

  const getMapboxToken = (tokenType: MapboxTokenType): string | null => {
    console.log(`useSystemSettings: Getting Mapbox token for ${tokenType}`);
    
    if (!isInitialized) {
      console.log(`useSystemSettings: Not initialized, returning null for ${tokenType}`);
      return null;
    }
    
    const setting = getSetting(tokenType);
    const token = setting?.value || null;
    
    console.log(`useSystemSettings: Token result for ${tokenType}:`, {
      found: !!setting,
      hasValue: !!token,
      tokenLength: token?.length || 0,
      tokenStart: token ? token.substring(0, 10) + '...' : 'null',
      settingExists: !!setting,
      rawValue: setting?.value
    });
    
    return token;
  };

  const getMapboxStyle = (styleType: MapboxStyleType): string | null => {
    console.log(`useSystemSettings: Getting Mapbox style for ${styleType}`);
    
    if (!isInitialized) {
      console.log(`useSystemSettings: Not initialized, returning null for ${styleType}`);
      return null;
    }
    
    const setting = getSetting(styleType);
    const style = setting?.value || null;
    
    console.log(`useSystemSettings: Style result for ${styleType}:`, {
      found: !!setting,
      hasValue: !!style,
      style
    });
    
    return style;
  };

  // Initial fetch
  useEffect(() => {
    console.log('useSystemSettings: Component mounted, starting initial fetch');
    fetchSettings();
  }, []);

  // Retry mechanism for failed loads
  useEffect(() => {
    if (error && !isLoading && isInitialized) {
      console.log('useSystemSettings: Error detected, setting up retry in 3 seconds');
      const retryTimer = setTimeout(() => {
        console.log('useSystemSettings: Retrying fetch after error');
        fetchSettings();
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, isLoading, isInitialized]);

  // Debug state changes
  useEffect(() => {
    console.log('useSystemSettings: State update:', {
      settingsCount: settings.length,
      isLoading,
      isInitialized,
      error,
      settingsKeys: settings.map(s => s.key),
      hasMapboxTokens: settings.filter(s => s.key.includes('mapbox_token')).length
    });
  }, [settings, isLoading, error, isInitialized]);

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
