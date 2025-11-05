/**
 * Connection configuration with SSL certificate
 * This provides the proper pg connection config for Prisma
 */

const fs = require('fs');
const path = require('path');

const certPath = path.join(__dirname, 'certs', 'supabase-ca.pem');

// PostgreSQL connection configuration with SSL
const getConnectionConfig = () => {
  const config = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:moon86315@db.kzgyjiautyilpeahlqjp.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: true,
      ca: fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined,
    },
  };

  // If certificate doesn't exist, fall back to less strict SSL
  if (!fs.existsSync(certPath)) {
    console.warn('⚠️  SSL certificate not found, using rejectUnauthorized: false');
    config.ssl.rejectUnauthorized = false;
    delete config.ssl.ca;
  }

  return config;
};

module.exports = { getConnectionConfig, certPath };
