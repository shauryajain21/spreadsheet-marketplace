import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { z } from 'zod'

const checkoutSchema = z.object({
  listingId: z.string(),
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
    const { listingId } = checkoutSchema.parse(body)

    // Get the listing
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      include: {
        creator: true,
      },
    })

    if (!listing || !listing.isActive) {
      return NextResponse.json(
        { error: 'Listing not found or inactive' },
        { status: 404 }
      )
    }

    // Check if user is trying to buy their own listing
    if (listing.creatorId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot purchase your own listing' },
        { status: 400 }
      )
    }

    // Check if user already owns this listing
    const existingTransaction = await db.transaction.findFirst({
      where: {
        buyerId: session.user.id,
        listingId: listingId,
        status: 'completed',
      },
    })

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'You already own this spreadsheet' },
        { status: 400 }
      )
    }

    // Calculate platform fee (10%)
    const platformFeePercent = 0.10
    const platformFee = Math.round(Number(listing.price) * platformFeePercent * 100) // in cents
    const creatorEarnings = Math.round(Number(listing.price) * 100) - platformFee // in cents

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(listing.price) * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        listingId: listing.id,
        buyerId: session.user.id,
        creatorId: listing.creatorId,
        platformFee: platformFee.toString(),
        creatorEarnings: creatorEarnings.toString(),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}