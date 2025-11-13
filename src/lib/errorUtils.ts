/**
 * Error handling utility to prevent information leakage
 * Maps technical errors to user-friendly messages
 */

export const sanitizeError = (error: any): string => {
  // Log detailed error only in development mode
  if (import.meta.env.DEV) {
    console.error('Error details:', error);
  }

  // Map common error codes to user-friendly messages
  if (error?.message) {
    const errorMsg = error.message.toLowerCase();
    
    // Authentication errors - Check for email confirmation first
    if (errorMsg.includes('email not confirmed') || 
        errorMsg.includes('email confirmation') ||
        errorMsg.includes('email_not_confirmed')) {
      return 'Please verify your email address before signing in. Check your inbox for the verification link.';
    }
    
    // Invalid credentials could mean: wrong password, unverified email, or non-existent account
    if (errorMsg.includes('invalid login credentials') || 
        errorMsg.includes('invalid email or password') ||
        errorMsg.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again. If you just signed up, make sure to verify your email first.';
    }
    
    // Email already registered
    if (errorMsg.includes('email already registered') || 
        errorMsg.includes('user already registered') ||
        errorMsg.includes('already been registered') ||
        errorMsg.includes('user_already_exists') ||
        errorMsg.includes('duplicate')) {
      return 'An account with this email already exists. Please sign in instead or use a different email.';
    }
    
    // User not found
    if (errorMsg.includes('user not found') ||
        errorMsg.includes('user_not_found')) {
      return 'No account found with this email. Please sign up first.';
    }
    
    // Password too weak
    if (errorMsg.includes('password') && 
        (errorMsg.includes('weak') || errorMsg.includes('short') || errorMsg.includes('strength'))) {
      return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
    }
    
    // Email sending errors
    if (errorMsg.includes('error sending confirmation email') ||
        errorMsg.includes('error sending email') ||
        errorMsg.includes('smtp') ||
        errorMsg.includes('email delivery')) {
      return 'Unable to send verification email. This is a server configuration issue. Please contact support or try again later.';
    }
    
    // Rate limiting - more specific message
    if (errorMsg.includes('email rate limit') ||
        errorMsg.includes('rate limit') || 
        errorMsg.includes('too many requests') ||
        errorMsg.includes('rate_limit')) {
      return 'Too many sign-up attempts. Please wait 10-15 minutes before trying again, or contact support if this persists.';
    }
    
    // Database/network errors
    if (errorMsg.includes('network') || 
        errorMsg.includes('fetch') ||
        errorMsg.includes('connection') ||
        errorMsg.includes('timeout')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Permission errors
    if (errorMsg.includes('permission') || 
        errorMsg.includes('unauthorized') ||
        errorMsg.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    
    // Stock/inventory errors
    if (errorMsg.includes('insufficient stock') || errorMsg.includes('stock')) {
      return 'Some items are out of stock. Please update your cart.';
    }
    
    // Session expired
    if (errorMsg.includes('session') && 
        (errorMsg.includes('expired') || errorMsg.includes('invalid'))) {
      return 'Your session has expired. Please sign in again.';
    }
    
    // Validation errors (these are already user-friendly)
    if (errorMsg.includes('validation') || 
        (errorMsg.includes('invalid') && !errorMsg.includes('credentials'))) {
      return error.message;
    }
  }
  
  // Check for error codes
  if (error?.code) {
    const errorCode = error.code.toLowerCase();
    
    if (errorCode.includes('auth')) {
      return 'Authentication error. Please try signing in again.';
    }
  }
  
  // Check for HTTP status codes
  if (error?.status === 500 || error?.statusCode === 500) {
    return 'Server error occurred. This is likely a database configuration issue. Please contact support or try again in a few minutes.';
  }
  
  if (error?.status === 503 || error?.statusCode === 503) {
    return 'Service temporarily unavailable. Please try again in a few minutes.';
  }
  
  // Default generic error message
  return 'An error occurred. Please try again later.';
};
