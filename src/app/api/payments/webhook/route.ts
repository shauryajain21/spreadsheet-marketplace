import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { generateDownloadUrl } from '@/lib/aws'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') as string

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const { listingId, buyerId, creatorId, platformFee, creatorEarnings } = paymentIntent.metadata

      // Create transaction record
      const transaction = await db.transaction.create({
        data: {
          buyerId,
          listingId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert from cents
          commission: parseInt(platformFee) / 100,
          creatorEarnings: parseInt(creatorEarnings) / 100,
          status: 'completed',
        },
      })

      // Update listing stats
      await db.listing.update({
        where: { id: listingId },
        data: {
          totalSales: { increment: 1 },
        },
      })

      // Create download link (expires in 24 hours)
      const listing = await db.listing.findUnique({
        where: { id: listingId },
      })

      if (listing) {
        const downloadUrl = await generateDownloadUrl(
          listing.fileUrl.split('/').pop()!, // Extract file key from URL
          24 * 60 * 60 // 24 hours
        )

        // Create download record
        await db.download.create({
          data: {
            transactionId: transaction.id,
            userId: buyerId,
            listingId,
            downloadUrl,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          },
        })
      }

      console.log(`Payment completed for listing ${listingId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}