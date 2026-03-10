import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, registerUser, onUserStateChanged, getCurrentUser, signInWithGoogle } from "@/integrations/firebase/auth";
import { subscribeToNewsletter } from "@/integrations/firebase/db";
import { sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { signupSchema, loginSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorUtils";
import logo from "@/assets/loo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL parameters for mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'reset') {
      setIsResetMode(true);
    }

    let mounted = true;

    const handleAuth = async () => {
      try {
        // Firebase handles auth state natively
        const user = await getCurrentUser();
        
        if (user && mounted) {
          // User is already authenticated, redirect to products
          const urlParams = new URLSearchParams(window.location.search);
          const returnTo = urlParams.get('redirectTo') || location.state?.returnTo || "/products";
          navigate(returnTo, { replace: true });
        }
      } catch (err) {
        console.error('Auth handling error:', err);
        toast({
          title: "Error",
          description: "An error occurred during authentication.",
          variant: "destructive",
        });
      }
    };

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [navigate, location]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningInGoogle(true);
      const authUser = await signInWithGoogle();
      
      if (authUser) {
        toast({
          title: "Welcome!",
          description: `Signed in as ${authUser.email}`,
        });
        
        // Redirect to products or returnTo URL
        const redirectTo = location.state?.returnTo || "/products";
        navigate(redirectTo, { replace: true });
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      const errorMessage = sanitizeError(error);
      
      // Special handling for the "operation-not-allowed" error
      if (error.code === 'auth/operation-not-allowed') {
        toast({
          title: "Google Sign-In Not Configured",
          description: "Please contact support. Google authentication is not yet enabled.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Sign-In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendPasswordResetEmail(auth, email.trim());

      if (error) {
        throw error;
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
        duration: 6000,
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = sanitizeError(error);
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "New password and confirmation do not match.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 8 characters long.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await updatePassword(auth.currentUser, newPassword);

      if (error) {
        throw error;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });

      // Clear form and redirect to login
      setNewPassword("");
      setConfirmPassword("");
      setIsResetMode(false);
      setIsLogin(true);
    } catch (error: any) {
      console.error('Password update error:', error);
      const errorMessage = sanitizeError(error);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Validate login data
        const validationResult = loginSchema.safeParse({
          email: email.trim(),
          password
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          toast({
            title: "Validation Error",
            description: firstError.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('Attempting sign in with:', { email: validationResult.data.email });
        await loginUser(validationResult.data.email, validationResult.data.password);

        console.log('Sign in successful');
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        // Check for redirectTo in URL params first, then fall back to location state
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('redirectTo') || location.state?.returnTo || "/";
        navigate(returnTo);
      } else {
        // Validate signup data
        const validationResult = signupSchema.safeParse({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          toast({
            title: "Validation Error",
            description: firstError.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('Attempting sign up with:', { 
          email: validationResult.data.email, 
          name: validationResult.data.name 
        });
        
        await registerUser(
          validationResult.data.email, 
          validationResult.data.password, 
          validationResult.data.name
        );

        // Subscribe to newsletter if checked
        if (subscribeNewsletter) {
          try {
            await subscribeToNewsletter(validationResult.data.email);
          } catch (error) {
            console.warn('Newsletter signup failed:', error);
            // Don't show error - not critical
          }
        }

        console.log('Sign up successful');
        toast({
          title: "Welcome to Freelit!",
          description: "Your account has been created successfully.",
        });

        // Navigate to products page
        navigate("/products");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Failed",
        description: sanitizeError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Freelit Logo" className="w-[150px] h-[150px] object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isResetMode ? "Reset Password" : isLogin ? "Welcome Back" : "Join Freelit"}
          </CardTitle>
          <CardDescription>
            {isResetMode ? "Enter your new password" : isLogin ? "Sign in to your account" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isResetMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full font-poppins font-bold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              {/* Google Sign-In Button */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInGoogle || loading}
                className="w-full font-poppins font-bold bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
              >
                {isSigningInGoogle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {!isLogin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={subscribeNewsletter}
                    onCheckedChange={(checked) => setSubscribeNewsletter(checked === true)}
                  />
                  <Label htmlFor="newsletter" className="text-sm font-normal">
                    Subscribe to Freelit for blog updates and special promotions
                  </Label>
                </div>
              )}
              <Button type="submit" className="w-full font-poppins font-bold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>
          )}
          {isLogin && !isResetMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-base text-gray-700 hover:text-gray-900 transition-colors font-poppins font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}
          {!isResetMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-base text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
