import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Success!",
        description: "Login functionality will be connected to backend.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <Shield className="h-8 w-8" />
            <span className="text-xl font-bold">ComplianceAI</span>
          </Link>
        </div>

        <Card className="backdrop-blur bg-card/80 border border-border/50 shadow-strong">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('login.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.email')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com"
                          {...field} 
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
                      <FormLabel>{t('common.password')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90" 
                  disabled={isLoading}
                >
                  {isLoading ? "..." : t('common.signIn')}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('login.noAccount')}{' '}
                <Link 
                  to="/signup" 
                  className="text-primary hover:underline font-medium"
                >
                  {t('login.signUpLink')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}