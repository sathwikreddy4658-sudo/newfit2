import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    // If we have access_token, we're in a reset/verification flow
    if (accessToken) {
      setIsResetMode(true);
    } else if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'reset') {
      setIsResetMode(true);
    }

    let mounted = true;

    const handleAuth = async () => {
      try {
        // Handle auth callback from URL hash parameters (Supabase uses hash for tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const token = hashParams.get('token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('Auth callback params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, token: !!token, type, error });

        if (error) {
          console.error('Auth error:', error, errorDescription);
          toast({
            title: "Verification Failed",
            description: errorDescription || error,
            variant: "destructive",
          });
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        if (accessToken && refreshToken) {
          console.log('Setting session with access_token and refresh_token...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            toast({
              title: "Verification Failed",
              description: "Email verification failed. Please try again.",
              variant: "destructive",
            });
          } else if (data.session) {
            console.log('Session set successfully:', data.session.user.email);
            
            // Check if this is a password reset flow
            const urlParams = new URLSearchParams(window.location.search);
            const mode = urlParams.get('mode');
            
            if (mode === 'reset') {
              // For password reset, don't navigate, just show the reset form
              console.log('Password reset mode detected - showing password update form');
              // Keep isResetMode as true to show the password form
            } else {
              // For email verification, show success and navigate
              toast({
                title: "Success!",
                description: "Email verified successfully! Welcome to Freelit.",
              });
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
              // Check for redirectTo in URL params first, then fall back to location state
              const returnTo = urlParams.get('redirectTo') || location.state?.returnTo || "/";
              if (mounted) {
                navigate(returnTo, { replace: true });
              }
            }
          }
        } else if (token && type) {
          console.log('Verifying OTP with token and type...');
          // For email verification, we need to use the token_hash from the URL
          // Supabase v2 uses access_token and refresh_token in the hash for email verification
          // If we have a token and type, it's likely an older format or different flow
          console.log('Token-based verification detected, but modern Supabase uses access_token/refresh_token');
          toast({
            title: "Verification Link Issue",
            description: "Please use the latest verification link from your email.",
            variant: "destructive",
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Only check session if no auth tokens in URL
          // This prevents redirect loops for users landing on /auth
          const urlParams = new URLSearchParams(window.location.search);
          const mode = urlParams.get('mode');
          
          // Don't redirect if we're in reset or signup mode
          if (!mode) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && mounted) {
              console.log('User already authenticated, redirecting from auth page');
              // Redirect authenticated users away from auth page
              navigate('/', { replace: true });
            }
          }
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session && mounted) {
        // Only navigate if not in reset mode
        const mode = new URLSearchParams(window.location.search).get('mode');
        if (mode !== 'reset') {
          console.log('User signed in via auth state change, redirecting to home');
          navigate('/', { replace: true });
        }
      } else if (event === 'SIGNED_OUT' && mounted) {
        // Handle sign out if needed
        console.log('User signed out');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
        duration: 6000,
      });

      // Reset form and show success state
      setEmail("");
      setIsResetMode(false);
      setIsLogin(true);
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

  const handleForgotPassword = () => {
    setIsResetMode(true);
    setEmail("");
    setPassword("");
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

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validationResult.data.email,
          password: validationResult.data.password,
        });

        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }

        console.log('Sign in successful:', data);
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
        
        const { data, error } = await supabase.auth.signUp({
          email: validationResult.data.email,
          password: validationResult.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: validationResult.data.name,
            },
          },
        });

        if (error) {
          console.error('Sign up error:', error);
          throw error;
        }

        console.log('Sign up response:', data);

        // Subscribe to newsletter if checked
        if (subscribeNewsletter) {
          try {
            const { error: newsletterError } = await supabase
              .from("newsletter_subscribers")
              .insert([{ email: email.trim(), source: 'sign up page' }]);

            if (newsletterError && newsletterError.code !== '23505') {
              console.error('Newsletter subscription error:', newsletterError);
            }
          } catch (newsletterError) {
            console.error('Newsletter subscription error:', newsletterError);
          }
        }

        // Show detailed success message
        toast({
          title: "Account created successfully!",
          description: "Please check your email and click the verification link before signing in.",
          duration: 8000,
        });

        // Clear form and switch to login
        setEmail("");
        setPassword("");
        setName("");
        setSubscribeNewsletter(false);
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = sanitizeError(error);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
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
            // Check if we're in the actual reset password update mode (after clicking email link)
            newPassword !== "" || confirmPassword !== "" || window.location.hash.includes('access_token') ? (
              // Reset password update form
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
                    placeholder="At least 8 characters"
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
                    placeholder="Confirm your new password"
                  />
                </div>
                <Button type="submit" className="w-full font-poppins font-bold" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsResetMode(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setIsLogin(true);
                  }}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              // Request password reset email form
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
                <Button type="submit" className="w-full font-poppins font-bold" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsResetMode(false);
                    setEmail("");
                    setIsLogin(true);
                  }}
                >
                  Back to Login
                </Button>
              </form>
            )
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
                onClick={handleForgotPassword}
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
