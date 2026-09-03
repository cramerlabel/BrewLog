import {
  changeOwnPasswordSchema,
  updateOwnProfileSchema,
  type ChangeOwnPasswordInput,
  type UpdateOwnProfileInput,
} from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth, type CurrentUser } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api-client';

export function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileForm = useForm<UpdateOwnProfileInput>({
    resolver: zodResolver(updateOwnProfileSchema),
    defaultValues: { displayName: user?.displayName ?? '' },
  });

  const passwordForm = useForm<ChangeOwnPasswordInput>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const updateProfile = useMutation({
    mutationFn: (input: UpdateOwnProfileInput) => api.patch<{ user: CurrentUser }>('/auth/me', input),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      toast.success('Display name updated');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update profile'),
  });

  const changePassword = useMutation({
    mutationFn: (input: ChangeOwnPasswordInput) => api.post('/auth/change-password', input),
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to change password'),
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Signed in as {user?.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" {...profileForm.register('displayName')} />
              {profileForm.formState.errors.displayName && (
                <p className="text-sm text-destructive">
                  {profileForm.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Choose a new password of at least 10 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))}
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
