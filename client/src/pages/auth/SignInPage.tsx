import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Instagram, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInForm) => {
      const response = await apiRequest("POST", "/api/auth/custom-login", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      // Invalidate auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect after a short delay to allow query to update
      setTimeout(() => {
        window.location.href = "/feed";
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  const onSubmit = (data: SignInForm) => {
    signInMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Instagram className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          className="h-11"
                        />
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
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3"
                  size="lg"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              onClick={handleReplitAuth}
              variant="outline"
              className="w-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              size="lg"
            >
              Continue with Replit
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup">
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium text-purple-600 hover:text-purple-700"
              >
                Create an account
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}