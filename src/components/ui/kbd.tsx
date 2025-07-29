import React from 'react';
import { cn } from '@/lib/utils';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const Kbd: React.FC<KbdProps> = ({ children, className, ...props }) => {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center px-1.5 py-0.5 min-w-[1.5rem] h-6",
        "text-xs font-mono font-medium",
        "bg-muted border border-border rounded-sm",
        "text-muted-foreground",
        "shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
};