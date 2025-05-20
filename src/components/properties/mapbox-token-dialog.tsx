
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { useMapbox } from '@/contexts/MapboxContext';

interface MapboxTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MapboxTokenDialog({ isOpen, onClose }: MapboxTokenDialogProps) {
  const { setToken } = useMapbox();
  const [inputToken, setInputToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim()) {
      setToken(inputToken.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar token Mapbox</DialogTitle>
          <DialogDescription>
            Para exibir mapas, precisamos de um token de acesso público do Mapbox.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <div className="grid flex-1 gap-2">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-amber-500" />
              <div>
                <p className="font-medium">Este token será armazenado apenas no seu navegador.</p>
                <p className="mt-1">Obtenha seu token gratuito em <a href="https://www.mapbox.com/account/access-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com/account/access-tokens</a></p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="token">Token Mapbox</Label>
                <Input
                  id="token"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGlrZ..."
                  className="w-full"
                  required
                />
              </div>
              
              <DialogFooter className="sm:justify-end">
                <Button variant="outline" onClick={onClose} type="button">
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
