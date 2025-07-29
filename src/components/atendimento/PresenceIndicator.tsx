import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle } from 'lucide-react';
import { usePresence } from '@/contexts/PresenceContext';

interface PresenceIndicatorProps {
  userId?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PresenceIndicator({ 
  userId, 
  showText = false, 
  size = 'md',
  className = '' 
}: PresenceIndicatorProps) {
  const { bidirecional } = usePresence();

  if (!bidirecional) {
    return null;
  }

  const { presenceSystem } = bidirecional;
  const isUserOnline = userId ? 
    presenceSystem.onlineUsers.some(user => user.userId === userId && user.status === 'online') :
    presenceSystem.isOnline;

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const indicatorSize = sizeClasses[size];
  const status = isUserOnline ? 'online' : 'offline';
  const statusColor = isUserOnline ? 'text-green-500' : 'text-gray-400';
  const statusText = isUserOnline ? 'Online' : 'Offline';

  if (showText) {
    return (
      <Badge 
        variant={isUserOnline ? 'default' : 'secondary'}
        className={`flex items-center gap-1 ${className}`}
      >
        <Circle className={`${indicatorSize} fill-current ${statusColor}`} />
        {statusText}
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Circle 
          className={`${indicatorSize} fill-current ${statusColor} ${className}`}
          data-status={status}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>{statusText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface PresenceCounterProps {
  className?: string;
}

export function PresenceCounter({ className = '' }: PresenceCounterProps) {
  const { bidirecional } = usePresence();

  if (!bidirecional) {
    return null;
  }

  const onlineCount = bidirecional.presenceSystem.getOnlineUsersCount();

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
      <Circle className="h-2 w-2 fill-current text-green-500" />
      {onlineCount} atendente{onlineCount !== 1 ? 's' : ''} online
    </Badge>
  );
}