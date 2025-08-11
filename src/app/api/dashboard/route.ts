import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's listings
    const listings = await db.listing.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        totalSales: true,
        averageRating: true,
        totalReviews: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Calculate stats
    const totalListings = listings.length
    const totalSales = listings.reduce((sum, listing) => sum + listing.totalSales, 0)
    
    // Get total earnings from transactions
    const transactions = await db.transaction.findMany({
      where: {
        listing: {
          creatorId: userId,
        },
        status: 'completed',
      },
      select: {
        creatorEarnings: true,
      },
    })

    const totalEarnings = transactions.reduce((sum, tx) => sum + Number(tx.creatorEarnings), 0)

    // Calculate average rating across all listings
    const ratingsSum = listings.reduce((sum, listing) => {
      return sum + (Number(listing.averageRating) || 0) * listing.totalReviews
    }, 0)
    const totalReviews = listings.reduce((sum, listing) => sum + listing.totalReviews, 0)
    const averageRating = totalReviews > 0 ? ratingsSum / totalReviews : 0

    const stats = {
      totalListings,
      totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
      totalSales,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    }

    return NextResponse.json({
      listings,
      stats,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}