import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, session, user } = useAuth();

  useEffect(() => {
    if (session && user) {
      navigate(user.role === "system_admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [session, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success("Login realizado com sucesso!");
    } catch {
      // The auth provider shows the user-facing error toast.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background premium-grid-lines px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="premium-gradient relative hidden min-h-[720px] overflow-hidden rounded-[2.5rem] p-10 text-primary-foreground shadow-[0_40px_90px_-55px_rgba(31,27,24,0.95)] lg:block">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="mb-12 inline-flex items-center rounded-3xl border border-white/15 bg-white/10 px-4 py-3">
                <img src="/brand/domus-wordmark-white.svg" alt="Domus" className="h-12 w-auto" />
              </div>

              <h1 className="max-w-xl text-5xl font-semibold leading-[1.02]">
                Controle patrimonial com leitura executiva.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-white/68">
                Uma entrada direta para acompanhar ativos, contratos, finanças e sinais de performance em uma experiencia mais precisa.
              </p>
            </div>

            <div className="grid grid-cols-[0.9fr_1.1fr] gap-4">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xs uppercase text-white/55">Ocupacao</span>
                  <ShieldCheck className="h-5 w-5 text-white/75" />
                </div>
                <p className="text-5xl font-semibold">87%</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12">
                  <div className="h-full w-[87%] rounded-full bg-white" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs uppercase text-white/55">Performance</span>
                  <BarChart3 className="h-5 w-5 text-white/75" />
                </div>
                <div className="flex h-36 items-end gap-3">
                  {[44, 68, 52, 86, 74, 96, 82].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-2xl bg-gradient-to-t from-white/35 to-white"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="premium-panel dark:premium-panel-dark animate-rise rounded-[2.5rem] p-6 backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl premium-gradient text-primary-foreground shadow-[0_20px_45px_-24px_rgba(80,52,31,0.85)]">
                <img src="/brand/domus-symbol-white.svg" alt="" className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="text-3xl font-semibold">Entrar</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Acesse sua area de gestao patrimonial.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Sua senha"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="h-12 w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Entrando…" : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 rounded-3xl border border-white/70 bg-white/50 p-4 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5">
              Nao tem uma conta?{" "}
              <Link to="/register" className="font-semibold text-foreground hover:text-accent">
                Cadastre-se
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
