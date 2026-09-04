import { updateActionSchema, type UpdateActionInput } from '@brewlog/shared';
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
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import type { ActionItem } from './api';
import { useUpdateAction } from './hooks';

type EditActionFormValues = z.input<typeof updateActionSchema>;

interface EditActionDialogProps {
  action: ActionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditActionDialog({ action, open, onOpenChange }: EditActionDialogProps) {
  const updateAction = useUpdateAction(action.id);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditActionFormValues, unknown, UpdateActionInput>({
    resolver: zodResolver(updateActionSchema),
    values: {
      name: action.name,
      description: action.description ?? '',
      applicableTo: action.applicableTo,
      isActive: action.isActive,
      sortOrder: action.sortOrder,
    },
  });

  const onSubmit = (values: UpdateActionInput) => {
    updateAction.mutate(values, {
      onSuccess: () => {
        toast.success('Action updated');
        onOpenChange(false);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to update action'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {action.name}</DialogTitle>
          <DialogDescription>
            Actions appear in the batch log entry picker, filtered by which brew type they apply to.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="edit-action-name">Name</Label>
            <Input id="edit-action-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-action-description">Description (optional)</Label>
            <Textarea id="edit-action-description" rows={2} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-action-applicableTo">Applies to</Label>
              <Controller
                control={control}
                name="applicableTo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-action-applicableTo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-action-sortOrder">Sort order</Label>
              <Input
                id="edit-action-sortOrder"
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-action-isActive">Active</Label>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch id="edit-action-isActive" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateAction.isPending}>
              {updateAction.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
