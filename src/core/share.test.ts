import { sharePdf } from './share';

const bytes = new Uint8Array([1, 2, 3]);

function stubBrowser(nav: Partial<Navigator>) {
  const anchor = { click: vi.fn(), href: '', download: '' };
  vi.stubGlobal('navigator', nav);
  vi.stubGlobal('document', { createElement: () => anchor });
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} }));
  return anchor;
}

afterEach(() => vi.unstubAllGlobals());

test('sharePdf shares a named PDF file when the browser can', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  const anchor = stubBrowser({ canShare: () => true, share });
  expect(await sharePdf(bytes, 'Factura')).toBe('shared');
  const file = share.mock.calls[0][0].files[0] as File;
  expect(file.name).toBe('Factura.pdf');
  expect(file.type).toBe('application/pdf');
  expect(anchor.click).not.toHaveBeenCalled();
});

test('sharePdf returns cancelled on AbortError and does not download', async () => {
  const share = vi.fn().mockRejectedValue(new DOMException('no', 'AbortError'));
  const anchor = stubBrowser({ canShare: () => true, share });
  expect(await sharePdf(bytes, 'A')).toBe('cancelled');
  expect(anchor.click).not.toHaveBeenCalled();
});

test('sharePdf downloads when files cannot be shared', async () => {
  const anchor = stubBrowser({ canShare: () => false });
  expect(await sharePdf(bytes, 'Factura')).toBe('downloaded');
  expect(anchor.download).toBe('Factura.pdf');
  expect(anchor.click).toHaveBeenCalled();
});

test('sharePdf reports blocked, without downloading, when the browser wants a fresh tap', async () => {
  const share = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'));
  const anchor = stubBrowser({ canShare: () => true, share });
  expect(await sharePdf(bytes, 'A')).toBe('blocked');
  expect(anchor.click).not.toHaveBeenCalled();
});

test('after a fresh tap is also blocked, sharePdf falls back to downloading', async () => {
  const share = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'));
  const anchor = stubBrowser({ canShare: () => true, share });
  expect(await sharePdf(bytes, 'A', { retried: true })).toBe('downloaded');
  expect(anchor.click).toHaveBeenCalled();
});

test('sharePdf downloads when sharing fails for another reason', async () => {
  const share = vi.fn().mockRejectedValue(new DOMException('no', 'DataError'));
  const anchor = stubBrowser({ canShare: () => true, share });
  expect(await sharePdf(bytes, 'A')).toBe('downloaded');
  expect(anchor.click).toHaveBeenCalled();
});
