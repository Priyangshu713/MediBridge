import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Lock, Mail, User, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { dispatchAuthEvent } from '@/App';
import { registerUser, loginWithGoogle } from '@/api/auth';
import { useHealthStore } from '@/store/healthStore';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const SignupForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setGeminiTier, setAppointmentCredits, loadFromServer } = useHealthStore();
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [emailToRecover, setEmailToRecover] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Function to remove email from deleted accounts list
  const removeFromDeletedAccounts = (email: string) => {
    try {
      const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
      const updatedAccounts = deletedAccounts.filter((account: string) => account !== email);
      localStorage.setItem('healthconnect_deleted_accounts', JSON.stringify(updatedAccounts));
      console.log(`Removed account ${email} from deleted accounts list`);
      return true;
    } catch (error) {
      console.error('Error removing from deleted accounts:', error);
      return false;
    }
  };

  // Check for deleted status when email changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'email' && value.email) {
        try {
          const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
          if (deletedAccounts.includes(value.email)) {
            setAccountDeleted(true);
            setEmailToRecover(value.email);
          } else {
            setAccountDeleted(false);
            setEmailToRecover('');
          }
        } catch (e) {
          console.error('Error checking deleted accounts:', e);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Handle account recovery
  const handleRecoverAccount = () => {
    setIsRecovering(true);

    try {
      if (removeFromDeletedAccounts(emailToRecover)) {
        setAccountDeleted(false);
        toast({
          title: "Account recovered",
          description: "Your account has been recovered. You can now register with this email.",
        });
      } else {
        toast({
          title: "Recovery failed",
          description: "Unable to recover your account. Please try again or use a different email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery failed",
        description: "An unexpected error occurred during recovery.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      // Check if this account was previously marked as deleted
      const wasDeleted = (() => {
        try {
          const deletedAccounts = JSON.parse(localStorage.getItem('healthconnect_deleted_accounts') || '[]');
          return deletedAccounts.includes(data.email);
        } catch (e) {
          return false;
        }
      })();

      // Submit only name, email, and password to the API
      const { name, email, password } = data;
      const registerData = { name, email, password };

      const result = await registerUser(registerData);

      // Store auth info in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);
      localStorage.setItem('token', result.token);

      // Store tier information (defaults to 'free' for new users)
      if (result.tier) {
        localStorage.setItem('geminiTier', result.tier);
        setGeminiTier(result.tier);
      } else {
        localStorage.setItem('geminiTier', 'free');
        setGeminiTier('free');
      }

      if (result.appointmentCredits !== undefined) {
        setAppointmentCredits(result.appointmentCredits);
      } else {
        setAppointmentCredits(0);
      }

      // Dispatch auth event to update global state
      dispatchAuthEvent(true, email);

      // Sync health profile with server (cross-device sync)
      await loadFromServer(email);

      // Show success toast - special message if account was previously deleted
      toast({
        title: wasDeleted ? "Account reactivated" : "Account created successfully",
        description: wasDeleted
          ? "Your previously deleted account has been reactivated."
          : "Welcome to MediBridge!",
      });

      // Navigate to profile page
      navigate('/profile', { state: { justLoggedIn: true } });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    setIsLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', result.email);
      localStorage.setItem('userName', result.name);
      localStorage.setItem('token', result.token);

      if (result.tier) {
        localStorage.setItem('geminiTier', result.tier);
        setGeminiTier(result.tier);
      } else {
        localStorage.setItem('geminiTier', 'free');
        setGeminiTier('free');
      }

      if (result.appointmentCredits !== undefined) {
        setAppointmentCredits(result.appointmentCredits);
      } else {
        setAppointmentCredits(0);
      }

      dispatchAuthEvent(true, result.email);

      // Sync health profile with server (cross-device sync)
      await loadFromServer(result.email);

      toast({
        title: "Account connected successfully",
        description: "Welcome to MediBridge via Google!",
      });

      navigate('/profile', { state: { justLoggedIn: true } });

    } catch (error) {
      console.error('Google Signup error:', error);
      toast({
        title: "Google Signup failed",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-3">
        <div className="flex justify-center w-full mb-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast({ title: "Signup Failed", description: "Google authentication was cancelled or failed.", variant: "destructive" });
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
            text="continue_with"
            size="large"
            width="320px"
          />
        </div>

        <div className="relative mb-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {accountDeleted && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Previously Deleted Account</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">This email address was previously used with an account that was deleted.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 bg-destructive/10 border-destructive/20"
                  onClick={handleRecoverAccount}
                  disabled={isRecovering}
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Recovering...
                    </>
                  ) : (
                    "Recover Account"
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 text-xs uppercase tracking-wider font-semibold">Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      placeholder="Your name"
                      className="pl-9 bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/30 h-11 transition-all"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 text-xs uppercase tracking-wider font-semibold">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      placeholder="name@example.com"
                      className="pl-9 bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/30 h-11 transition-all"
                      type="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 text-xs uppercase tracking-wider font-semibold">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      placeholder="••••••••"
                      className="pl-9 bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/30 h-11 transition-all"
                      type="password"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 text-xs uppercase tracking-wider font-semibold">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      placeholder="••••••••"
                      className="pl-9 bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/30 h-11 transition-all"
                      type="password"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 mt-6 text-[15px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_0_hsl(var(--primary)/30%)] transition-all hover:shadow-[0_6px_20px_rgba(var(--primary),0.23)] hover:-translate-y-[1px]"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Continue with Email"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
            By signing up, you agree to our <br className="sm:hidden" /><Link to="/terms-privacy" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">Terms of Service</Link> and <Link to="/terms-privacy?tab=privacy" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignupForm;
