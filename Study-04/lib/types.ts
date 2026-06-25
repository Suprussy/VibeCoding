export type Ingredient = {
  name: string;
  quantity_estimate: string;
  confidence: number;
};

export type RecognizeResponse = {
  ingredients: Ingredient[];
  notes: string;
};

export type RecognizeError = {
  error:
    | 'invalid_request'
    | 'missing_image'
    | 'invalid_type'
    | 'too_large'
    | 'server_misconfigured'
    | 'upstream_error'
    | 'rate_limited'
    | 'malformed_response'
    | 'json_parse_failed'
    | 'schema_violation'
    | 'timeout'
    | 'network_error';
};

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Cuisine = '한식' | '일식' | '중식' | '양식' | '무관';
export type DietOption = 'vegetarian' | 'vegan' | 'gluten_free' | 'pescatarian' | 'low_sodium';

export type Preferences = {
  servings: number;
  max_minutes: number;
  difficulty: Difficulty;
  exclude: string[];
  diet: DietOption[];
  cuisine: Cuisine;
};

export type RecipeIngredient = { name: string; amount: string };
export type RecipeStep = { order: number; instruction: string };

export type Recipe = {
  id: string;
  title: string;
  cuisine: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  servings: number;
  used_ingredients: RecipeIngredient[];
  missing_ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips: string[];
  tags: string[];
};

export type RecipesResponse = { recipes: Recipe[] };

export type RecipesError = {
  error:
    | 'invalid_request'
    | 'no_ingredients'
    | 'server_misconfigured'
    | 'upstream_error'
    | 'rate_limited'
    | 'malformed_response'
    | 'json_parse_failed'
    | 'schema_violation'
    | 'safety_violation'
    | 'timeout'
    | 'network_error';
};
