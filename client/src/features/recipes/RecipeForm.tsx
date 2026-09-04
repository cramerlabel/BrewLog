import { recipeInputSchema, type RecipeInput } from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// The schema's `.default([])` on ingredients/steps makes RHF's input type (pre-validation form
// state) differ from its output type (post-validation submit values) - track both explicitly.
type RecipeFormValues = z.input<typeof recipeInputSchema>;

const emptyDefaults: RecipeFormValues = {
  name: '',
  type: 'beer',
  ingredients: [],
  steps: [],
};

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormValues>;
  onSubmit: (values: RecipeInput) => Promise<void> | void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function RecipeForm({ defaultValues, onSubmit, isSubmitting, submitLabel }: RecipeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecipeFormValues, unknown, RecipeInput>({
    resolver: zodResolver(recipeInputSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  const ingredientsArray = useFieldArray({ control, name: 'ingredients' });
  const stepsArray = useFieldArray({ control, name: 'steps' });

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
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
            <Label htmlFor="style">Style</Label>
            <Input id="style" placeholder="e.g. American IPA, Dry Mead" {...register('style')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batchSize">Batch size</Label>
            <div className="flex gap-2">
              <Input id="batchSize" type="number" step="any" {...register('batchSize', { valueAsNumber: true })} />
              <Input placeholder="gal" className="w-24" {...register('batchSizeUnit')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetOg">Target OG</Label>
            <Input id="targetOg" type="number" step="any" {...register('targetOg', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetFg">Target FG</Label>
            <Input id="targetFg" type="number" step="any" {...register('targetFg', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetAbv">Target ABV %</Label>
            <Input id="targetAbv" type="number" step="any" {...register('targetAbv', { valueAsNumber: true })} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
          </div>
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
            <div key={field.id} className="grid grid-cols-2 items-start gap-2 rounded-md border p-3 sm:grid-cols-12">
              <div className="col-span-2 space-y-1 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Input placeholder="grain, hop, yeast…" {...register(`ingredients.${index}.category`)} />
              </div>
              <div className="col-span-2 space-y-1 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input {...register(`ingredients.${index}.name`)} />
              </div>
              <div className="col-span-1 space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input
                  type="number"
                  step="any"
                  {...register(`ingredients.${index}.amount`, { valueAsNumber: true })}
                />
              </div>
              <div className="col-span-1 space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Input {...register(`ingredients.${index}.unit`)} />
              </div>
              <div className="col-span-2 space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input {...register(`ingredients.${index}.notes`)} />
              </div>
              <div className="col-span-2 flex items-end justify-end sm:col-span-1">
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
              {errors.ingredients?.[index]?.category && (
                <p className="col-span-2 text-sm text-destructive sm:col-span-12">
                  {errors.ingredients[index]?.category?.message}
                </p>
              )}
              {errors.ingredients?.[index]?.name && (
                <p className="col-span-2 text-sm text-destructive sm:col-span-12">{errors.ingredients[index]?.name?.message}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Steps</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => stepsArray.append({ text: '' })}>
            <Plus className="size-4" />
            Add step
          </Button>
        </div>

        {stepsArray.fields.length === 0 && <p className="text-sm text-muted-foreground">No steps yet.</p>}

        <div className="space-y-3">
          {stepsArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <span className="mt-2 w-6 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
              <div className="flex-1 space-y-1">
                <Textarea rows={2} {...register(`steps.${index}.text`)} />
                {errors.steps?.[index]?.text && (
                  <p className="text-sm text-destructive">{errors.steps[index]?.text?.message}</p>
                )}
              </div>
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
