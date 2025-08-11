import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createReviewSchema = z.object({
  transactionId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { transactionId, rating, comment } = createReviewSchema.parse(body)

    // Verify the transaction exists and belongs to the user
    const transaction = await db.transaction.findUnique({
      where: { 
        id: transactionId,
        buyerId: session.user.id,
        status: 'completed',
      },
      include: {
        listing: true,
        review: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or you cannot review this purchase' },
        { status: 404 }
      )
    }

    // Check if review already exists
    if (transaction.review) {
      return NextResponse.json(
        { error: 'You have already reviewed this purchase' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await db.review.create({
      data: {
        transactionId,
        buyerId: session.user.id,
        listingId: transaction.listingId,
        rating,
        comment: comment || null,
      },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    })

    // Update listing's average rating and review count
    const allReviews = await db.review.findMany({
      where: { listingId: transaction.listingId },
    })

    const totalReviews = allReviews.length
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews

    await db.listing.update({
      where: { id: transaction.listingId },
      data: {
        averageRating,
        totalReviews,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}