import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, CreditCard } from "lucide-react";
import complyLogo from "@/assets/comply-logo.png";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={complyLogo} alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Compliance Ease</span>
          </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.features')}
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.pricing')}
              </a>
              {user ? (
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
                  Demo
                </Link>
              )}
              <LanguageSelector />
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      {profile?.first_name || user.email?.split('@')[0] || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                       <Link to="/dashboard">
                         <User className="h-4 w-4" />
                         Dashboard
                       </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                       <Link to="/subscription">
                         <CreditCard className="h-4 w-4" />
                         My Subscription
                       </Link>
                     </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      {t('common.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/login">{t('common.signIn')}</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90">
                    <Link to="/free-trial">{t('common.getStarted')}</Link>
                  </Button>
                </>
              )}
            </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                {t('navigation.features')}
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                {t('navigation.pricing')}
              </a>
              {user ? (
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Dashboard
                </Link>
              ) : (
                <Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Demo
                </Link>
              )}
              <div className="py-2">
                <LanguageSelector />
              </div>
              
              {user ? (
                <div className="flex flex-col space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 py-2 text-foreground">
                    <User className="h-4 w-4" />
                    <span>{profile?.first_name || user.email?.split('@')[0] || 'User'}</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to="/dashboard">
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to="/subscription">
                      <CreditCard className="h-4 w-4" />
                      My Subscription
                    </Link>
                  </Button>
                  <Button onClick={handleSignOut} variant="outline" size="sm" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    {t('common.signOut')}
                  </Button>
                </div>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link to="/login">{t('common.signIn')}</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-gradient-primary hover:opacity-90">
                    <Link to="/free-trial">{t('common.getStarted')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}