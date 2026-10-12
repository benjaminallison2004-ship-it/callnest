import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// role: when set (e.g. role="admin"), only a signed-in user whose account
// carries that role may pass. The role is a signed server claim granted by the
// site owner in Sitedrop chat; signing up on the site never grants one.
export default function ProtectedRoute({ children, role }: { children?: React.ReactNode; role?: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading]);
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return null;
  if (role && user.role !== role) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-semibold">This area is for the site administrator.</p>
        <p className="text-sm text-muted-foreground">Your account ({user.email}) does not have the {role} role.</p>
        <Link to="/" className="text-sm underline">Back to the site</Link>
      </div>
    );
  }
  // Used as a wrapper -> render what was passed. Used as a layout route ->
  // render the matched child route. Either way the page appears.
  return <>{children ?? <Outlet />}</>;
}
