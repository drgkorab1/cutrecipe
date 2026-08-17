import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { RecipeData } from '@/types/recipe'

function generateSlug(title: string): string {
  const base = (title || 'recipe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

export async function POST(req: NextRequest) {
  let recipe: RecipeData
  try {
    recipe = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 503 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Reuse existing slug if the same source URL was already shared
  if (recipe.sourceUrl) {
    const { data: existing } = await admin
      .from('shared_recipes')
      .select('slug')
      .eq('source_url', recipe.sourceUrl)
      .maybeSingle()
    if (existing?.slug) {
      return NextResponse.json({ slug: existing.slug })
    }
  }

  const slug = generateSlug(recipe.title)

  const { error } = await admin.from('shared_recipes').insert({
    slug,
    title:         recipe.title,
    author:        recipe.author        ?? null,
    author_url:    recipe.authorUrl     ?? null,
    source_url:    recipe.sourceUrl     ?? '',
    ingredients:   recipe.ingredients,
    steps:         recipe.steps,
    total_minutes: recipe.totalMinutes  ?? null,
    servings:      recipe.servings      ?? null,
    summary:       recipe.summary       ?? null,
    nutrition:     recipe.nutrition     ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ slug })
}
