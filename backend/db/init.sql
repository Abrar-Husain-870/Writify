-- Drop existing tables if they exist
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS writer_portfolios CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS assignment_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_picture TEXT,
    role VARCHAR(50) DEFAULT 'student',
    university_stream VARCHAR(255),
    whatsapp_number VARCHAR(20),
    writer_status VARCHAR(20) CHECK (writer_status IN ('active', 'busy', 'inactive')),
    rating NUMERIC(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create writer_portfolios table
CREATE TABLE writer_portfolios (
    writer_id INTEGER PRIMARY KEY REFERENCES users(id),
    sample_work_image TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assignment_requests table
CREATE TABLE assignment_requests (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id),
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    assignment_type VARCHAR(100) NOT NULL,
    num_pages INTEGER NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_cost NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')),
    expiration_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES assignment_requests(id),
    writer_id INTEGER REFERENCES users(id),
    client_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create ratings table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    rater_id INTEGER REFERENCES users(id),
    rated_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    assignment_request_id INTEGER REFERENCES assignment_requests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (rater_id, assignment_request_id)
);