import type { RecipeInput } from '@brewlog/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RecipeForm } from '@/features/recipes/RecipeForm';
import { useCreateRecipe, useUploadRecipePhoto } from '@/features/recipes/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';

// Upload hooks need a recipe id, which doesn't exist until after creation - the mutation
// is created lazily below once the id is known, so this default id is never actually used.
function useLazyUploadRecipePhoto(id: number | null) {
  return useUploadRecipePhoto(id ?? -1);
}

export function NewRecipePage() {
  const navigate = useNavigate();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const createRecipe = useCreateRecipe();
  const [createdId, setCreatedId] = useState<number | null>(null);
  const uploadPhoto = useLazyUploadRecipePhoto(createdId);

  const handleSubmit = async (values: RecipeInput) => {
    try {
      const recipe = await createRecipe.mutateAsync(values);
      setCreatedId(recipe.id);
      if (photoFile) {
        await uploadPhoto.mutateAsync(photoFile);
      }
      toast.success('Recipe created');
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create recipe');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">New recipe</h1>

      <div className="space-y-1.5">
        <Label htmlFor="photo">Photo (optional)</Label>
        <Input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
      </div>

      <RecipeForm
        onSubmit={handleSubmit}
        isSubmitting={createRecipe.isPending || uploadPhoto.isPending}
        submitLabel="Create recipe"
      />

      <Button variant="ghost" onClick={() => navigate('/recipes')} type="button">
        Cancel
      </Button>
    </div>
  );
}
