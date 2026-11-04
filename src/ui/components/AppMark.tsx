const SRC = `${import.meta.env.BASE_URL}icon.svg`;

/** The app icon, decorative wherever the name AppScan sits beside it. */
export function AppMark({ size }: { size: number }) {
  return <img className="app-mark" src={SRC} width={size} height={size} alt="" />;
}
