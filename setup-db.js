import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
    console.log('Setting up database...');

    console.log('Note: Database table creation requires admin access.');
    console.log('Please create the table manually in Supabase dashboard:');
    console.log(`
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
    `);

    console.log('\nSetting up storage bucket...');

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'sites');

    if (!bucketExists) {
        const { data, error } = await supabase.storage.createBucket('sites', {
            public: true,
            fileSizeLimit: 26214400
        });

        if (error) {
            console.error('Error creating bucket:', error);
        } else {
            console.log('✓ Storage bucket created successfully');
        }
    } else {
        console.log('✓ Storage bucket already exists');
    }

    console.log('\nSetup instructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Run the query');
    console.log('\nThen you can start using the application!');
}

setupDatabase();
