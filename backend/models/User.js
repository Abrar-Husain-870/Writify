import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('PostgreSQL connection error:', err));

// Create users table
const createUsersTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            profile_picture VARCHAR(255),
            role VARCHAR(50) DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await pool.query(query);
};

module.exports = { pool, createUsersTable };