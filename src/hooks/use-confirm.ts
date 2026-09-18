import { createContext, useContext } from "react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Confirmação no padrão visual do sistema, com a mesma ergonomia do window.confirm:
 * `if (await confirm({ title: "Excluir?" })) { ... }`
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    // Fora do provider (ex.: testes isolados) cai no diálogo nativo
    return async (options) => window.confirm(options.description ? `${options.title}\n\n${options.description}` : options.title);
  }
  return confirm;
}
