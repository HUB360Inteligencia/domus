import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
  /** "page": erro dentro do layout (mantém sidebar/header visíveis). "app": tela cheia. */
  variant?: 'app' | 'page';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isChunkLoadError = (error: Error | null) =>
  !!error && /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(error.message);

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Auto-reset when route changes (resetKey is typically location.pathname)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    // Uma versão nova publicada invalida os chunks antigos: só um reload resolve.
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  private handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign('/dashboard');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isPage = this.props.variant === 'page';
      const chunkError = isChunkLoadError(this.state.error);

      return (
        <div className={isPage ? 'flex min-h-[60vh] items-center justify-center p-4' : 'flex min-h-screen items-center justify-center bg-background p-6'}>
          <div className="premium-panel dark:premium-panel-dark w-full max-w-md rounded-[2rem] p-8 text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              {chunkError ? 'Nova versão disponível' : 'Algo deu errado'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {chunkError
                ? 'O sistema foi atualizado. Recarregue a página para continuar.'
                : 'Não foi possível exibir esta tela. Você pode tentar novamente ou voltar para onde estava.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-muted p-4 text-left text-xs">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                onClick={this.handleBack}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                onClick={this.handleRetry}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
                {chunkError ? 'Recarregar' : 'Tentar novamente'}
              </button>
              <button
                onClick={() => window.location.assign('/dashboard')}
                className="premium-gradient inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium text-white"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
