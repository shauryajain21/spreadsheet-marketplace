# Post-Deployment Setup

## 1. Database Migration
After deployment, run these commands to set up your database:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Run database migrations
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

## 2. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook secret to environment variables

## 3. AWS S3 Bucket Setup

1. Create S3 bucket with these settings:
   - Block all public access: OFF (for file serving)
   - Bucket versioning: Enabled
   - Server-side encryption: Enabled

2. CORS Configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-app.vercel.app"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. IAM User Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## 4. Domain Setup (Optional)

1. Go to Vercel project settings
2. Add your custom domain
3. Update NEXTAUTH_URL environment variable
4. Update Stripe webhook URL if using custom domain