import { installKind } from './installKind';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

const base = { maxTouchPoints: 0, standalone: false, hasPrompt: false, waited: false };

test('an installed app offers nothing', () => {
  expect(installKind({ ...base, userAgent: ANDROID, standalone: true, hasPrompt: true })).toBe('none');
});

test('a browser with an install prompt uses it', () => {
  expect(installKind({ ...base, userAgent: ANDROID, hasPrompt: true })).toBe('prompt');
  expect(installKind({ ...base, userAgent: DESKTOP, hasPrompt: true })).toBe('prompt');
});

test('iPhone gets the Safari steps right away', () => {
  expect(installKind({ ...base, userAgent: IPHONE, maxTouchPoints: 5 })).toBe('ios');
});

test('an iPad that identifies as a Mac gets the Safari steps', () => {
  expect(installKind({ ...base, userAgent: IPAD_AS_MAC, maxTouchPoints: 5 })).toBe('ios');
});

test('a real Mac is not treated as an iPad', () => {
  expect(installKind({ ...base, userAgent: IPAD_AS_MAC })).toBe('none');
});

test('Android waits for the browser prompt before falling back to menu steps', () => {
  expect(installKind({ ...base, userAgent: ANDROID })).toBe('none');
  expect(installKind({ ...base, userAgent: ANDROID, waited: true })).toBe('android-menu');
});

test('a desktop browser without a prompt offers nothing', () => {
  expect(installKind({ ...base, userAgent: DESKTOP, waited: true })).toBe('none');
});
