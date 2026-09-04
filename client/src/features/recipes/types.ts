import type { BrewType } from '@brewlog/shared';

export interface RecipeSummary {
  id: number;
  name: string;
  type: BrewType;
  style: string | null;
  photoPath: string | null;
  createdBy: number;
  createdAt: string;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  sortOrder: number;
  category: string;
  name: string;
  amount: number | null;
  unit: string | null;
  notes: string | null;
}

export interface RecipeStep {
  id: number;
  recipeId: number;
  stepNumber: number;
  text: string;
}

export interface RecipeDetail {
  id: number;
  name: string;
  type: BrewType;
  style: string | null;
  description: string | null;
  batchSize: number | null;
  batchSizeUnit: string | null;
  targetOg: number | null;
  targetFg: number | null;
  targetAbv: number | null;
  photoPath: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: { id: number; username: string; displayName: string } | null;
}

export interface RecipeFilters {
  type?: BrewType;
  search?: string;
}
