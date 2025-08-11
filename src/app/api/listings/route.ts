import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createListingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().min(0.01).max(999999),
  categoryId: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().optional(),
  tags: z.array(z.string()).max(10),
})

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
})

// GET /api/listings - Search and browse listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 12,
    }

    const { q, category, minPrice, maxPrice, tags, sortBy, page, limit } = searchSchema.parse(params)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category) {
      where.category = { slug: category }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { averageRating: 'desc' }
        break
      case 'popular':
        orderBy = { totalSales: 'desc' }
        break
    }

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      db.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Listings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create new listing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a creator
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.isCreator) {
      return NextResponse.json(
        { error: 'Only creators can create listings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createListingSchema.parse(body)

    const listing = await db.listing.create({
      data: {
        ...data,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Listing creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}