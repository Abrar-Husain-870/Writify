const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        // Read and execute SQL file
        const sqlPath = path.join(__dirname, 'init.sql');
        console.log(`Reading SQL file from: ${sqlPath}`);
        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        
        // Execute SQL commands
        console.log('Executing SQL commands...');
        await client.query(sqlContent);
        console.log('✅ Database tables created successfully');
        
        client.release();
    } catch (error) {
        console.error('❌ Error creating database tables:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };