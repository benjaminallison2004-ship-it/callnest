import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, setAuthToken, restoreSession } from '../lib/db';
const LS = 'sd_auth';
type SDUser = { id: string; email: string; role?: string };
interface AuthCtx { user: SDUser|null; loading: boolean; signIn:(e:string,p:string)=>Promise<void>; signUp:(e:string,p:string)=>Promise<void>; signOut:()=>Promise<void>; requestPasswordReset:(e:string)=>Promise<void>; resetPassword:(e:string,code:string,p:string)=>Promise<void>; }
const Ctx = createContext<AuthCtx>({} as AuthCtx);
function load(): any { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch { return null; } }
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SDUser|null>(null);
  const [loading, setLoading] = useState(true);
  function apply(s: any) { setAuthToken(s.access_token); setUser(s.user); localStorage.setItem(LS, JSON.stringify(s)); }
  useEffect(() => { (async () => {
    const s = load();
    // Show the stored user immediately. The refresh below confirms it, but a
    // returning visitor should not see a signed-out header for the length of a
    // network round-trip on every single page load.
    if (s && s.user) setUser(s.user);
    if (s && s.refresh_token) {
      // restoreSession() instead of authApi.refresh(): it shares the page's one
      // in-flight refresh, so a data call that 401s while this is running does
      // not spend the same single-use token a second time — and StrictMode's
      // double-invoked effect resolves to the same promise instead of racing.
      try { const r = await restoreSession(); if (r) apply({ user: s.user, ...r }); }
      catch (e: any) {
        // ONLY a definitive credential rejection clears the session. This used to
        // catch everything: a dropped connection, a 500, a rate-limit, a CORS
        // blip — all threw away a refresh token valid for thirty days, so a
        // momentary glitch signed the customer out and the owner heard "your site
        // keeps logging people out" for something they could never reproduce.
        if (e && (e.status === 401 || e.status === 403)) {
          localStorage.removeItem(LS);
          setUser(null);
        }
      }
    }
    setLoading(false);
  })(); }, []);
  // The data client signs the session out when a refresh is definitively
  // refused. Without this the UI keeps rendering a signed-in user over an app
  // whose every request fails.
  useEffect(() => {
    const onEnded = () => { localStorage.removeItem(LS); setUser(null); };
    window.addEventListener('sitedrop:session-ended', onEnded);
    return () => window.removeEventListener('sitedrop:session-ended', onEnded);
  }, []);
  const signIn = async (email: string, password: string) => { apply(await authApi.login(email, password)); };
  const signUp = async (email: string, password: string) => { apply(await authApi.signup(email, password)); };
  const signOut = async () => { const s = load(); try { if (s && s.refresh_token) await authApi.logout(s.refresh_token); } catch {} setAuthToken(null); localStorage.removeItem(LS); setUser(null); };
  // "Forgot password": emails a 6-digit code. Resolves the same whether or not
  // the address has an account.
  const requestPasswordReset = async (email: string) => { await authApi.requestPasswordReset(email); };
  // The code from that email + a new password. THROWS on a wrong/expired code;
  // on success the visitor is signed in.
  const resetPassword = async (email: string, code: string, password: string) => { apply(await authApi.resetPassword(email, code, password)); };
  // children render ALWAYS. This was {!loading && children}, and AuthProvider
  // wraps the router — so NOTHING rendered until the session check finished: the
  // homepage, the menu, the contact page, blank for every returning visitor for
  // the length of a network call, and forever if it hung. Visitors who had never
  // signed in saw the site fine, so the owner could never reproduce it. Pages
  // that need a user gate on loading themselves; ProtectedRoute already does.
  return <Ctx.Provider value={{ user, loading, signIn, signUp, signOut, requestPasswordReset, resetPassword }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
