import { safeFilename } from './pdf';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function sharePdf(bytes: Uint8Array, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const name = safeFilename(title);
  const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  download(file, name);
  return 'downloaded';
}
