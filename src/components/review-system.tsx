'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  buyer: {
    firstName: string
    lastName: string
    profileImageUrl: string | null
  }
}

interface ReviewSystemProps {
  listingId: string
  transactionId?: string // Only provided if user purchased this listing
  canReview?: boolean
}

export default function ReviewSystem({ 
  listingId, 
  transactionId, 
  canReview = false 
}: ReviewSystemProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [listingId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/listings/${listingId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitReview = async () => {
    if (!transactionId) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      })

      if (response.ok) {
        fetchReviews()
        setShowReviewForm(false)
        setNewReview({ rating: 5, comment: '' })
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ rating, size = 'small', interactive = false, onChange }: {
    rating: number
    size?: 'small' | 'medium'
    interactive?: boolean
    onChange?: (rating: number) => void
  }) => {
    const starSize = size === 'medium' ? 'h-6 w-6' : 'h-4 w-4'
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${interactive ? 'cursor-pointer hover:text-yellow-400' : 'cursor-default'}`}
            onClick={() => interactive && onChange?.(star)}
            disabled={!interactive}
          >
            <Star
              className={`${starSize} ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Reviews ({reviews.length})
        </h3>
        
        {canReview && !showReviewForm && (
          <Button
            onClick={() => setShowReviewForm(true)}
            size="sm"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">Write Your Review</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <StarRating
                rating={newReview.rating}
                size="medium"
                interactive
                onChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this spreadsheet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={submitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review this spreadsheet!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {review.buyer.profileImageUrl ? (
                      <img
                        src={review.buyer.profileImageUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {review.buyer.firstName.charAt(0)}{review.buyer.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.buyer.firstName} {review.buyer.lastName}
                    </p>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {review.comment && (
                <p className="mt-3 text-gray-700">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}