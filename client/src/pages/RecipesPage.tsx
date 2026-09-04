import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recipesApi } from '@/features/recipes/api';
import { useRecipes } from '@/features/recipes/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

export function RecipesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'beer' | 'wine'>('all');

  const { data: recipes, isLoading, isError, error, refetch } = useRecipes({
    search: search || undefined,
    type: type === 'all' ? undefined : type,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Recipes</h1>
        <Button asChild>
          <Link to="/recipes/new">New recipe</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or style…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="beer">Beer</SelectItem>
            <SelectItem value="wine">Wine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Failed to load recipes.'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && recipes?.length === 0 && (
        <p className="text-muted-foreground">No recipes found. Create the first one!</p>
      )}

      {!isLoading && !isError && recipes && recipes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="flex gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-2xl">
                {recipe.photoPath ? (
                  <img src={recipesApi.photoUrl(recipe.id)} alt="" className="size-full object-cover" />
                ) : (
                  <span>{recipe.type === 'beer' ? '🍺' : '🍷'}</span>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{recipe.name}</span>
                  <Badge variant="secondary" className="capitalize">
                    {recipe.type}
                  </Badge>
                </div>
                {recipe.style && <p className="truncate text-sm text-muted-foreground">{recipe.style}</p>}
                <p className="truncate text-xs text-muted-foreground">
                  by {recipe.creatorDisplayName ?? recipe.creatorUsername}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

