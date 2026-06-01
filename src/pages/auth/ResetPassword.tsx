import { useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});

export default function ResetPassword() {
  const { sendResetEmail, isSendingResetEmail } = useProfile();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    
    try {
      const result = resetSchema.safeParse({ email });
      if (!result.success) {
        const formattedErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          formattedErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(formattedErrors);
        return;
      }

      await sendResetEmail(email);
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Redefinir Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Informe seu email para receber as instruções
        </p>
      </div>
      
      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-primary/10 text-primary rounded-lg">
            <p className="font-medium">Email enviado com sucesso!</p>
            <p className="text-sm mt-1">Verifique sua caixa de entrada e siga as instruções para criar uma nova senha.</p>
          </div>
          <Button asChild variant="outline" className="w-full mt-4">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSendingResetEmail}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            
            <Button type="submit" className="w-full" disabled={isSendingResetEmail}>
              {isSendingResetEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Instruções"}
            </Button>
          </form>
          
          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center text-sm text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
