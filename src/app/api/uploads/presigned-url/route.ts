import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePresignedUrl } from '@/lib/aws'
import { z } from 'zod'

const uploadSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().max(50 * 1024 * 1024), // 50MB limit
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
    const { fileName, fileType, fileSize } = uploadSchema.parse(body)

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv', // .csv
      'application/vnd.ms-excel', // .xls
    ]

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel and CSV files are allowed.' },
        { status: 400 }
      )
    }

    // Generate unique key for the file
    const timestamp = Date.now()
    const key = `uploads/${session.user.id}/${timestamp}-${fileName}`

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(key, fileType)

    return NextResponse.json({
      presignedUrl,
      key,
    })
  } catch (error) {
    console.error('Presigned URL generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}