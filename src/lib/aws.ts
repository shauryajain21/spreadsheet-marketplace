import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const generatePresignedUrl = async (
  key: string,
  fileType: string,
  expiresIn: number = 3600
) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

export const generateDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

export { s3Client }