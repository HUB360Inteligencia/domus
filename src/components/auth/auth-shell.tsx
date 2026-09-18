import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Moldura padrão das telas de autenticação secundárias (cadastro, recuperação de senha). */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background premium-grid-lines px-4 py-10">
      <div className="premium-panel dark:premium-panel-dark animate-rise w-full max-w-md rounded-[2.5rem] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <div className="premium-gradient mb-5 flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-[0_20px_45px_-24px_rgba(80,52,31,0.85)]">
            <img src="/brand/domus-symbol-white.svg" alt="" className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
