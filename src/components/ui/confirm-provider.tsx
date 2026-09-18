import { ReactNode, useCallback, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConfirmContext, ConfirmOptions } from "@/hooks/use-confirm";

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolverRef.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!options}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={options?.title ?? ""}
        description={options?.description}
        confirmLabel={options?.confirmLabel ?? (options?.destructive ? "Excluir" : "Confirmar")}
        cancelLabel={options?.cancelLabel}
        destructive={options?.destructive}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}
