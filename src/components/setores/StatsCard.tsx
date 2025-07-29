import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl shadow-amplie p-4 md:p-6 min-w-0">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-muted-foreground break-words">{title}</p>
          <p className="text-lg md:text-2xl font-bold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}