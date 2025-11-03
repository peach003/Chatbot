import * as fs from 'fs';
import * as path from 'path';

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
}

const REQUIRED_ENV_VARS: EnvCheck[] = [
  { key: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
  { key: 'REDIS_URL', required: true, description: 'Redis connection string' },
  { key: 'NODE_ENV', required: false, description: 'Environment (development/production)' },
  { key: 'BACKEND_PORT', required: false, description: 'Backend server port' },
  { key: 'BACKEND_URL', required: false, description: 'Backend base URL' },
  { key: 'OPENAI_API_KEY', required: false, description: 'OpenAI API key' },
  { key: 'CACHE_TTL_DEFAULT', required: false, description: 'Default cache TTL' },
];

function checkEnvFile(): boolean {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    return false;
  }
  console.log('✅ .env file exists');
  return true;
}

function checkEnvVariables(): boolean {
  let allValid = true;
  console.log('\n📋 Checking environment variables:\n');

  for (const check of REQUIRED_ENV_VARS) {
    const value = process.env[check.key];
    const exists = value !== undefined && value !== '';

    if (check.required && !exists) {
      console.log(`❌ ${check.key} (REQUIRED) - ${check.description}`);
      allValid = false;
    } else if (exists) {
      const maskedValue = check.key.includes('KEY') || check.key.includes('PASSWORD') || check.key.includes('URL')
        ? value.substring(0, 20) + '...'
        : value;
      console.log(`✅ ${check.key} - ${maskedValue}`);
    } else {
      console.log(`⚠️  ${check.key} (optional) - Not set`);
    }
  }

  return allValid;
}

function checkDirectories(): boolean {
  const dirs = [
    'src/ai',
    'src/cache',
    'src/common',
    'src/data',
    'src/itinerary',
    'src/proxy',
    'src/user',
    'src/weather',
    'prisma',
  ];

  let allExist = true;
  console.log('\n📂 Checking directory structure:\n');

  for (const dir of dirs) {
    const dirPath = path.join(__dirname, '..', '..', dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✅ ${dir}/`);
    } else {
      console.log(`❌ ${dir}/ - Missing`);
      allExist = false;
    }
  }

  return allExist;
}

function checkPrismaSetup(): boolean {
  console.log('\n🗄️  Checking Prisma setup:\n');

  const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
  const clientPath = path.join(__dirname, '..', '..', 'node_modules', '@prisma', 'client');

  const schemaExists = fs.existsSync(schemaPath);
  const clientExists = fs.existsSync(clientPath);

  if (schemaExists) {
    console.log('✅ Prisma schema exists');
  } else {
    console.log('❌ Prisma schema missing');
  }

  if (clientExists) {
    console.log('✅ Prisma Client generated');
  } else {
    console.log('❌ Prisma Client not generated');
  }

  return schemaExists && clientExists;
}

async function main() {
  console.log('🔍 SmartNZ Environment Verification\n');
  console.log('═'.repeat(50));

  // Load .env file
  require('dotenv').config();

  const checks = [
    checkEnvFile(),
    checkEnvVariables(),
    checkDirectories(),
    checkPrismaSetup(),
  ];

  console.log('\n' + '═'.repeat(50));

  const allPassed = checks.every(check => check);

  if (allPassed) {
    console.log('\n✅ All checks passed! Environment is ready.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed. Please review the errors above.\n');
    console.log('💡 Tips:');
    console.log('   - Copy .env.example to .env and fill in values');
    console.log('   - Run: npm run db:generate');
    console.log('   - Check the setup documentation\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running verification:', error);
  process.exit(1);
});
