import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'uaforge-jwt-secret-key-development',
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '60', 10),
  whatIsMyBrowserApiKey: process.env.WHATISMYBROWSER_API_KEY || '5e8747bf145ebe905901b419b164ecf0',
  supabaseProjectId: process.env.SUPABASE_PROJECT_ID || 'uhncevftkngihicnhiqb',
  supabaseUrl: process.env.SUPABASE_URL || 'https://uhncevftkngihicnhiqb.supabase.co',
  supabaseApiKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_NfevHJXMVDVAE4wvrvPd5Q__VYuZt7X',
  isProduction: process.env.NODE_ENV === 'production',
};
