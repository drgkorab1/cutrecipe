// Shared type used by the API route, extractor, and client components.
// Defined here (not in lib/extractor.ts) so client components can import
// without bundling the server-only cheerio dependency.

export interface NutritionEstimate {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
}

export interface RecipeData {
  title: string
  author: string | null
  authorUrl: string | null
  sourceUrl: string
  coverUrl?: string
  ingredients: string[]
  steps: string[]
  totalMinutes: number | null
  servings: string | null
  summary?: string
  nutrition?: NutritionEstimate
}
