import React, { useState } from 'react';
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
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { dispatchAuthEvent } from '@/App';
import { loginUser, loginWithGoogle } from '@/api/auth';
import { useHealthStore } from '@/store/healthStore';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setGeminiTier } = useHealthStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const result = await loginUser({
        email: data.email,
        password: data.password,
      });

      // Store auth info in local storage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', result.name);
      localStorage.setItem('token', result.token);

      // Store tier information if available
      if (result.tier) {
        localStorage.setItem('geminiTier', result.tier);
        setGeminiTier(result.tier);
      }

      // Dispatch auth event for real-time UI updates
      dispatchAuthEvent(true, data.email);

      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back to HealthConnect!",
      });

      // Call the onLoginSuccess callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Redirect to profile page
      navigate('/profile');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
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
      }

      dispatchAuthEvent(true, result.email);

      toast({
        title: "Login successful",
        description: "Welcome back to HealthConnect via Google!",
      });

      if (onLoginSuccess) onLoginSuccess();
      navigate('/profile');

    } catch (error) {
      console.error('Google Login error:', error);
      toast({
        title: "Google Login failed",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="flex justify-center w-full mb-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast({ title: "Login Failed", description: "Google authentication was cancelled or failed.", variant: "destructive" });
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
            text="continue_with"
            size="large"
            width="320px"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-foreground/80 text-xs uppercase tracking-wider font-semibold">Password</FormLabel>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      placeholder="••••••••"
                      className="pl-9 pr-10 bg-muted/40 border-muted-foreground/20 focus-visible:ring-primary/30 h-11 transition-all"
                      type={showPassword ? 'text' : 'password'}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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
            {isLoading ? "Signing in..." : "Continue with Email"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
            By signing in, you agree to our <br className="sm:hidden" /><Link to="/terms-privacy" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">Terms of Service</Link> and <Link to="/terms-privacy?tab=privacy" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default LoginForm;
