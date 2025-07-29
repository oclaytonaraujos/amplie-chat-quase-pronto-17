import React, { useEffect, useCallback, useState, createContext, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Kbd } from '@/components/ui/kbd';
import { Keyboard, Search, MessageSquare, Users, Settings, Home } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'system';
  global?: boolean;
}

interface ShortcutContextType {
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (key: string) => void;
  showHelp: () => void;
}

const ShortcutContext = createContext<ShortcutContextType | null>(null);

// Componente Kbd para exibir teclas
const ShortcutKbd: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  const keys = shortcut.split('+').map(key => key.trim());
  
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="text-muted-foreground text-xs">+</span>}
          <Kbd>{key}</Kbd>
        </React.Fragment>
      ))}
    </div>
  );
};

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<Map<string, Shortcut>>(new Map());
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts(prev => new Map(prev).set(shortcut.key, shortcut));
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const showHelp = useCallback(() => {
    setShowHelpDialog(true);
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      const key = [
        event.ctrlKey && 'ctrl',
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        event.metaKey && 'meta',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');

      const shortcut = shortcuts.get(key);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }

      // Help dialog shortcut
      if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault();
        setShowHelpDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  // Register default shortcuts
  useEffect(() => {
    const defaultShortcuts: Shortcut[] = [
      {
        key: 'ctrl+/',
        description: 'Busca universal',
        action: () => {
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          searchInput?.focus();
        },
        category: 'navigation',
        global: true,
      },
      {
        key: 'ctrl+shift+h',
        description: 'Ir para Dashboard',
        action: () => window.location.href = '/dashboard',
        category: 'navigation',
        global: true,
      },
      {
        key: 'ctrl+shift+a',
        description: 'Ir para Atendimento',
        action: () => window.location.href = '/atendimento',
        category: 'navigation',
        global: true,
      },
      {
        key: 'ctrl+shift+c',
        description: 'Ir para Contatos',
        action: () => window.location.href = '/contatos',
        category: 'navigation',
        global: true,
      },
      {
        key: 'ctrl+shift+m',
        description: 'Ir para Chat Interno',
        action: () => window.location.href = '/chat-interno',
        category: 'navigation',
        global: true,
      },
      {
        key: 'ctrl+shift+s',
        description: 'Ir para Configurações',
        action: () => window.location.href = '/configuracoes/gerais',
        category: 'navigation',
        global: true,
      },
      {
        key: 'escape',
        description: 'Fechar modal/dialog',
        action: () => {
          const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
          closeButton?.click();
        },
        category: 'system',
        global: true,
      },
      {
        key: 'ctrl+k',
        description: 'Comando rápido',
        action: () => {
          // Implementar command palette quando necessário
          console.log('Command palette triggered');
        },
        category: 'system',
        global: true,
      },
    ];

    defaultShortcuts.forEach(registerShortcut);

    return () => {
      defaultShortcuts.forEach(shortcut => unregisterShortcut(shortcut.key));
    };
  }, [registerShortcut, unregisterShortcut]);

  const groupedShortcuts = Array.from(shortcuts.values()).reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return <Home className="w-4 h-4" />;
      case 'actions': return <MessageSquare className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Keyboard className="w-4 h-4" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'navigation': return 'Navegação';
      case 'actions': return 'Ações';
      case 'system': return 'Sistema';
      default: return category;
    }
  };

  return (
    <ShortcutContext.Provider value={{ registerShortcut, unregisterShortcut, showHelp }}>
      {children}
      
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Atalhos de Teclado
            </DialogTitle>
            <DialogDescription>
              Use estes atalhos para navegar mais rapidamente pelo sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryTitle(category)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <ShortcutKbd shortcut={shortcut.key} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              Pressione <Kbd>Ctrl</Kbd> + <Kbd>?</Kbd> a qualquer momento para ver esta ajuda
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ShortcutContext.Provider>
  );
};

// Hook para usar shortcuts
export const useShortcut = (shortcut: Omit<Shortcut, 'key'> & { key: string }) => {
  const context = useContext(ShortcutContext);
  
  useEffect(() => {
    if (!context) return;
    
    context.registerShortcut(shortcut);
    
    return () => {
      context.unregisterShortcut(shortcut.key);
    };
  }, [context, shortcut]);
};

// Hook para mostrar ajuda
export const useShortcutHelp = () => {
  const context = useContext(ShortcutContext);
  return context?.showHelp;
};

// Componente para exibir atalho inline
export const ShortcutHint: React.FC<{ 
  shortcut: string; 
  description?: string;
  className?: string;
}> = ({ shortcut, description, className }) => {
  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      {description && <span>{description}</span>}
      <ShortcutKbd shortcut={shortcut} />
    </div>
  );
};