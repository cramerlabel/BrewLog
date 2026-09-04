import { batchLogEntryInputSchema, type BatchLogEntryInput, type BrewType } from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActions } from '@/features/actions/hooks';

type LogEntryFormValues = z.input<typeof batchLogEntryInputSchema>;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface LogEntryFormProps {
  batchType: BrewType;
  defaultValues?: Partial<LogEntryFormValues>;
  onSubmit: (values: BatchLogEntryInput) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function LogEntryForm({
  batchType,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: LogEntryFormProps) {
  const { data: actions } = useActions();
  const applicableActions = actions?.filter((a) => a.isActive && (a.applicableTo === 'both' || a.applicableTo === batchType));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LogEntryFormValues, unknown, BatchLogEntryInput>({
    resolver: zodResolver(batchLogEntryInputSchema),
    defaultValues: { entryDate: todayIsoDate(), ...defaultValues },
  });

  return (
    <form className="space-y-4 rounded-md border bg-muted/30 p-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="entryDate">Date</Label>
          <Input id="entryDate" type="date" {...register('entryDate')} />
          {errors.entryDate && <p className="text-sm text-destructive">{errors.entryDate.message}</p>}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="actionId">Action</Label>
          <Controller
            control={control}
            name="actionId"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : 'none'}
                onValueChange={(v) => field.onChange(v === 'none' ? undefined : Number(v))}
              >
                <SelectTrigger id="actionId" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {applicableActions?.map((action) => (
                    <SelectItem key={action.id} value={String(action.id)}>
                      {action.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="og">OG</Label>
          <Input id="og" type="number" step="any" {...register('og', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fg">FG</Label>
          <Input id="fg" type="number" step="any" {...register('fg', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brix">Brix</Label>
          <Input id="brix" type="number" step="any" {...register('brix', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sg">SG</Label>
          <Input id="sg" type="number" step="any" {...register('sg', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ph">pH</Label>
          <Input id="ph" type="number" step="any" {...register('ph', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temperature">Temperature</Label>
          <div className="flex gap-2">
            <Input id="temperature" type="number" step="any" {...register('temperature', { valueAsNumber: true })} />
            <Input placeholder="°F" className="w-16" {...register('temperatureUnit')} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} placeholder="What did you do? Any observations?" {...register('notes')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
