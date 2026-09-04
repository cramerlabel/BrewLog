import type { RecipeInput } from '@brewlog/shared';
import { api } from '@/lib/api-client';
import type { RecipeDetail, RecipeFilters, RecipeIngredient, RecipeStep, RecipeSummary } from './types';

function buildQuery(filters: RecipeFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const recipesApi = {
  list: (filters: RecipeFilters = {}) =>
    api.get<{ recipes: RecipeSummary[] }>(`/recipes${buildQuery(filters)}`).then((d) => d.recipes),

  get: (id: number) =>
    api.get<{ recipe: RecipeDetail; ingredients: RecipeIngredient[]; steps: RecipeStep[] }>(`/recipes/${id}`),

  create: (input: RecipeInput) => api.post<{ recipe: RecipeDetail }>('/recipes', input).then((d) => d.recipe),

  update: (id: number, input: RecipeInput) =>
    api.patch<{ recipe: RecipeDetail }>(`/recipes/${id}`, input).then((d) => d.recipe),

  remove: (id: number) => api.delete(`/recipes/${id}`),

  uploadPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.postForm<{ recipe: RecipeDetail }>(`/recipes/${id}/photo`, formData).then((d) => d.recipe);
  },

  deletePhoto: (id: number) => api.delete<{ recipe: RecipeDetail }>(`/recipes/${id}/photo`).then((d) => d.recipe),

  photoUrl: (id: number) => `/api/recipes/${id}/photo`,
};
