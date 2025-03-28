const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initializeNeonDatabase() {
  console.log('Initializing Neon database...');
  
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('Successfully connected to Neon database at:', testResult.rows[0].now);
    
    // Read the init.sql file
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    console.log('Executing database initialization script...');
    
    // Execute the SQL script
    await pool.query(initSql);
    
    console.log('Database initialization completed successfully!');
    
    // Optional: Insert test data if needed
    // await insertTestData(pool);
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Uncomment and modify this function if you want to add test data
/*
async function insertTestData(pool) {
  console.log('Inserting test data...');
  
  // Add your test data insertion queries here
  
  console.log('Test data inserted successfully!');
}
*/

// Run the initialization
initializeNeonDatabase();
