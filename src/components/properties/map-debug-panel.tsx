
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface MapDebugPanelProps {
  isVisible?: boolean;
}

export function MapDebugPanel({ isVisible = false }: MapDebugPanelProps) {
  const [showDetails, setShowDetails] = useState(isVisible);
  const { getTokenForContext, getStyleForContext, isTokenLoading, error: contextError } = useMapbox();
  const { isLoaded, isLoading, error: loaderError } = useMapboxLoader();

  if (!showDetails && !isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setShowDetails(true)}
        >
          Debug Mapbox
        </Button>
      </div>
    );
  }

  const tokenTypes = [
    'mapbox_token_property_list',
    'mapbox_token_property_detail',
    'mapbox_token_property_3d',
    'mapbox_token_analytics'
  ] as const;

  const styleTypes = [
    'mapbox_style_property_list',
    'mapbox_style_property_detail',
    'mapbox_style_property_3d',
    'mapbox_style_analytics'
  ] as const;

  const getStatusIcon = (hasValue: boolean, isLoading: boolean) => {
    if (isLoading) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (hasValue) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (hasValue: boolean, isLoading: boolean) => {
    if (isLoading) return 'bg-yellow-100 text-yellow-800';
    if (hasValue) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Debug Mapbox</CardTitle>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowDetails(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Mapbox Loader Status */}
          <div>
            <h4 className="text-xs font-medium mb-1">Mapbox Loader</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(isLoaded, isLoading)}
              <Badge className={getStatusColor(isLoaded, isLoading)}>
                {isLoading ? 'Carregando...' : isLoaded ? 'Carregado' : 'Não carregado'}
              </Badge>
            </div>
            {loaderError && (
              <p className="text-xs text-red-600 mt-1">{loaderError}</p>
            )}
          </div>

          {/* Context Status */}
          <div>
            <h4 className="text-xs font-medium mb-1">Context</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(!contextError, isTokenLoading)}
              <Badge className={getStatusColor(!contextError, isTokenLoading)}>
                {isTokenLoading ? 'Carregando...' : contextError ? 'Erro' : 'OK'}
              </Badge>
            </div>
            {contextError && (
              <p className="text-xs text-red-600 mt-1">{contextError}</p>
            )}
          </div>

          {/* Tokens */}
          <div>
            <h4 className="text-xs font-medium mb-1">Tokens</h4>
            <div className="space-y-1">
              {tokenTypes.map(tokenType => {
                const token = getTokenForContext(tokenType);
                return (
                  <div key={tokenType} className="flex items-center gap-2 text-xs">
                    {getStatusIcon(!!token, false)}
                    <span className="flex-1">{tokenType.replace('mapbox_token_', '')}</span>
                    <Badge variant={token ? 'default' : 'secondary'} className="text-xs">
                      {token ? 'Configurado' : 'Não configurado'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Styles */}
          <div>
            <h4 className="text-xs font-medium mb-1">Estilos</h4>
            <div className="space-y-1">
              {styleTypes.map(styleType => {
                const style = getStyleForContext(styleType);
                return (
                  <div key={styleType} className="flex items-center gap-2 text-xs">
                    {getStatusIcon(!!style, false)}
                    <span className="flex-1">{styleType.replace('mapbox_style_', '')}</span>
                    <Badge variant={style ? 'default' : 'secondary'} className="text-xs">
                      {style ? 'Configurado' : 'Padrão'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mapbox Global */}
          <div>
            <h4 className="text-xs font-medium mb-1">Mapbox Global</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(!!window.mapboxgl, false)}
              <Badge className={getStatusColor(!!window.mapboxgl, false)}>
                {window.mapboxgl ? 'Disponível' : 'Não disponível'}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
