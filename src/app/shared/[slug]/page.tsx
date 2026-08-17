import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { RecipeData } from '@/types/recipe'
import RecipeCard from '@/components/RecipeCard'
import Navbar from '@/components/Navbar'

async function fetchSharedRecipe(slug: string): Promise<RecipeData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('shared_recipes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return null

  return {
    title:        data.title,
    author:       data.author,
    authorUrl:    data.author_url,
    sourceUrl:    data.source_url,
    ingredients:  data.ingredients,
    steps:        data.steps,
    totalMinutes: data.total_minutes,
    servings:     data.servings,
    summary:      data.summary    ?? undefined,
    nutrition:    data.nutrition  ?? undefined,
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const recipe = await fetchSharedRecipe(slug)
  if (!recipe) return { title: 'Recipe not found' }

  const description =
    recipe.summary ??
    `${recipe.ingredients.length} ingredients · ${recipe.steps.length} steps`

  return {
    title: recipe.title,
    description,
    openGraph: {
      title: recipe.title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: recipe.title,
      description,
    },
  }
}

export default async function SharedRecipePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const recipe = await fetchSharedRecipe(slug)
  if (!recipe) notFound()

  return (
    <>
      <Navbar />
      <main className="mx-auto px-4 py-10 sm:px-7" style={{ maxWidth: 1088 }}>
        <RecipeCard data={recipe} />
        <p className="mt-8 text-center text-muted" style={{ fontSize: 13.5 }}>
          Extracted with{' '}
          <a href="/" className="font-semibold text-accent hover:underline">
            Cut Recipe
          </a>{' '}
          — paste any recipe link and skip straight to the ingredients and steps.
        </p>
      </main>
    </>
  )
}
