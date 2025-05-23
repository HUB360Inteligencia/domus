
import { useState, useEffect } from 'react';
import { useSystemSettings, MapboxTokenType, MapboxStyleType } from '@/hooks/use-system-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, Globe, Map, Mountain, BarChart3, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TokenConfig {
  key: MapboxTokenType;
  styleKey: MapboxStyleType;
  label: string;
  description: string;
  icon: any;
  defaultMapStyle: string;
  features: string[];
}

const tokenConfigs: TokenConfig[] = [
  {
    key: 'mapbox_token_property_list',
    styleKey: 'mapbox_style_property_list',
    label: 'Listagem de Imóveis',
    description: 'Token para mapas simples na listagem de propriedades',
    icon: Map,
    defaultMapStyle: 'mapbox://styles/mapbox/streets-v12',
    features: ['Visualização rápida', 'Múltiplos marcadores', 'Performance otimizada']
  },
  {
    key: 'mapbox_token_property_detail',
    styleKey: 'mapbox_style_property_detail',
    label: 'Detalhes do Imóvel',
    description: 'Token para visualização detalhada com satélite',
    icon: Globe,
    defaultMapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
    features: ['Vista de satélite', 'Detalhes de rua', 'Localização precisa']
  },
  {
    key: 'mapbox_token_property_3d',
    styleKey: 'mapbox_style_property_3d',
    label: 'Visualização 3D',
    description: 'Token para mapas 3D imersivos',
    icon: Mountain,
    defaultMapStyle: 'mapbox://styles/mapbox/streets-v12',
    features: ['Renderização 3D', 'Pitch ajustável', 'Experiência imersiva']
  },
  {
    key: 'mapbox_token_analytics',
    styleKey: 'mapbox_style_analytics',
    label: 'Analytics Dashboard',
    description: 'Token para dashboards analíticos',
    icon: BarChart3,
    defaultMapStyle: 'mapbox://styles/mapbox/light-v11',
    features: ['Estilo minimalista', 'Foco nos dados', 'Performance analítica']
  }
];

const popularStyles = [
  { value: 'mapbox://styles/mapbox/streets-v12', label: 'Streets' },
  { value: 'mapbox://styles/mapbox/outdoors-v12', label: 'Outdoors' },
  { value: 'mapbox://styles/mapbox/light-v11', label: 'Light' },
  { value: 'mapbox://styles/mapbox/dark-v11', label: 'Dark' },
  { value: 'mapbox://styles/mapbox/satellite-v9', label: 'Satellite' },
  { value: 'mapbox://styles/mapbox/satellite-streets-v12', label: 'Satellite Streets' },
  { value: 'mapbox://styles/mapbox/navigation-day-v1', label: 'Navigation Day' },
  { value: 'mapbox://styles/mapbox/navigation-night-v1', label: 'Navigation Night' }
];

