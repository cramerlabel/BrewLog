import { createActionSchema, type CreateActionInput } from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { useCreateAction } from './hooks';

type CreateActionFormValues = z.input<typeof createActionSchema>;

export function CreateActionDialog() {
  const [open, setOpen] = useState(false);
  const createAction = useCreateAction();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateActionFormValues, unknown, CreateActionInput>({
    resolver: zodResolver(createActionSchema),
    defaultValues: { name: '', description: '', applicableTo: 'both', sortOrder: 0 },
  });

  const onSubmit = (values: CreateActionInput) => {
    createAction.mutate(values, {
      onSuccess: () => {
        toast.success('Action created');
        reset();
        setOpen(false);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create action'),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>New action</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New action</DialogTitle>
          <DialogDescription>
            Actions appear in the batch log entry picker, filtered by which brew type they apply to.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="action-name">Name</Label>
            <Input id="action-name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="action-description">Description (optional)</Label>
            <Textarea id="action-description" rows={2} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="action-applicableTo">Applies to</Label>
              <Controller
                control={control}
                name="applicableTo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="action-applicableTo" className="w-full">
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
              <Label htmlFor="action-sortOrder">Sort order</Label>
              <Input id="action-sortOrder" type="number" {...register('sortOrder', { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createAction.isPending}>
              {createAction.isPending ? 'Creating…' : 'Create action'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
