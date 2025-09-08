import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Zap, Building, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";  
import { Textarea } from "@/components/ui/textarea";

interface SubscriptionTier {
  id: string;
  tier_name: string;
  monthly_price: number;
  yearly_price: number;
  file_upload_limit: number;
  features: string[];
}

export function PricingSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    requirements: ''
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  useEffect(() => {
    const fetchSubscriptionTiers = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_tiers')
          .select('*')
          .order('monthly_price', { ascending: true });

        if (error) throw error;

        const transformedTiers = data?.map(tier => ({
          ...tier,
          features: Array.isArray(tier.features) 
            ? tier.features.filter((f: any) => typeof f === 'string') as string[]
            : []
        })) || [];

        setSubscriptionTiers(transformedTiers);
      } catch (error) {
        console.error('Error fetching subscription tiers:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription plans. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionTiers();
  }, []);

  const getIconForTier = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'starter': return Zap;
      case 'professional': return Building;
      case 'enterprise': return Briefcase;
      default: return Zap;
    }
  };

  const getTierDescription = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'starter': return "Perfect for small businesses starting their compliance journey";
      case 'professional': return "Comprehensive compliance solution for growing businesses";
      case 'enterprise': return "Enterprise-grade compliance for large organizations";
      default: return "Compliance solution for your business";
    }
  };

  const formatFileUploadLimit = (limit: number) => {
    if (limit >= 100000) return `${(limit / 1000).toLocaleString()}K`;
    if (limit >= 1000) return `${(limit / 1000).toLocaleString()}K`;
    return limit.toLocaleString();
  };

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: tier,
          yearly: isYearly
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContactSales = async () => {
    if (!contactForm.firstName || !contactForm.lastName || !contactForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least your name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingContact(true);
    try {
      const { error } = await supabase.functions.invoke('send-sales-email', {
        body: {
          contactType: 'sales',
          firstName: contactForm.firstName,
          lastName: contactForm.lastName,
          email: contactForm.email,
          company: contactForm.company,
          phone: contactForm.phone,
          requirements: contactForm.requirements,
        }
      });

      if (error) throw error;

      setShowContactForm(false);
      setContactForm({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        phone: '',
        requirements: ''
      });

      toast({
        title: "Contact Request Sent",
        description: "Our sales team will get back to you within 24 hours.",
      });
    } catch (error: any) {
      console.error('Contact sales error:', error);
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send contact request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };
  
  if (loading) {
    return (
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">Loading subscription plans...</div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('pricing.subtitle')}
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('pricing.monthly')}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('pricing.yearly')}
            </Label>
            {isYearly && (
              <Badge variant="secondary" className="ml-2 bg-success/20 text-success">
                {t('pricing.save')}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionTiers.map((tier, index) => {
            const IconComponent = getIconForTier(tier.tier_name);
            const isPopular = tier.tier_name.toLowerCase() === 'professional';
            const monthlyPrice = tier.monthly_price / 100; // Convert from cents
            const yearlyPrice = tier.yearly_price / 100; // Convert from cents
            
            return (
              <Card 
                key={tier.id} 
                className={`relative p-8 bg-gradient-card border-border shadow-soft hover:shadow-medium transition-all duration-300 ${
                  isPopular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 capitalize">{tier.tier_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{getTierDescription(tier.tier_name)}</p>
                   <div className="flex items-baseline justify-center">
                     <span className="text-3xl font-bold text-foreground">
                       €{isYearly ? Math.round(yearlyPrice).toLocaleString() : Math.round(monthlyPrice).toLocaleString()}
                     </span>
                     <span className="text-muted-foreground ml-1">
                       /{isYearly ? 'year' : 'month'}
                     </span>
                   </div>
                   {isYearly && (
                     <p className="text-xs text-success mt-1">
                       Save €{Math.round((monthlyPrice * 12) - yearlyPrice).toLocaleString()}/year
                     </p>
                   )}
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {formatFileUploadLimit(tier.file_upload_limit)} file uploads
                    </Badge>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    isPopular 
                      ? 'bg-gradient-primary hover:opacity-90' 
                      : 'bg-background hover:bg-muted border border-border'
                  }`}
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier.tier_name)}
                >
                  {user ? 'Subscribe Now' : 'Sign Up to Subscribe'}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {t('pricing.customSolution')}
          </p>
          <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                {t('pricing.contactSales')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Contact Sales</DialogTitle>
                <DialogDescription>
                  Get in touch with our sales team for custom pricing and enterprise solutions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={contactForm.firstName}
                      onChange={(e) => setContactForm({...contactForm, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={contactForm.lastName}
                      onChange={(e) => setContactForm({...contactForm, lastName: e.target.value})}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="requirements">Requirements (Optional)</Label>
                  <Textarea
                    id="requirements"
                    value={contactForm.requirements}
                    onChange={(e) => setContactForm({...contactForm, requirements: e.target.value})}
                    placeholder="Tell us about your compliance needs..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowContactForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleContactSales} disabled={isSubmittingContact} className="flex-1">
                  {isSubmittingContact ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Request'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}