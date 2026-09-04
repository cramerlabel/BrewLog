import { Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { recipesApi } from '@/features/recipes/api';
import { useDeleteRecipe, useRecipe } from '@/features/recipes/hooks';
import { ApiError } from '@/lib/api-client';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();

  if (isLoading) {
    return <Skeleton className="h-96 max-w-3xl rounded-lg" />;
  }
  if (!data) {
    return <p className="text-muted-foreground">Recipe not found.</p>;
  }

  const { recipe, ingredients, steps } = data;
  const canEdit = user?.role === 'admin' || user?.id === recipe.createdBy;

  const handleDelete = async () => {
    try {
      await deleteRecipe.mutateAsync(recipeId);
      toast.success('Recipe deleted');
      navigate('/recipes');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete recipe');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-3xl">
            {recipe.photoPath ? (
              <img src={recipesApi.photoUrl(recipe.id)} alt="" className="size-full object-cover" />
            ) : (
              <span>{recipe.type === 'beer' ? '🍺' : '🍷'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{recipe.name}</h1>
              <Badge variant="secondary" className="capitalize">
                {recipe.type}
              </Badge>
            </div>
            {recipe.style && <p className="text-muted-foreground">{recipe.style}</p>}
            <p className="text-sm text-muted-foreground">
              by {recipe.creator?.displayName ?? recipe.creator?.username ?? 'unknown'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/batches/new?recipeId=${recipe.id}`}>Start batch</Link>
          </Button>
          {canEdit && (
            <>
              <Button variant="outline" asChild>
                <Link to={`/recipes/${recipe.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes "{recipe.name}", its ingredients, and its steps. This cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {recipe.description && <p className="whitespace-pre-wrap">{recipe.description}</p>}

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {recipe.batchSize && (
          <span>
            Batch size: {recipe.batchSize} {recipe.batchSizeUnit}
          </span>
        )}
        {recipe.targetOg && <span>Target OG: {recipe.targetOg}</span>}
        {recipe.targetFg && <span>Target FG: {recipe.targetFg}</span>}
        {recipe.targetAbv && <span>Target ABV: {recipe.targetAbv}%</span>}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Ingredients</h2>
        {ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ingredients listed.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="capitalize">{ing.category}</TableCell>
                  <TableCell>{ing.name}</TableCell>
                  <TableCell>
                    {ing.amount ?? ''} {ing.unit ?? ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ing.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Steps</h2>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No steps listed.</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5">
            {steps.map((step) => (
              <li key={step.id}>{step.text}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
