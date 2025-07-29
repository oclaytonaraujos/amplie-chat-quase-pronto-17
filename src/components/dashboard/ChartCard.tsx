
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  icon,
  iconColor,
  children,
  className
}: ChartCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl shadow-amplie p-4 md:p-6 hover:shadow-amplie-hover transition-all duration-300 animate-fade-in",
      className
    )}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
        <div className={cn(
          "p-2 rounded-lg",
          iconColor
        )}>
          {icon}
        </div>
      </div>
      <div className="h-48 md:h-64">
        {children}
      </div>
    </div>
  );
}
