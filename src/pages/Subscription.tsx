import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CreditCard, 
  Calendar, 
  Settings, 
  RefreshCw,
  Crown,
  ExternalLink
} from "lucide-react";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

const Subscription = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: "Error",
          description: "Failed to fetch subscription status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await fetchSubscriptionStatus();
    toast({
      title: "Success",
      description: "Subscription status refreshed successfully.",
    });
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error accessing customer portal:', error);
        toast({
          title: "Error",
          description: "Failed to access subscription management. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open customer portal in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to access subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTierIcon = (tier: string | null) => {
    if (tier === 'Enterprise') return <Crown className="h-5 w-5 text-yellow-500" />;
    return <CreditCard className="h-5 w-5 text-primary" />;
  };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'Enterprise': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Professional': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Starter': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please log in to view your subscription details.
            </p>
            <Button asChild>
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Manage your Compliance Ease subscription and billing settings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              ) : subscriptionData?.subscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getTierIcon(subscriptionData.subscription_tier)}
                    <Badge className={getTierColor(subscriptionData.subscription_tier)}>
                      {subscriptionData.subscription_tier || 'Active'}
                    </Badge>
                  </div>
                  
                  {subscriptionData.subscription_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Renews on {formatDate(subscriptionData.subscription_end)}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-sm text-success font-medium">
                    ✓ Subscription Active
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge variant="outline">Free Trial</Badge>
                  <div className="text-sm text-muted-foreground">
                    You're currently on a free trial. Upgrade to unlock all features.
                  </div>
                  <Button asChild size="sm">
                    <a href="/#pricing">View Plans</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-foreground">Email</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              
              {profile?.company && (
                <div>
                  <div className="text-sm font-medium text-foreground">Company</div>
                  <div className="text-sm text-muted-foreground">{profile.company}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-foreground">Member Since</div>
                <div className="text-sm text-muted-foreground">
                  {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <Separator />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>

            {subscriptionData?.subscribed && (
              <Button 
                onClick={handleManageSubscription}
                disabled={isManaging}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {isManaging ? 'Opening...' : 'Manage Subscription'}
              </Button>
            )}
          </div>

          {subscriptionData?.subscribed && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">
                Subscription Management
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Use the "Manage Subscription" button to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Update your payment method</li>
                <li>• Change your subscription plan</li>
                <li>• Cancel your subscription</li>
                <li>• Download invoices</li>
                <li>• View billing history</li>
              </ul>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 pt-6 border-t">
          <Button variant="ghost" asChild>
            <a href="/">← Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;