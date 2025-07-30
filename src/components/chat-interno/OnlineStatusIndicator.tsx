import React from 'react';
import { cn } from '@/lib/utils';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineStatusIndicator({ isOnline, className }: OnlineStatusIndicatorProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div 
        className={cn(
          "w-2 h-2 rounded-full mr-2",
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className={cn(
        "text-xs",
        isOnline ? "text-green-600" : "text-gray-500"
      )}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}