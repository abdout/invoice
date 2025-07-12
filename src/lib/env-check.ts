// Environment variable validation script

const requiredEnvVars = [
  'FACEBOOK_CLIENT_ID',
  'FACEBOOK_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AUTH_SECRET',
  'NEXT_PUBLIC_APP_URL',
];

export function checkRequiredEnvVars() {
  const missing: string[] = [];
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('These variables must be set for authentication to work properly.');
    return false;
  }
  
  console.log('✅ All required environment variables are set.');
  return true;
}

export function logOAuthConfig() {
  console.log('=== OAuth Configuration ===');
  console.log(`FACEBOOK_CLIENT_ID: ${process.env.FACEBOOK_CLIENT_ID?.substring(0, 5)}...`);
  console.log(`FACEBOOK_CLIENT_SECRET: ${process.env.FACEBOOK_CLIENT_SECRET?.substring(0, 5)}...`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 5)}...`);
  console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET?.substring(0, 5)}...`);
  console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
  console.log('=========================');
}

// Add this to your app initialization to check env vars
export function validateEnv() {
  const varsValid = checkRequiredEnvVars();
  if (varsValid) {
    logOAuthConfig();
  }
  return varsValid;
} 