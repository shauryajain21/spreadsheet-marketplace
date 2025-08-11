'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentButtonProps {
  listingId: string
  price: number
  title: string
}

export default function PaymentButton({ listingId, price, title }: PaymentButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePurchase = async () => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create payment intent
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Payment failed')
      }

      const { clientSecret } = await response.json()

      // Redirect to Stripe Checkout or use Elements
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe not loaded')

      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/purchase/success?listing=${listingId}`,
        },
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePurchase}
        disabled={isLoading || status === 'loading'}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : `Buy Now - $${price}`}
      </Button>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Stripe</p>
        <p>Instant download after purchase</p>
      </div>
    </div>
  )
}