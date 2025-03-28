import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('PostgreSQL connection error:', err));

// Create assignments table
const createAssignmentsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS assignments (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            subject VARCHAR(255) NOT NULL,
            deadline TIMESTAMP NOT NULL,
            budget DECIMAL NOT NULL,
            status VARCHAR(50) DEFAULT 'open',
            posted_by INTEGER REFERENCES users(id),
            assigned_to INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await pool.query(query);
};

module.exports = { pool, createAssignmentsTable };