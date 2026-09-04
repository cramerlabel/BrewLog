import { createBatchSchema, type CreateBatchInput } from '@brewlog/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBatch } from '@/features/batches/hooks';
import { useRecipes } from '@/features/recipes/hooks';
import { ApiError } from '@/lib/api-client';

type BatchFormValues = z.input<typeof createBatchSchema>;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewBatchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRecipeId = Number(searchParams.get('recipeId')) || undefined;
  const [mode, setMode] = useState<'recipe' | 'blank'>(initialRecipeId ? 'recipe' : 'blank');

  const { data: recipes } = useRecipes({});
  const createBatch = useCreateBatch();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BatchFormValues, unknown, CreateBatchInput>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      name: '',
      startDate: todayIsoDate(),
      recipeId: initialRecipeId,
      ingredients: [],
      steps: [],
    },
  });

  const ingredientsArray = useFieldArray({ control, name: 'ingredients' });
  const stepsArray = useFieldArray({ control, name: 'steps' });

  const onSubmit = async (values: CreateBatchInput) => {
    const payload: CreateBatchInput =
      mode === 'recipe'
        ? {
            recipeId: values.recipeId,
            name: values.name,
            startDate: values.startDate,
            notes: values.notes,
            ingredients: [],
            steps: [],
          }
        : {
            name: values.name,
            type: values.type,
            startDate: values.startDate,
            notes: values.notes,
            ingredients: values.ingredients,
            steps: values.steps,
          };

    try {
      const batch = await createBatch.mutateAsync(payload);
      toast.success(`Batch ${batch.batchNumber} created`);
      navigate(`/batches/${batch.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create batch');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New batch</h1>

      <div className="flex gap-2">
        <Button type="button" variant={mode === 'recipe' ? 'default' : 'outline'} onClick={() => setMode('recipe')}>
          Start from a recipe
        </Button>
        <Button type="button" variant={mode === 'blank' ? 'default' : 'outline'} onClick={() => setMode('blank')}>
          Blank batch
        </Button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Batch name</Label>
            <Input id="name" placeholder="e.g. IPA Batch #3" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {mode === 'recipe' ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="recipeId">Recipe</Label>
              <Controller
                control={control}
                name="recipeId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="recipeId" className="w-full">
                      <SelectValue placeholder="Select a recipe…" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes?.map((recipe) => (
                        <SelectItem key={recipe.id} value={String(recipe.id)}>
                          {recipe.name} ({recipe.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.recipeId && <p className="text-sm text-destructive">{errors.recipeId.message}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" {...register('startDate')} />
            {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
        </div>

        {mode === 'blank' && (
          <>
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
                      <Input placeholder="fruit, sugar, yeast…" {...register(`ingredients.${index}.category`)} />
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
          </>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={createBatch.isPending}>
            {createBatch.isPending ? 'Creating…' : 'Create batch'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
