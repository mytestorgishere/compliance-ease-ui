import { supabase } from "@/integrations/supabase/client";

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFileSize = async (file: File, userEmail?: string): Promise<ValidationResult> => {
  if (!userEmail) {
    // For non-authenticated users, default to 1MB limit (Starter tier)
    const maxSizeBytes = 1 * 1024 * 1024; // 1MB in bytes
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 1MB limit for free users. Please sign up for a subscription to upload larger files.`
      };
    }
    return { isValid: true };
  }

  try {
    // Get user's subscription info
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('subscription_tier')
      .eq('email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return {
        isValid: false,
        error: 'Unable to verify subscription status. Please try again.'
      };
    }

    // Determine file size limit based on subscription tier
    let maxSizeMB = 1; // Default to Starter tier
    if (subscriber?.subscription_tier) {
      switch (subscriber.subscription_tier.toLowerCase()) {
        case 'starter':
          maxSizeMB = 1;
          break;
        case 'professional':
          maxSizeMB = 2;
          break;
        case 'enterprise':
          maxSizeMB = 3;
          break;
        default:
          maxSizeMB = 1;
      }
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const tierName = subscriber?.subscription_tier || 'Free';
      
      return {
        isValid: false,
        error: `File size (${currentSizeMB}MB) exceeds the ${maxSizeMB}MB limit for ${tierName} tier. ${
          maxSizeMB < 3 ? 'Upgrade your subscription to upload larger files.' : ''
        }`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('File validation error:', error);
    return {
      isValid: false,
      error: 'Unable to validate file size. Please try again.'
    };
  }
};

export const getFileSizeLimit = async (userEmail?: string): Promise<number> => {
  if (!userEmail) {
    return 1; // 1MB for non-authenticated users
  }

  try {
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('subscription_tier')
      .eq('email', userEmail)
      .single();

    if (subscriber?.subscription_tier) {
      switch (subscriber.subscription_tier.toLowerCase()) {
        case 'starter':
          return 1;
        case 'professional':
          return 2;
        case 'enterprise':
          return 3;
        default:
          return 1;
      }
    }
    
    return 1; // Default to 1MB
  } catch (error) {
    console.error('Error getting file size limit:', error);
    return 1;
  }
};