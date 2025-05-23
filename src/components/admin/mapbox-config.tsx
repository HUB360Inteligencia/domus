
import { useState, useEffect } from 'react';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MapboxConfig() {
  const { token, setToken, error } = useMapbox();
  const [inputToken, setInputToken] = useState(token || '');
  const [isValidating, setIsValidating] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize component state
  useEffect(() => {
    if (token) {
      setInputToken(token);
      validateMapboxToken(token);
    }
    setIsLoading(false);
  }, [token]);

  // Validate Mapbox token by attempting to load the Mapbox GL JS library
  const validateMapboxToken = async (tokenToValidate: string) => {
    if (!tokenToValidate.trim()) {
      setIsTokenValid(false);
      return false;
    }

    setIsValidating(true);
    try {
      // Simple validation by checking if token starts with 'pk.'
      const isValid = tokenToValidate.startsWith('pk.');
      
      if (!isValid) {
        setIsTokenValid(false);
        return false;
      }
      
      // Advanced validation by trying to load a Mapbox tile
      const response = await fetch(
        `https://api.mapbox.com/v4/mapbox.satellite/0/0/0.png?access_token=${tokenToValidate}`,
        { method: 'HEAD' }
      );
      
      const valid = response.ok;
      setIsTokenValid(valid);
      return valid;
    } catch (err) {
      console.error('Error validating Mapbox token:', err);
      setIsTokenValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveToken = async () => {
    const trimmedToken = inputToken.trim();
    if (!trimmedToken) {
      toast.error('O token não pode estar vazio');
      return;
    }
    
    setIsValidating(true);
    const isValid = await validateMapboxToken(trimmedToken);
    
    if (isValid) {
      setToken(trimmedToken);
      toast.success('Token Mapbox salvo com sucesso');
    } else {
      toast.error('O token Mapbox parece ser inválido');
    }
    setIsValidating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">API Mapbox</CardTitle>
          {isTokenValid !== null && (
            <Badge variant={isTokenValid ? "success" : "destructive"} className="ml-2">
              {isTokenValid ? 'Válido' : 'Inválido'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Configure o token da API Mapbox para exibir mapas no sistema.
          Este token será usado em todos os componentes que precisam exibir mapas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="mapbox-token">Token de Acesso</Label>
            <div className="flex gap-2">
              <Input
                id="mapbox-token"
                placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGlrZ..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O token de acesso público (começa com 'pk.') do Mapbox.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-muted p-3 rounded-md">
            <h4 className="font-medium text-sm mb-2">Como obter um token do Mapbox?</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
              <li>Crie uma conta em <a href="https://www.mapbox.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com/signup</a></li>
              <li>Acesse a <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">página de tokens</a> do seu painel</li>
              <li>Crie um token público (começando com 'pk.')</li>
              <li>Copie e cole o token no campo acima</li>
            </ol>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {token && isTokenValid && (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="h-4 w-4 mr-1" /> 
              Token configurado
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => validateMapboxToken(inputToken)}
            disabled={!inputToken || isValidating}
          >
            Testar
          </Button>
          <Button 
            onClick={handleSaveToken}
            disabled={isValidating || !inputToken}
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
  );
}
