import { updateBatchSchema, type UpdateBatchInput } from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { STATUS_LABELS, STATUS_OPTIONS } from '@/features/batches/status';

type BatchEditFormValues = z.input<typeof updateBatchSchema>;

interface BatchEditFormProps {
  defaultValues: BatchEditFormValues;
  onSubmit: (values: UpdateBatchInput) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function BatchEditForm({ defaultValues, onSubmit, onCancel, isSubmitting }: BatchEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BatchEditFormValues, unknown, UpdateBatchInput>({
    resolver: zodResolver(updateBatchSchema),
    defaultValues,
  });

  const ingredientsArray = useFieldArray({ control, name: 'ingredients' });
  const stepsArray = useFieldArray({ control, name: 'steps' });

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Batch name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beer">Beer</SelectItem>
                  <SelectItem value="wine">Wine</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="finalYieldAmount">Final yield</Label>
          <div className="flex gap-2">
            <Input
              id="finalYieldAmount"
              type="number"
              step="any"
              {...register('finalYieldAmount', { valueAsNumber: true })}
            />
            <Input placeholder="gal" className="w-20" {...register('finalYieldUnit')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="finalAbv">Final ABV %</Label>
          <Input id="finalAbv" type="number" step="any" {...register('finalAbv', { valueAsNumber: true })} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} {...register('notes')} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ingredients</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => ingredientsArray.append({ category: '', name: '' })}
          >
            <Plus className="size-4" />
            Add ingredient
          </Button>
        </div>
        {ingredientsArray.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No ingredients yet.</p>
        )}
        <div className="space-y-3">
          {ingredientsArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-start gap-2 rounded-md border p-3">
              <div className="col-span-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Input {...register(`ingredients.${index}.category`)} />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input {...register(`ingredients.${index}.name`)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input
                  type="number"
                  step="any"
                  {...register(`ingredients.${index}.amount`, { valueAsNumber: true })}
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Input {...register(`ingredients.${index}.unit`)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input {...register(`ingredients.${index}.notes`)} />
              </div>
              <div className="col-span-1 flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => ingredientsArray.remove(index)}
                  aria-label="Remove ingredient"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Steps</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => stepsArray.append({ text: '', isDone: false })}>
            <Plus className="size-4" />
            Add step
          </Button>
        </div>
        {stepsArray.fields.length === 0 && <p className="text-sm text-muted-foreground">No steps yet.</p>}
        <div className="space-y-3">
          {stepsArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <Controller
                control={control}
                name={`steps.${index}.isDone`}
                render={({ field: checkboxField }) => (
                  <Checkbox
                    className="mt-2"
                    checked={checkboxField.value}
                    onCheckedChange={(checked) => checkboxField.onChange(checked === true)}
                    aria-label="Step complete"
                  />
                )}
              />
              <Textarea rows={2} className="flex-1" {...register(`steps.${index}.text`)} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => stepsArray.remove(index)}
                aria-label="Remove step"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
