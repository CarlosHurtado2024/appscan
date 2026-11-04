import { deployBase } from './deployBase';

test('Vercel serves the app from the root of its domain', () => {
  expect(deployBase({ VERCEL: '1' })).toBe('/');
});

test('GitHub Pages and local runs use the /appscan/ path', () => {
  expect(deployBase({})).toBe('/appscan/');
  expect(deployBase({ GITHUB_ACTIONS: 'true' })).toBe('/appscan/');
});
