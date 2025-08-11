import crypto from 'crypto'

// Basic file validation for security
export function validateFileType(fileName: string, mimeType: string): boolean {
  const allowedExtensions = ['.xlsx', '.xls', '.csv']
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  
  return allowedExtensions.includes(extension) && allowedMimeTypes.includes(mimeType)
}

export function validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): boolean {
  return size <= maxSize && size > 0
}

// Generate secure file names to prevent path traversal
export function generateSecureFileName(originalName: string, userId: string): string {
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(8).toString('hex')
  const hash = crypto.createHash('md5').update(userId + originalName + timestamp).digest('hex').substring(0, 8)
  
  return `${timestamp}-${hash}-${randomBytes}${extension}`
}

// Basic content scanning (placeholder for more advanced scanning)
export function performBasicSecurityScan(fileBuffer: Buffer): {
  safe: boolean
  threats: string[]
} {
  const threats: string[] = []
  
  // Check for suspicious file headers/signatures
  const fileHeader = fileBuffer.slice(0, 20).toString('hex')
  
  // Check for executable signatures (basic malware detection)
  const executableSignatures = [
    '4d5a', // PE executable
    '7f454c46', // ELF executable
    'cafebabe', // Java class file
  ]
  
  for (const signature of executableSignatures) {
    if (fileHeader.toLowerCase().includes(signature)) {
      threats.push('Executable file detected')
      break
    }
  }
  
  // Check for macro-enabled files (higher risk)
  if (fileHeader.includes('504b0304') && fileBuffer.includes(Buffer.from('macros', 'utf8'))) {
    threats.push('Macro content detected')
  }
  
  // Check file size consistency
  if (fileBuffer.length === 0) {
    threats.push('Empty file')
  }
  
  return {
    safe: threats.length === 0,
    threats
  }
}

// Rate limiting helper
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  let record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + windowMs
    }
    rateLimitStore.set(key, record)
  }
  
  const allowed = record.count < maxRequests
  
  if (allowed) {
    record.count++
  }
  
  return {
    allowed,
    remainingRequests: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 300000) // Clean up every 5 minutes