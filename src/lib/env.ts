export function getEnv(key: string): string {
  const runtime = typeof window !== "undefined" ? (window as any).__sitedrop_env?.[key] : undefined;
  if (runtime) return runtime;
  try {
    const meta = (import.meta as any).env;
    if (meta && meta[key]) return meta[key];
  } catch { /* fall through */ }
  return "";
}
