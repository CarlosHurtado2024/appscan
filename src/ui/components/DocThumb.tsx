import { useEffect, useState } from 'react';
import type { Doc, Page } from '../../core/types';
import { getPage } from '../../storage/db';
import { BlobImage } from './BlobImage';

export const serial = (id: string) => id.replace(/-/g, '').slice(0, 6).toUpperCase();

export function DocThumb({ doc }: { doc: Doc }) {
  const [cover, setCover] = useState<Page>();
  useEffect(() => {
    if (doc.pageIds[0]) getPage(doc.pageIds[0]).then(setCover);
  }, [doc.pageIds]);

  return (
    <span className="stub__thumb">
      {cover && <BlobImage blob={cover.thumb} alt={`Primera página de ${doc.title}`} />}
    </span>
  );
}
