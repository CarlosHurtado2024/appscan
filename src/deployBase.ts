/** Where the site is served from: Vercel uses the domain root, GitHub Pages uses the repository name. */
export function deployBase(env: Record<string, string | undefined>): string {
  return env.VERCEL ? '/' : '/appscan/';
}
