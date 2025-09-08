import { useTranslation } from "react-i18next";
import { Navigation } from "@/components/ui/navigation";
import { HeroSection } from "@/components/ui/hero-section";
import { FeaturesSection } from "@/components/ui/features-section";
import { DashboardPreview } from "@/components/ui/dashboard-preview";
import { PricingSection } from "@/components/ui/pricing-section";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { t } = useTranslation();
  const { user, subscription } = useAuth();
  
  // Check if user has active subscription
  const hasActiveSubscription = user && subscription?.subscribed;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      
      {/* Only show marketing sections if user doesn't have active subscription */}
      {!hasActiveSubscription && (
        <>
          <FeaturesSection />
          <DashboardPreview />
          <PricingSection />
        </>
      )}
      
      {/* Footer */}
      <footer className="bg-muted/30 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;