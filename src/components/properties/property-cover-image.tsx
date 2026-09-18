import { ReactNode, useEffect, useState } from "react";

interface PropertyCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Exibido quando não há imagem ou quando a URL falha ao carregar. */
  fallback: ReactNode;
  loading?: "lazy" | "eager";
}

/** Capa do imóvel com fallback: evita o ícone de "imagem quebrada" quando a URL não carrega. */
export function PropertyCoverImage({ src, alt, className, fallback, loading = "lazy" }: PropertyCoverImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
