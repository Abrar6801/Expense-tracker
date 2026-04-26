export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { PRESET_CATEGORIES } from '@/lib/constants'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    })

    const custom = prefs?.customCategories ?? []
    const all = [...new Set([...PRESET_CATEGORIES, ...custom])].sort()

    return NextResponse.json({ categories: all, custom })
  } catch (error) {
    console.error('[GET /api/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const addCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = addCategorySchema.parse(body)

    // Don't allow duplicates with presets
    if ((PRESET_CATEGORIES as readonly string[]).includes(name)) {
      return NextResponse.json(
        { error: 'Category already exists as a preset' },
        { status: 409 }
      )
    }

    // Enforce per-user category limit to prevent resource exhaustion
    const existing = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } })
    if ((existing?.customCategories.length ?? 0) >= 100) {
      return NextResponse.json({ error: 'Maximum of 100 custom categories reached' }, { status: 400 })
    }

    if (existing?.customCategories.includes(name)) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        customCategories: [name],
      },
      update: {
        customCategories: {
          push: name,
        },
      },
    })

    return NextResponse.json({ categories: prefs.customCategories }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[POST /api/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
