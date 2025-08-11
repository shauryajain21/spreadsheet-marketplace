-- Spreadsheet Marketplace Database Schema
-- PostgreSQL Schema Design

-- Users table for both creators and buyers
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    bio TEXT,
    is_creator BOOLEAN DEFAULT false,
    stripe_account_id VARCHAR(255), -- For Stripe Connect
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories for organizing spreadsheets
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spreadsheet listings
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    file_url TEXT NOT NULL, -- AWS S3 URL
    file_type VARCHAR(10) NOT NULL, -- xlsx, csv, gsheet
    file_size INTEGER, -- in bytes
    preview_url TEXT, -- Screenshot or sample data URL
    tags TEXT[], -- Array of tags for search
    is_active BOOLEAN DEFAULT true,
    total_sales INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions for tracking purchases
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    commission DECIMAL(10, 2) NOT NULL, -- Platform fee
    creator_earnings DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed', -- completed, refunded, disputed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE UNIQUE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creator payouts tracking
CREATE TABLE payouts (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_transfer_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Search analytics for improving discovery
CREATE TABLE search_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL,
    clicked_listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File download tracking
CREATE TABLE downloads (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    download_url TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    downloaded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_creator ON listings(creator_id);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_tags ON listings USING GIN(tags);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_downloads_user ON downloads(user_id);

-- Seed data for categories
INSERT INTO categories (name, slug, description) VALUES
('Financial Models', 'financial-models', 'Budgets, forecasts, investment calculators'),
('KPI Dashboards', 'kpi-dashboards', 'Performance tracking and business metrics'),
('Market Research', 'market-research', 'Industry analysis and competitive intelligence'),
('Project Management', 'project-management', 'Task tracking and resource planning'),
('Sales & CRM', 'sales-crm', 'Lead tracking and sales pipeline management'),
('HR & Operations', 'hr-operations', 'Employee management and operational templates'),
('Data Analysis', 'data-analysis', 'Statistical models and data visualization'),
('Inventory Management', 'inventory-management', 'Stock tracking and supply chain');