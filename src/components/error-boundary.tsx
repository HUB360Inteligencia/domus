
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Algo deu errado
            </h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
