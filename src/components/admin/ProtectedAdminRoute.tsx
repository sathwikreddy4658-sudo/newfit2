import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/client";
import { getUserRoles } from "@/integrations/firebase/db";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper that verifies admin access before rendering content.
 * Prevents unauthorized UI exposure by not rendering children until verification completes.
 */
const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      try {
        // 1. Check if user is authenticated
        const user = auth.currentUser;
        
        if (!user) {
          console.warn('Admin access denied: No authenticated user');
          if (isMounted) {
            navigate("/admin/auth", { replace: true });
          }
          return;
        }

        // 2. Check user's admin role in Firebase
        const roles = await getUserRoles(user.uid);

        if (!roles || roles.length === 0) {
          console.warn('Admin access denied: User has no roles');
          if (isMounted) {
            navigate("/", { replace: true });
          }
          return;
        }

        // 3. Verify user has admin role
        if (!roles.includes('admin')) {
          console.warn(`Admin access denied: User roles are [${roles.join(', ')}], not 'admin'`);
          if (isMounted) {
            navigate("/", { replace: true });
          }
          return;
        }

        // 4. User is verified as admin
        if (isMounted) {
          setIsVerified(true);
        }
      } catch (error) {
        console.error('Error verifying admin access:', error);
        if (isMounted) {
          navigate("/", { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyAdminAccess();

    // Cleanup
    return () => {
      isMounted = false;
    };
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
