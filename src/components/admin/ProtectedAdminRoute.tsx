import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { getUserRoles } from "@/integrations/firebase/db";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper that verifies admin access before rendering content.
 * Uses onAuthStateChanged so Firebase can restore the session after a page refresh
 * before the check runs — prevents redirect-to-login on every refresh.
 */
const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires once Firebase resolves the persisted session,
    // so auth.currentUser is always valid (or null) by the time this callback runs.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          console.warn('Admin access denied: No authenticated user');
          navigate("/admin/auth", { replace: true });
          return;
        }

        const roles = await getUserRoles(user.uid);

        if (!roles?.includes('admin')) {
          console.warn('Admin access denied: user is not admin');
          navigate("/", { replace: true });
          return;
        }

        setIsVerified(true);
      } catch (error) {
        console.error('Error verifying admin access:', error);
        navigate("/", { replace: true });
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Don't render anything until verification is complete
  if (isLoading || !isVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying access...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
