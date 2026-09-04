import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

// Shared "something went wrong" panel for query failures - distinct from empty-data and
// loading-skeleton states so users can tell a broken request apart from "there's nothing here yet".
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm"
    >
      <div className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {title}
      </div>
      {message && <p className="text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
