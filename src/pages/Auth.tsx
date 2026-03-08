import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, registerUser, onUserStateChanged, getCurrentUser } from "@/integrations/firebase/auth";
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
