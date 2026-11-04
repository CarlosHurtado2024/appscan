import { safeFilename } from './pdf';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Browsers may only allow sharing right after a tap, and building a long PDF can outlast that.
 * "blocked" means nothing happened and another tap can share these same bytes.
 */
export async function sharePdf(
  bytes: Uint8Array,
  title: string,
  opts: { retried?: boolean } = {},
): Promise<'shared' | 'downloaded' | 'cancelled' | 'blocked'> {
  const name = safeFilename(title);
  const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      const reason = (e as DOMException).name;
      if (reason === 'AbortError') return 'cancelled';
      if (reason === 'NotAllowedError' && !opts.retried) return 'blocked';
    }
  }
  download(file, name);
  return 'downloaded';
}
