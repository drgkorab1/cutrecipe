// AI-based recipe parser — server-side only.
// Uses the Anthropic claude-haiku-4-5 model with tool_use to extract
// structured RecipeData from a YouTube video description, and to generate
// short recipe summaries for display.

import type { RecipeData, NutritionEstimate } from '@/types/recipe'
import { cleanIngredient } from './extractor'

// ─── Lazy client ──────────────────────────────────────────────────────────────

let _anthropic: import('@anthropic-ai/sdk').Anthropic | null = null

function getClient(): import('@anthropic-ai/sdk').Anthropic {
  if (_anthropic) return _anthropic

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local to enable YouTube recipe extraction.',
    )
  }

  // Dynamic import so the module is only evaluated when actually needed.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Anthropic } = require('@anthropic-ai/sdk') as typeof import('@anthropic-ai/sdk')
  _anthropic = new Anthropic({ apiKey })
  return _anthropic
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const NUTRITION_TOOL = {
  name: 'estimate_nutrition',
  description: 'Estimate nutrition per serving for a recipe based on its ingredients and servings.',
  input_schema: {
    type: 'object' as const,
    properties: {
      calories:  { type: 'number', description: 'Estimated calories per serving' },
      proteinG:  { type: 'number', description: 'Estimated protein in grams per serving' },
      carbsG:    { type: 'number', description: 'Estimated carbohydrates in grams per serving' },
      fatG:      { type: 'number', description: 'Estimated fat in grams per serving' },
      fiberG:    { type: 'number', description: 'Estimated dietary fiber in grams per serving (optional)' },
    },
    required: ['calories', 'proteinG', 'carbsG', 'fatG'],
  },
} as const

const EXTRACT_RECIPE_TOOL = {
  name: 'extract_recipe',
  description:
    'Extract a structured recipe from a YouTube video description. ' +
    'Only call this tool if the description actually contains a recipe with ingredients and steps.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Recipe title' },
      author: { type: 'string', description: 'Channel / creator name' },
      servings: { type: 'string', description: 'Serving size (e.g. "4 servings", "makes 12 cookies")' },
      totalMinutes: { type: 'number', description: 'Total cook + prep time in minutes, or null if not stated' },
      ingredients: {
        type: 'array',
        items: { type: 'string' },
        description: 'Each ingredient as a plain string (quantity + name)',
      },
      steps: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ordered cooking steps as plain strings',
      },
    },
    required: ['title', 'author', 'ingredients', 'steps'],
  },
} as const

// ─── Parser ───────────────────────────────────────────────────────────────────

interface ParseInput {
  title: string
  description: string
  author: string
  sourceUrl: string
  isTranscript?: boolean
}

interface ExtractToolInput {
  title?: string
  author?: string
  servings?: string
  totalMinutes?: number
  ingredients?: unknown[]
  steps?: unknown[]
}

/** Cap description length to keep prompt tokens low (recipes are near the top). */
const MAX_DESC_CHARS = 4000

/** Generate a 2-sentence plain-text summary of a recipe for display. */
export async function generateRecipeSummary(recipe: RecipeData): Promise<string | null> {
  const client = getClient()
  const ingredientSample = recipe.ingredients.slice(0, 8).join(', ')
  const timeHint = recipe.totalMinutes ? `${recipe.totalMinutes} minutes` : 'time not stated'
  const servingHint = recipe.servings ?? 'servings not stated'

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content:
          `Write exactly 2 short sentences describing this recipe. Be warm and appetising. No markdown, no lists.\n` +
          `Recipe: ${recipe.title}\n` +
          `Key ingredients: ${ingredientSample}\n` +
          `Time: ${timeHint} | Serves: ${servingHint}`,
      },
    ],
  })

  const block = response.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text.trim() : null
}

/** Estimate per-serving nutrition for a recipe using tool_use. Returns null on any failure. */
export async function generateNutritionEstimate(recipe: RecipeData): Promise<NutritionEstimate | null> {
  try {
    const client = getClient()
    const ingredientList = recipe.ingredients.slice(0, 20).join('\n')
    const servingHint = recipe.servings ?? 'servings not stated'

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      tools: [NUTRITION_TOOL],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content:
            `Estimate the nutrition per serving for this recipe.\n` +
            `Recipe: ${recipe.title}\n` +
            `Serves: ${servingHint}\n` +
            `Ingredients:\n${ingredientList}`,
        },
      ],
    })

    const toolUse = response.content.find(
      (block): block is { type: 'tool_use'; id: string; name: string; input: unknown } =>
        block.type === 'tool_use' && (block as { name?: string }).name === 'estimate_nutrition',
    )
    if (!toolUse) return null

    const inp = toolUse.input as Record<string, unknown>
    const { calories, proteinG, carbsG, fatG, fiberG } = inp

    if (
      typeof calories !== 'number' ||
      typeof proteinG !== 'number' ||
      typeof carbsG !== 'number' ||
      typeof fatG !== 'number'
    ) return null

    return {
      calories: Math.round(calories),
      proteinG: Math.round(proteinG),
      carbsG:   Math.round(carbsG),
      fatG:     Math.round(fatG),
      ...(typeof fiberG === 'number' ? { fiberG: Math.round(fiberG) } : {}),
    }
  } catch {
    return null
  }
}

export async function parseRecipeWithAI(input: ParseInput): Promise<RecipeData | null> {
  const { title, author, sourceUrl, isTranscript = false } = input
  const description = input.description.slice(0, MAX_DESC_CHARS)

  const sourceLabel = isTranscript ? 'Transcript' : 'Description'
  const instruction = isTranscript
    ? 'This is a spoken transcript from a cooking video — expect conversational language and no punctuation. ' +
      'If it contains a recipe with ingredients and steps, call extract_recipe with the structured data. ' +
      'If there is no recipe, do not call the tool.'
    : 'If this description contains a recipe, call extract_recipe with the structured data. ' +
      'If there is no recipe, do not call the tool.'

  const client = getClient()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    tools: [EXTRACT_RECIPE_TOOL],
    tool_choice: { type: 'auto' },
    messages: [
      {
        role: 'user',
        content:
          `Video title: ${title}\n` +
          `Channel: ${author}\n\n` +
          `${sourceLabel}:\n${description}\n\n` +
          instruction,
      },
    ],
  })

  // Find a tool_use block for extract_recipe
  const toolUse = response.content.find(
    (block): block is { type: 'tool_use'; id: string; name: string; input: unknown } =>
      block.type === 'tool_use' && (block as { name?: string }).name === 'extract_recipe',
  )
  if (!toolUse) return null

  const inp = toolUse.input as ExtractToolInput

  const ingredients = Array.isArray(inp.ingredients)
    ? inp.ingredients.filter((x): x is string => typeof x === 'string').map(cleanIngredient)
    : []
  const steps = Array.isArray(inp.steps)
    ? inp.steps.filter((x): x is string => typeof x === 'string')
    : []

  if (ingredients.length === 0 && steps.length === 0) return null

  return {
    title: typeof inp.title === 'string' ? inp.title : title,
    author: typeof inp.author === 'string' ? inp.author : author,
    authorUrl: null,
    sourceUrl,
    ingredients,
    steps,
    totalMinutes: typeof inp.totalMinutes === 'number' ? inp.totalMinutes : null,
    servings: typeof inp.servings === 'string' ? inp.servings : null,
  }
}
