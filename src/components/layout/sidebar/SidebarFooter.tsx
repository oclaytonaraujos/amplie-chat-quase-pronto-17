
import { Users } from 'lucide-react';

interface SidebarFooterProps {
  isCollapsed: boolean;
}

export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  return (
    <div className="p-3 sm:p-4 border-t border-gray-700/30 flex-shrink-0">
      {!isCollapsed ? (
        <div className="flex items-center space-x-3 text-gray-400 text-sm">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium text-xs sm:text-sm truncate">Admin User</p>
            <p className="text-xs truncate">Administrador</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}
