import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title = "Super Admin", description = "Painel administrativo da plataforma" }: AdminLayoutProps) {
  const { user } = useAuth();
  const { adminLogout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 animate-gradient-shift">
      {/* Header com espaçamento e cantos arredondados */}
      <div className="p-6">
        <header className="relative overflow-hidden bg-primary rounded-2xl shadow-lg border border-border/10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary backdrop-blur-xl"></div>
          <div className="relative px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-background/95 dark:bg-background/95 p-3 rounded-full shadow-lg animate-float-gentle border border-primary/20">
                    <img 
                      src="/lovable-uploads/eddc7fb8-220e-433f-89b2-915fbe2e2daf.png"
                      alt="Amplie Icon" 
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/lovable-uploads/8ed7aa80-8a43-4375-a757-0f7dd486297f.png" 
                      alt="Amplie Chat Logo" 
                      className="h-7 object-contain filter brightness-0 invert"
                    />
                    <span className="text-xl font-bold text-primary-foreground tracking-tight">{title}</span>
                  </div>
                  <p className="text-primary-foreground/80 text-sm font-medium">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={adminLogout}
                  className="bg-background/10 text-primary-foreground border-primary-foreground/20 hover:bg-background/20 hover:border-primary-foreground/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair do Admin
                </Button>
                <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/20">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <span className="text-sm text-primary-foreground font-medium">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="px-6 pb-8 space-y-8">
        <div className="animate-scale-in-smooth">
          {children}
        </div>
      </div>
    </div>
  );
}