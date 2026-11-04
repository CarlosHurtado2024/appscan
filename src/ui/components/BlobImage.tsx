import { useEffect, useState } from 'react';

export function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export function BlobImage({ blob, alt, className }: { blob: Blob; alt: string; className?: string }) {
  const url = useBlobUrl(blob);
  return url ? <img src={url} alt={alt} className={className} /> : <span className={className} />;
}
