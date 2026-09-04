import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api-client';
import type { ActionItem } from './api';
import { CreateActionDialog } from './CreateActionDialog';
import { EditActionDialog } from './EditActionDialog';
import { useActions } from './hooks';

export function ActionsManager() {
  const { data: actions, isLoading, isError, error, refetch } = useActions();
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);

  const sorted = actions ? [...actions].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateActionDialog />
      </div>

      {isLoading && <Skeleton className="h-48 rounded-lg" />}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Failed to load actions.'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && sorted.length === 0 && <p className="text-muted-foreground">No actions defined yet.</p>}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground">{a.sortOrder}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {a.applicableTo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.isActive ? 'secondary' : 'destructive'}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingAction(a)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingAction && (
        <EditActionDialog
          action={editingAction}
          open={!!editingAction}
          onOpenChange={(open) => !open && setEditingAction(null)}
        />
      )}
    </div>
  );
}