export function MultiMapboxConfig() {
  const { settings, isLoading, updateSetting, getSetting } = useSystemSettings();
  const [inputTokens, setInputTokens] = useState<Record<MapboxTokenType, string>>({
    mapbox_token_property_list: '',
    mapbox_token_property_detail: '',
    mapbox_token_property_3d: '',
    mapbox_token_analytics: ''
  });
  const [inputStyles, setInputStyles] = useState<Record<MapboxStyleType, string>>({
    mapbox_style_property_list: '',
    mapbox_style_property_detail: '',
    mapbox_style_property_3d: '',
    mapbox_style_analytics: ''
  });
  const [validatingTokens, setValidatingTokens] = useState<Set<MapboxTokenType>>(new Set());
  const [tokenValidities, setTokenValidities] = useState<Record<MapboxTokenType, boolean | null>>({
    mapbox_token_property_list: null,
    mapbox_token_property_detail: null,
    mapbox_token_property_3d: null,
    mapbox_token_analytics: null
  });

  // Initialize input tokens and styles from settings
  useEffect(() => {
    if (settings.length > 0) {
      console.log('Initializing tokens and styles from settings:', settings);
      
      const newInputTokens = { ...inputTokens };
      const newInputStyles = { ...inputStyles };

      tokenConfigs.forEach(config => {
        const tokenSetting = getSetting(config.key);
        const styleSetting = getSetting(config.styleKey);
        
        if (tokenSetting?.value) {
          newInputTokens[config.key] = tokenSetting.value;
        }
        
        if (styleSetting?.value) {
          newInputStyles[config.styleKey] = styleSetting.value;
        }
      });

      console.log('New input tokens:', newInputTokens);
      console.log('New input styles:', newInputStyles);

      setInputTokens(newInputTokens);
      setInputStyles(newInputStyles);

      // Validate existing tokens
      tokenConfigs.forEach(config => {
        const setting = getSetting(config.key);
        if (setting?.value) {
          validateMapboxToken(config.key, setting.value);
        }
      });
    }
  }, [settings.length]); // Only depend on settings length to avoid infinite loops

  const validateMapboxToken = async (tokenType: MapboxTokenType, token: string) => {
    if (!token.trim()) {
      setTokenValidities(prev => ({ ...prev, [tokenType]: false }));
      return false;
    }

    setValidatingTokens(prev => new Set(prev).add(tokenType));
    
    try {
      const isValid = token.startsWith('pk.');
      
      if (!isValid) {
        setTokenValidities(prev => ({ ...prev, [tokenType]: false }));
        return false;
      }
      
      // Advanced validation by trying to load a Mapbox tile
      const response = await fetch(
        `https://api.mapbox.com/v4/mapbox.satellite/0/0/0.png?access_token=${token}`,
        { method: 'HEAD' }
      );
      
      const valid = response.ok;
      setTokenValidities(prev => ({ ...prev, [tokenType]: valid }));
      return valid;
    } catch (err) {
      console.error(`Error validating ${tokenType}:`, err);
      setTokenValidities(prev => ({ ...prev, [tokenType]: false }));
      return false;
    } finally {
      setValidatingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenType);
        return newSet;
      });
    }
  };

  const handleSaveToken = async (tokenType: MapboxTokenType) => {
    const token = inputTokens[tokenType].trim();
    if (!token) {
      toast.error('O token não pode estar vazio');
      return;
    }
    
    const isValid = await validateMapboxToken(tokenType, token);
    
    if (isValid) {
      const success = await updateSetting(tokenType, token);
      if (success) {
        toast.success(`Token ${tokenConfigs.find(c => c.key === tokenType)?.label} salvo com sucesso`);
      } else {
        toast.error('Erro ao salvar token');
      }
    } else {
      toast.error('O token Mapbox parece ser inválido');
    }
  };

  const handleSaveStyle = async (styleType: MapboxStyleType) => {
    const style = inputStyles[styleType].trim();
    if (!style) {
      toast.error('O style URL não pode estar vazio');
      return;
    }
    
    const success = await updateSetting(styleType, style);
    if (success) {
      toast.success(`Style URL ${tokenConfigs.find(c => c.styleKey === styleType)?.label} salvo com sucesso`);
    } else {
      toast.error('Erro ao salvar style URL');
    }
  };

  const handleTestToken = (tokenType: MapboxTokenType) => {
    const token = inputTokens[tokenType];
    if (token) {
      validateMapboxToken(tokenType, token);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configuração Multi-Token Mapbox</h3>
        <p className="text-sm text-muted-foreground">
          Configure tokens específicos e styles customizados para diferentes contextos de mapas no sistema.
        </p>
      </div>

      <Tabs defaultValue={tokenConfigs[0].key} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {tokenConfigs.map(config => {
            const Icon = config.icon;
            const isValid = tokenValidities[config.key];
            return (
              <TabsTrigger key={config.key} value={config.key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label.split(' ')[0]}</span>
                {isValid && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tokenConfigs.map(config => {
          const Icon = config.icon;
          const isValid = tokenValidities[config.key];
          const isValidating = validatingTokens.has(config.key);
          const currentTokenSetting = getSetting(config.key);
          const currentStyleSetting = getSetting(config.styleKey);

          return (
            <TabsContent key={config.key} value={config.key}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Token Configuration */}
                <Card>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        Token de Acesso
                      </CardTitle>
                      {isValid !== null && (
                        <Badge variant={isValid ? "default" : "destructive"} className="ml-2">
                          {isValid ? 'Válido' : 'Inválido'}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Token público do Mapbox para {config.label.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`token-${config.key}`}>Token de Acesso</Label>
                        <Input
                          id={`token-${config.key}`}
                          placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGlrZ..."
                          value={inputTokens[config.key]}
                          onChange={(e) => setInputTokens(prev => ({
                            ...prev,
                            [config.key]: e.target.value
                          }))}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Token público do Mapbox (começa com 'pk.').
                        </p>
                      </div>

                      {currentTokenSetting?.value && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Token configurado em {new Date(currentTokenSetting.updated_at).toLocaleString()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      {currentTokenSetting?.value && isValid && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> 
                          Token ativo
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleTestToken(config.key)}
                        disabled={!inputTokens[config.key] || isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <AlertCircle className="mr-2 h-4 w-4" />
                        )}
                        Testar
                      </Button>
                      <Button 
                        onClick={() => handleSaveToken(config.key)}
                        disabled={isValidating || !inputTokens[config.key]}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          <>
                            <Globe className="mr-2 h-4 w-4" />
                            Salvar Token
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                {/* Style Configuration */}
                <Card>
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Style URL
                    </CardTitle>
                    <CardDescription>
                      Style customizado para {config.label.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`style-${config.styleKey}`}>Style URL</Label>
                        <Select 
                          value={inputStyles[config.styleKey] || config.defaultMapStyle}
                          onValueChange={(value) => setInputStyles(prev => ({
                            ...prev,
                            [config.styleKey]: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um style" />
                          </SelectTrigger>
                          <SelectContent>
                            {popularStyles.map(style => (
                              <SelectItem key={style.value} value={style.value}>
                                {style.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id={`style-${config.styleKey}`}
                          placeholder="mapbox://styles/mapbox/streets-v12"
                          value={inputStyles[config.styleKey]}
                          onChange={(e) => setInputStyles(prev => ({
                            ...prev,
                            [config.styleKey]: e.target.value
                          }))}
                          className="font-mono mt-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          URL do style do Mapbox ou style customizado.
                        </p>
                      </div>

                      <div className="bg-muted p-3 rounded-md">
                        <h4 className="font-medium text-sm mb-2">Características deste mapa:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {config.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Style padrão:</strong> {config.defaultMapStyle}
                        </p>
                      </div>

                      {currentStyleSetting?.value && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Style configurado em {new Date(currentStyleSetting.updated_at).toLocaleString()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={() => handleSaveStyle(config.styleKey)}
                      disabled={!inputStyles[config.styleKey]}
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Salvar Style
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="bg-muted p-3 rounded-md">
        <h4 className="font-medium text-sm mb-2">Como obter tokens e styles do Mapbox?</h4>
        <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
          <li>Crie uma conta em <a href="https://www.mapbox.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com/signup</a></li>
          <li>Acesse a <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">página de tokens</a> do seu painel</li>
          <li>Para styles customizados, use o <a href="https://studio.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mapbox Studio</a></li>
          <li>Configure os tokens e styles acima de acordo com suas necessidades</li>
        </ol>
      </div>
    </div>
  );
}
