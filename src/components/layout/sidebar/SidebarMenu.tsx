
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Grid2X2, Settings, Building2, Bot, MessageCircle, UserCheck, BarChart3, FileText, Zap, Activity, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-blue-400'
  },
  {
    title: 'Kanban',
    icon: Grid2X2,
    href: '/kanban',
    color: 'text-orange-400'
  },
  {
    title: 'Atendimento',
    icon: MessageSquare,
    href: '/atendimento',
    color: 'text-purple-400'
  },
  {
    title: 'Contatos',
    icon: UserCheck,
    href: '/contatos',
    color: 'text-emerald-400'
  },
  {
    title: 'Chat Interno',
    icon: MessageCircle,
    href: '/chat-interno',
    color: 'text-cyan-400'
  },
  {
    title: 'ChatBot',
    icon: Bot,
    href: '/chatbot',
    color: 'text-indigo-400'
  },
  {
    title: 'Setores',
    icon: Building2,
    href: '/setores',
    color: 'text-teal-400'
  },
  {
    title: 'Usuários',
    icon: Users,
    href: '/usuarios',
    color: 'text-green-400'
  },
  {
    title: 'Painel',
    icon: Settings,
    href: '/painel',
    color: 'text-red-400'
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    color: 'text-blue-500'
  },
  {
    title: 'Templates',
    icon: FileText,
    href: '/templates',
    color: 'text-pink-400'
  },
  {
    title: 'Automation',
    icon: Zap,
    href: '/automation-builder',
    color: 'text-yellow-400'
  },
  {
    title: 'Monitor',
    icon: Activity,
    href: '/system-monitor',
    color: 'text-lime-400'
  },
  {
    title: 'Webhooks',
    icon: Webhook,
    href: '/webhooks',
    color: 'text-violet-400'
  }
];

interface SidebarMenuProps {
  isCollapsed: boolean;
  onLinkClick: () => void;
}

export function SidebarMenu({ isCollapsed, onLinkClick }: SidebarMenuProps) {
  const location = useLocation();

  return (
    <ScrollArea className="flex-1 px-2 sm:px-3 py-4 sm:py-6" style={{
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    }}>
      <nav className="space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              to={item.href} 
              onClick={onLinkClick} 
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group touch-manipulation active:scale-95",
                isCollapsed ? "justify-center px-0 py-3 w-full" : "space-x-3 px-3 py-3",
                isActive 
                  ? isCollapsed 
                    ? "bg-amplie-sidebar-active text-white shadow-lg w-full" 
                    : "bg-amplie-sidebar-active text-white shadow-lg"
                  : "text-gray-300 hover:bg-amplie-sidebar-hover hover:text-white"
              )} 
              style={{ touchAction: 'manipulation' }}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isCollapsed && isActive 
                  ? "bg-transparent" 
                  : isActive 
                    ? "bg-white/20" 
                    : "bg-gray-700/30 group-hover:bg-gray-600/50"
              )}>
                <Icon className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5",
                  isActive ? "text-white" : item.color
                )} />
              </div>
              {!isCollapsed && (
                <span className="font-medium text-sm truncate">
                  {item.title}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
