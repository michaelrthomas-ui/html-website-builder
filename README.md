# HTML Hosting Platform

A simple platform to upload and host HTML files or ZIP archives containing websites.

## Setup Instructions

### 1. Database Setup

Go to your Supabase project dashboard (SQL Editor) and run this SQL:

```sql
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  main_file text NOT NULL DEFAULT 'index.html',
  file_count integer DEFAULT 1,
  total_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create sites"
  ON sites
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view sites"
  ON sites
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites(created_at DESC);
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Features

- Upload single HTML files or complete websites as ZIP archives
- Automatic file extraction and hosting
- Shareable URLs for each upload
- Public access (no authentication required)
- Support for CSS, JavaScript, images, and other assets
- Drag and drop upload interface
- Maximum file size: 25MB

## How It Works

1. Visit the homepage
2. Upload an HTML file or ZIP archive
3. Get a shareable URL instantly
4. Share the URL with anyone

The platform automatically extracts ZIP files, maintains folder structure, and serves all assets correctly with proper path resolution.
