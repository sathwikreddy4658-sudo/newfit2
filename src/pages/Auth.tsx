import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { signupSchema, loginSchema } from "@/lib/validation";
import { sanitizeError } from "@/lib/errorUtils";
import logo from "@/assets/loo.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL parameters for mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
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
            toast({
              title: "Success!",
              description: "Email verified successfully! Welcome to Freelit.",
            });
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            // Check for redirectTo in URL params first, then fall back to location state
            const urlParams = new URLSearchParams(window.location.search);
            const returnTo = urlParams.get('redirectTo') || location.state?.returnTo || "/";
            navigate(returnTo, { replace: true });
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
          // Check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          if (session && mounted) {
            console.log('User already authenticated:', session.user.email);
            // Check for redirectTo in URL params first, then fall back to location state
            const urlParams = new URLSearchParams(window.location.search);
            const returnTo = urlParams.get('redirectTo') || location.state?.returnTo || "/";
            navigate(returnTo, { replace: true });
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
        toast({
          title: "Success!",
          description: "Email verified successfully! Welcome to Freelit.",
        });
        // Check for redirectTo in URL params first, then fall back to location state
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('redirectTo') || location.state?.returnTo || "/";
        navigate(returnTo, { replace: true });
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
            emailRedirectTo: `${window.location.origin}/auth`,
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
            {isLogin ? "Welcome Back" : "Join Freelit"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button type="submit" className="w-full font-poppins font-bold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
