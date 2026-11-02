import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { isAuthError } from '@/auth/authErrors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { signupEnabled } from '@/lib/features';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInValues = z.infer<typeof signInSchema>;

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const fromPath = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname;
  const redirectTo = fromPath ?? '/dashboard';

  const handleSubmit = async (values: SignInValues) => {
    setFormError(null);
    try {
      await login({ email: values.email, password: values.password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = isAuthError(error)
        ? error.message
        : 'Unable to sign in. Please try again.';
      setFormError(message);
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your account and continue your work.</CardDescription>
        </CardHeader>
        <CardContent>
          {fromPath && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>Sign in to access PDF tools.</AlertDescription>
            </Alert>
          )}

          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>

          {signupEnabled && (
            <p className="mt-6 text-center text-body-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default SignIn;
