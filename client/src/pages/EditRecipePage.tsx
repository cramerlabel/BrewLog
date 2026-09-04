import type { RecipeInput } from '@brewlog/shared';
import { Trash2 } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { recipesApi } from '@/features/recipes/api';
import { RecipeForm } from '@/features/recipes/RecipeForm';
import { useDeleteRecipePhoto, useRecipe, useUpdateRecipe, useUploadRecipePhoto } from '@/features/recipes/hooks';
import { ApiError } from '@/lib/api-client';

export function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useRecipe(recipeId);
  const updateRecipe = useUpdateRecipe(recipeId);
  const uploadPhoto = useUploadRecipePhoto(recipeId);
  const deletePhoto = useDeleteRecipePhoto(recipeId);

  if (isLoading) {
    return <Skeleton className="h-96 max-w-3xl rounded-lg" />;
  }
  if (isError) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : 'Failed to load this recipe.'}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) {
    return <p className="text-muted-foreground">Recipe not found.</p>;
  }

  const canEdit = user?.role === 'admin' || user?.id === data.recipe.createdBy;
  if (!canEdit) {
    return <Navigate to={`/recipes/${recipeId}`} replace />;
  }

  const defaultValues: Partial<RecipeInput> = {
    name: data.recipe.name,
    type: data.recipe.type,
    style: data.recipe.style ?? undefined,
    description: data.recipe.description ?? undefined,
    batchSize: data.recipe.batchSize ?? undefined,
    batchSizeUnit: data.recipe.batchSizeUnit ?? undefined,
    targetOg: data.recipe.targetOg ?? undefined,
    targetFg: data.recipe.targetFg ?? undefined,
    targetAbv: data.recipe.targetAbv ?? undefined,
    ingredients: data.ingredients.map((ing) => ({
      id: ing.id,
      category: ing.category,
      name: ing.name,
      amount: ing.amount ?? undefined,
      unit: ing.unit ?? undefined,
      notes: ing.notes ?? undefined,
    })),
    steps: data.steps.map((step) => ({ id: step.id, text: step.text })),
  };

  const handleSubmit = async (values: RecipeInput) => {
    try {
      await updateRecipe.mutateAsync(values);
      toast.success('Recipe updated');
      navigate(`/recipes/${recipeId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update recipe');
    }
  };

  const handlePhotoChange = async (file: File | null) => {
    if (!file) return;
    try {
      await uploadPhoto.mutateAsync(file);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to upload photo');
    }
  };

  const handlePhotoRemove = async () => {
    try {
      await deletePhoto.mutateAsync();
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove photo');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit recipe</h1>

      <div className="flex items-center gap-4">
        {data.recipe.photoPath && (
          <img
            src={recipesApi.photoUrl(recipeId)}
            alt=""
            className="size-20 rounded-md object-cover"
          />
        )}
        <div className="space-y-1.5">
          <Label htmlFor="photo">Photo</Label>
          <div className="flex items-center gap-2">
            <Input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
            {data.recipe.photoPath && (
              <Button type="button" variant="ghost" size="icon" onClick={handlePhotoRemove} aria-label="Remove photo">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <RecipeForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateRecipe.isPending}
        submitLabel="Save changes"
      />

      <Button variant="ghost" type="button" onClick={() => navigate(`/recipes/${recipeId}`)}>
        Cancel
      </Button>
    </div>
  );
}
