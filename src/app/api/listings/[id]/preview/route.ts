import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await db.listing.findUnique({
      where: { id: params.id },
    })

    if (!listing || !listing.isActive) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // For MVP, return placeholder preview data
    // In production, this would generate actual previews from the file
    const mockPreview = {
      type: 'csv',
      headers: ['Name', 'Category', 'Value', 'Date'],
      rows: [
        ['Sample Data 1', 'Category A', '100', '2024-01-15'],
        ['Sample Data 2', 'Category B', '250', '2024-01-16'],
        ['Sample Data 3', 'Category A', '175', '2024-01-17'],
        ['...', '...', '...', '...'],
      ],
      totalRows: 150,
      sheets: listing.fileType === 'xlsx' ? ['Sheet1', 'Summary', 'Data'] : undefined,
    }

    return NextResponse.json({
      preview: mockPreview,
      fileType: listing.fileType,
      fileName: `${listing.title}.${listing.fileType}`,
    })
  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}