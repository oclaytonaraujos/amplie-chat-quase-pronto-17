import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateCardProps {
  title?: string;
  rows?: number;
}

export function LoadingStateCard({ title, rows = 5 }: LoadingStateCardProps) {
  return (
    <Card>
      <CardHeader>
        {title && <Skeleton className="h-6 w-48" />}
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}