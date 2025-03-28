const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// This script will import your schema and data to Neon
// Make sure you've set NEON_DATABASE_URL in your .env file

async function importToNeon() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error('Error: NEON_DATABASE_URL environment variable not set.');
    console.error('Please create a .env file in the backend directory with your Neon connection string.');
    console.error('Example: NEON_DATABASE_URL=postgres://user:password@endpoint/dbname');
    return;
  }

  console.log('Connecting to Neon database...');
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to Neon database.');

    // Read schema file
    console.log('Importing schema...');
    const schemaPath = path.join(__dirname, 'exports', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}. Run export_data.js first.`);
    }
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schemaSQL);
    console.log('Schema imported successfully.');

    // Read data file
    console.log('Importing data...');
    const dataPath = path.join(__dirname, 'exports', 'data.sql');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found at ${dataPath}. Run export_data.js first.`);
    }
    const dataSQL = fs.readFileSync(dataPath, 'utf8');
    
    // Execute data import
    await pool.query(dataSQL);
    console.log('Data imported successfully.');

    console.log('Database migration to Neon completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await pool.end();
  }
}

importToNeon();
