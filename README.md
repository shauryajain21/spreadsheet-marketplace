# SpreadMarket - Spreadsheet Marketplace

A modern marketplace for buying and selling professional spreadsheets, built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and Stripe.

## 🚀 Features

### For Buyers
- **Search & Browse**: Find spreadsheets by category, keywords, and price range
- **Preview Files**: See sample data before purchasing
- **Secure Payments**: Powered by Stripe with instant downloads
- **Reviews & Ratings**: Make informed purchase decisions

### For Creators
- **Easy Upload**: Upload Excel and CSV files with validation
- **Dashboard**: Track sales, earnings, and performance
- **Pricing Control**: Set your own prices
- **File Security**: Built-in malware scanning and validation

### Platform Features
- **User Authentication**: Secure login/signup with NextAuth.js
- **File Storage**: AWS S3 integration for scalable file storage
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Rate limiting, file validation, and security scanning
- **Responsive Design**: Works on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payments**: Stripe Connect
- **File Storage**: AWS S3
- **Security**: Built-in validation and scanning

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- PostgreSQL database
- AWS S3 account
- Stripe account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spreadsheet-marketplace-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.local` and fill in your credentials:

   Required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/spreadsheet_marketplace"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # AWS S3
   AWS_ACCESS_KEY_ID="your_aws_access_key"
   AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
   AWS_REGION="us-east-1"
   S3_BUCKET_NAME="your-bucket-name"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run database migrations
   npm run db:migrate

   # Seed the database with categories
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📝 Database Setup

The application uses PostgreSQL with Prisma. The schema includes:
- **Users**: Authentication and profiles
- **Categories**: Spreadsheet categories
- **Listings**: Marketplace items
- **Transactions**: Purchase records
- **Reviews**: Rating system
- **Downloads**: File access tracking

## 🔐 Security Features

- **File Validation**: Only allows Excel and CSV files
- **Size Limits**: 50MB maximum file size
- **Security Scanning**: Basic malware detection
- **Rate Limiting**: Prevents abuse
- **Secure File Names**: Prevents path traversal attacks

## 💳 Stripe Integration

The marketplace uses Stripe for payments with:
- One-time payments for spreadsheet purchases
- Automatic creator payouts (90% to creator, 10% platform fee)
- Webhook handling for payment completion
- Secure payment processing

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

## 📊 Project Structure

```
src/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Creator dashboard
│   └── create-listing/    # Listing creation
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database connection
│   ├── stripe.ts         # Stripe configuration
│   ├── aws.ts            # AWS S3 utilities
│   └── security.ts       # Security functions
└── prisma/               # Database schema and migrations
```

## 🎯 User Flows

### Creator Flow
1. Sign up as creator
2. Upload spreadsheet with metadata
3. Set price and publish listing
4. Track sales in dashboard
5. Receive automated payouts

### Buyer Flow
1. Browse marketplace
2. Search and filter listings
3. Preview file contents
4. Purchase and instant download
5. Leave review and rating

---

Built with ❤️ for professionals who value their time.
