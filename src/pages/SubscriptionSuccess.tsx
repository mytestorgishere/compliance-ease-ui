import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refreshProfile } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      if (sessionId) {
        try {
          // Call check-subscription to update user's subscription status
          await supabase.functions.invoke('check-subscription');
          // Refresh the user profile to get updated subscription info
          await refreshProfile();
        } catch (error) {
          console.error("Error verifying subscription:", error);
        }
      }
      setIsVerifying(false);
    };

    verifySubscription();
  }, [sessionId, refreshProfile]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            Subscription Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for subscribing to Compliance Ease. Your subscription is now active.
          </p>
          
          {isVerifying && (
            <p className="text-sm text-muted-foreground">
              Verifying your subscription...
            </p>
          )}
          
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link to="/demo">
                Start Using Compliance Ease
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;