import { z } from 'zod';

export const IngredientSchema = z.object({
  name: z.string().min(1).max(50),
  quantity_estimate: z.string().min(1).max(50),
  confidence: z.number().min(0).max(1)
});

export const RecognizeResponseSchema = z.object({
  ingredients: z.array(IngredientSchema).max(50),
  notes: z.string().max(500).default('')
});

export type RecognizeResponseValidated = z.infer<typeof RecognizeResponseSchema>;

export const PreferencesSchema = z.object({
  servings: z.number().int().min(1).max(6),
  max_minutes: z.number().int().min(10).max(120),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  exclude: z.array(z.string().min(1).max(30)).max(30).default([]),
  diet: z
    .array(z.enum(['vegetarian', 'vegan', 'gluten_free', 'pescatarian', 'low_sodium']))
    .max(10)
    .default([]),
  cuisine: z.enum(['한식', '일식', '중식', '양식', '무관'])
});

const RecipeIngredientSchema = z.object({
  name: z.string().min(1).max(50),
  amount: z.string().min(1).max(50)
});

export const RecipeSchema = z.object({
  title: z.string().min(1).max(80),
  cuisine: z.string().min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimated_minutes: z.number().int().min(1).max(600),
  servings: z.number().int().min(1).max(20),
  used_ingredients: z.array(RecipeIngredientSchema).max(50),
  missing_ingredients: z.array(RecipeIngredientSchema).max(50).default([]),
  steps: z
    .array(
      z.object({
        order: z.number().int().min(1).max(50),
        instruction: z.string().min(1).max(500)
      })
    )
    .min(1)
    .max(30),
  tips: z.array(z.string().min(1).max(200)).max(10).default([]),
  tags: z.array(z.string().min(1).max(20)).max(10).default([])
});

export const RecipesResponseSchema = z.object({
  recipes: z.array(RecipeSchema).min(1).max(3)
});

export type RecipeValidated = z.infer<typeof RecipeSchema>;
export type RecipesResponseValidated = z.infer<typeof RecipesResponseSchema>;

export const RecipesRequestIngredientSchema = z.object({
  name: z.string().min(1).max(50),
  quantity_estimate: z.string().min(1).max(50).optional()
});

export const RecipesRequestSchema = z.object({
  ingredients: z.array(RecipesRequestIngredientSchema).min(1).max(50),
  preferences: PreferencesSchema,
  regenerate: z.boolean().default(false),
  previous_titles: z.array(z.string().max(80)).max(20).default([])
});
