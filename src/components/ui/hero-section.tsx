import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HeroSection() {
  const { t } = useTranslation();
  const { user, subscription, loading } = useAuth();

  // Check if user has active subscription
  const hasActiveSubscription = user && subscription?.subscribed;
  
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 text-sm font-medium">
            {hasActiveSubscription ? (
              <>
                <Crown className="w-3 h-3 mr-1 text-primary" />
                {subscription?.subscription_tier} Plan Active
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered Compliance Automation
              </>
            )}
          </Badge>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
            {hasActiveSubscription ? "Welcome back to Compliance Ease" : t('hero.title')}
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            {hasActiveSubscription 
              ? "Your compliance is running smoothly. Upload documents and generate reports with your active subscription."
              : t('hero.subtitle')
            }
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {hasActiveSubscription ? (
              <>
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-4">
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Link to="/subscription">Manage Subscription</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-4">
                  <Link to="/free-trial">
                    {t('hero.cta')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Link to="/demo">{t('hero.bookDemo')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-success" />
              <span className="text-sm">EU Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-success" />
              <span className="text-sm">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}