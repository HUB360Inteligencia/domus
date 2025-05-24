
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Bug } from 'lucide-react';

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
          className="bg-white shadow-lg"
        >
          <Bug className="h-4 w-4 mr-1" />
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

  // Debug info for troubleshooting
  const debugInfo = {
    windowMapboxgl: !!window.mapboxgl,
    documentScripts: Array.from(document.querySelectorAll('script[src*="mapbox"]')).length,
    documentLinks: Array.from(document.querySelectorAll('link[href*="mapbox"]')).length,
    timestamp: new Date().toLocaleTimeString()
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Mapbox
            </CardTitle>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowDetails(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Mapbox Loader Status */}
          <div>
            <h4 className="font-medium mb-1">Mapbox Loader</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(isLoaded, isLoading)}
              <Badge className={getStatusColor(isLoaded, isLoading)}>
                {isLoading ? 'Carregando...' : isLoaded ? 'Carregado' : 'Não carregado'}
              </Badge>
            </div>
            {loaderError && (
              <p className="text-red-600 mt-1">{loaderError}</p>
            )}
          </div>

          {/* Context Status */}
          <div>
            <h4 className="font-medium mb-1">Context</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon(!contextError, isTokenLoading)}
              <Badge className={getStatusColor(!contextError, isTokenLoading)}>
                {isTokenLoading ? 'Carregando...' : contextError ? 'Erro' : 'OK'}
              </Badge>
            </div>
            {contextError && (
              <p className="text-red-600 mt-1">{contextError}</p>
            )}
          </div>

          {/* Tokens */}
          <div>
            <h4 className="font-medium mb-1">Tokens</h4>
            <div className="space-y-1">
              {tokenTypes.map(tokenType => {
                const token = getTokenForContext(tokenType);
                return (
                  <div key={tokenType} className="flex items-center gap-2">
                    {getStatusIcon(!!token, false)}
                    <span className="flex-1 truncate">{tokenType.replace('mapbox_token_', '')}</span>
                    <Badge variant={token ? 'default' : 'secondary'}>
                      {token ? `${token.substring(0, 8)}...` : 'Não configurado'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Styles */}
          <div>
            <h4 className="font-medium mb-1">Estilos</h4>
            <div className="space-y-1">
              {styleTypes.map(styleType => {
                const style = getStyleForContext(styleType);
                return (
                  <div key={styleType} className="flex items-center gap-2">
                    {getStatusIcon(!!style, false)}
                    <span className="flex-1 truncate">{styleType.replace('mapbox_style_', '')}</span>
                    <Badge variant={style ? 'default' : 'secondary'}>
                      {style ? 'OK' : 'Padrão'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debug Info */}
          <div>
            <h4 className="font-medium mb-1">Debug Info</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>window.mapboxgl:</span>
                <Badge variant={debugInfo.windowMapboxgl ? 'default' : 'destructive'}>
                  {debugInfo.windowMapboxgl ? 'OK' : 'Não'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Scripts:</span>
                <Badge variant="outline">{debugInfo.documentScripts}</Badge>
              </div>
              <div className="flex justify-between">
                <span>CSS:</span>
                <Badge variant="outline">{debugInfo.documentLinks}</Badge>
              </div>
              <div className="text-muted-foreground">
                Atualizado: {debugInfo.timestamp}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t space-y-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Recarregar Página
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                console.log('=== MAPBOX DEBUG DUMP ===');
                console.log('Loader state:', { isLoaded, isLoading, error: loaderError });
                console.log('Context error:', contextError);
                console.log('Token loading:', isTokenLoading);
                console.log('Tokens:', tokenTypes.map(t => ({ type: t, token: getTokenForContext(t) })));
                console.log('Styles:', styleTypes.map(t => ({ type: t, style: getStyleForContext(t) })));
                console.log('Debug info:', debugInfo);
                console.log('=== END DEBUG DUMP ===');
              }}
              className="w-full"
            >
              Log Debug Info
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
