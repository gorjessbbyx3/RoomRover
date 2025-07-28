
export function validateEnvironment() {
  const required = ['DATABASE_URL'];
  const optional = {
    PORT: '5000',
    NODE_ENV: 'development',
    JWT_SECRET: 'fallback-jwt-secret',
    JWT_REFRESH_SECRET: 'fallback-refresh-secret'
  };

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  // Set defaults for optional variables
  Object.entries(optional).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.warn(`⚠️  Using default value for ${key}: ${defaultValue}`);
    }
  });

  console.log('✅ Environment variables validated');
}
