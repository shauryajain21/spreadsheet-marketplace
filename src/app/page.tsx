'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Star, Download, Users } from 'lucide-react'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  averageRating: number
  totalSales: number
  creator: {
    firstName: string
    lastName: string
  }
  category: {
    name: string
    slug: string
  } | null
  tags: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  _count: {
    listings: number
  }
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchListings()
    fetchCategories()
  }, [selectedCategory, searchQuery])

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams({
        limit: '8',
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
      })

      const response = await fetch(`/api/listings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                SpreadMarket
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6">
            Find the Perfect Spreadsheet for Your Business
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Save hours of work with ready-to-use spreadsheets created by experts. 
            From financial models to KPI dashboards – find exactly what you need.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for spreadsheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button type="submit" size="lg" variant="secondary">
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`p-4 rounded-lg border text-left hover:shadow-md transition-shadow ${
                selectedCategory === '' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="font-medium">All Categories</div>
              <div className="text-sm text-gray-500">
                {categories.reduce((sum, cat) => sum + cat._count.listings, 0)} listings
              </div>
            </button>
            {categories.slice(0, 7).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`p-4 rounded-lg border text-left hover:shadow-md transition-shadow ${
                  selectedCategory === category.slug ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-gray-500">{category._count.listings} listings</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {searchQuery || selectedCategory ? 'Search Results' : 'Featured Spreadsheets'}
            </h2>
            <Link href="/marketplace">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{listing.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{listing.description}</p>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
                    </span>
                    <Download className="h-4 w-4 text-gray-400 ml-3" />
                    <span className="text-sm text-gray-600 ml-1">{listing.totalSales}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">${listing.price}</div>
                      <div className="text-xs text-gray-500">
                        by {listing.creator.firstName} {listing.creator.lastName}
                      </div>
                    </div>
                    <Button size="sm">View</Button>
                  </div>
                  
                  {listing.category && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-xs rounded">
                        {listing.category.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Turn your expertise into income. Upload your spreadsheets and start earning from your work.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                <Users className="mr-2 h-5 w-5" />
                Become a Creator
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2024 SpreadMarket. Built for professionals who value their time.</p>
        </div>
      </footer>
    </div>
  )
}
