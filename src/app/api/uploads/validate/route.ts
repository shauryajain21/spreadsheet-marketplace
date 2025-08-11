import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateFileType, validateFileSize, performBasicSecurityScan, checkRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting per user
    const rateLimit = checkRateLimit(`upload_validate_${session.user.id}`, 5, 60000) // 5 requests per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          remainingRequests: rateLimit.remainingRequests,
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!validateFileType(file.name, file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only Excel and CSV files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer for security scanning
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Perform basic security scan
    const scanResult = performBasicSecurityScan(buffer)
    
    if (!scanResult.safe) {
      return NextResponse.json(
        { 
          error: 'Security scan failed',
          threats: scanResult.threats
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      scanResult: {
        safe: scanResult.safe,
        scannedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('File validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}