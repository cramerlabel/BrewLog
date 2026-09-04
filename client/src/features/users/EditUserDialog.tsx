import { updateUserSchema, type UpdateUserInput } from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api-client';
import { useUpdateUser } from './hooks';
import type { AdminUser } from './types';

type EditUserFormValues = z.input<typeof updateUserSchema>;

interface EditUserDialogProps {
  user: AdminUser;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, isSelf, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateUser(user.id);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditUserFormValues, unknown, UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    values: {
      displayName: user.displayName,
      email: user.email ?? '',
      role: user.role,
      isActive: user.isActive,
    },
  });

  const onSubmit = (values: UpdateUserInput) => {
    updateUser.mutate(values, {
      onSuccess: () => {
        toast.success('User updated');
        onOpenChange(false);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update user'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.username}</DialogTitle>
          <DialogDescription>
            {isSelf ? "You can't change your own role or active status." : 'Update role, status, or profile.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="edit-displayName">Display name</Label>
            <Input id="edit-displayName" {...register('displayName')} />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                  <SelectTrigger id="edit-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-isActive">Active</Label>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="edit-isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSelf}
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
