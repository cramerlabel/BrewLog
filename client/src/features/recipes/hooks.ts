import type { RecipeInput } from '@brewlog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipesApi } from './api';
import type { RecipeFilters } from './types';

export function useRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => recipesApi.list(filters),
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: () => recipesApi.get(id),
    enabled: Number.isInteger(id),
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeInput) => recipesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
    },
  });
}

export function useUpdateRecipe(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeInput) => recipesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recipesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
    },
  });
}

export function useUploadRecipePhoto(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => recipesApi.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
    },
  });
}

export function useDeleteRecipePhoto(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recipesApi.deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
    },
  });
}
