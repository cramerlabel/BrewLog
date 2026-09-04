import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api-client';
import { CreateUserDialog } from './CreateUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { useUsers } from './hooks';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import type { AdminUser } from './types';

export function UsersManager() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateUserDialog />
      </div>

      {isLoading && <Skeleton className="h-48 rounded-lg" />}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Failed to load users.'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && users && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Display name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.username}
                    {u.id === currentUser?.id && (
                      <Badge variant="outline" className="ml-2">
                        you
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{u.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'secondary' : 'destructive'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingUser(u)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setResettingUser(u)}>
                      Reset password
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isSelf={editingUser.id === currentUser?.id}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}

      {resettingUser && (
        <ResetPasswordDialog
          user={resettingUser}
          open={!!resettingUser}
          onOpenChange={(open) => !open && setResettingUser(null)}
        />
      )}
    </div>
  );
}
