const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

// Configure PostgreSQL connection with Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon connections
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL on Neon'))
    .catch(err => console.error('Error connecting to PostgreSQL:', err));

// Improved session configuration for cross-domain authentication
const BACKEND_URL = 'https://writify-backend-fj0i.onrender.com';
const FRONTEND_URL = 'https://writify-frontend.vercel.app';
const isProduction = true; // Since we're using Render and Vercel

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Render/Vercel deployments
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'none', // Required for cross-site cookies
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: 'writify-backend-fj0i.onrender.com' // Specific to your backend domain
    }
}));

// Middleware setup - Update CORS configuration
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
}));

app.set('trust proxy', 1); // Required for secure cookies with proxy

app.use(express.json());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Add this before your passport strategy
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/auth/google/callback`;

// Function to validate university email
const isValidUniversityEmail = (email) => {
    const isValid = email.endsWith('@student.iul.ac.in');
    console.log(`Email validation for ${email}: ${isValid}`);
    return isValid;
};

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the email is a valid university email
        const email = profile.emails[0].value;
        console.log('Processing OAuth callback for email:', email);
        
        if (!isValidUniversityEmail(email)) {
            console.log('Email validation failed');
            return done(null, false, { message: 'Only university students can sign up!' });
        }

        console.log('Email validation passed, checking user in database');
        const userResult = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [profile.id]
        );

        if (userResult.rows.length === 0) {
            console.log('Creating new user');
            const newUser = await pool.query(
                `INSERT INTO users (google_id, email, name, profile_picture) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [
                    profile.id,
                    email,
                    profile.displayName,
                    profile.photos?.[0]?.value || null
                ]
            );
            return done(null, newUser.rows[0]);
        }

        console.log('Existing user found');
        return done(null, userResult.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user:', id);
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        console.error('Deserialization error:', error);
        done(error);
    }
});

// Auth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    (req, res, next) => {
        passport.authenticate('google', (err, user, info) => {
            console.log('Auth callback received:', { err, user, info });
            
            if (err) {
                console.error('Authentication error:', err);
                return res.redirect(`${FRONTEND_URL}/login?error=server`);
            }
            
            if (!user) {
                console.log('Authentication failed:', info?.message);
                return res.redirect(`${FRONTEND_URL}/login?error=unauthorized`);
            }

            // Use req.login instead of req.logIn for better compatibility
            req.login(user, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.redirect(`${FRONTEND_URL}/login?error=server`);
                }
                
                // Add session debugging
                console.log('User logged in successfully. Session ID:', req.sessionID);
                console.log('Session data:', req.session);
                
                // Set a cookie to help with session tracking
                res.cookie('writify_session_check', 'true', { 
                    maxAge: 24 * 60 * 60 * 1000,
                    httpOnly: false,
                    secure: isProduction,
                    sameSite: isProduction ? 'none' : 'lax'
                });
                
                return res.redirect(`${FRONTEND_URL}/dashboard`);
            });
        })(req, res, next);
    }
);

// Logout route
app.get('/auth/logout', (req, res) => {
    console.log('Logging out user:', req.user?.id);
    
    // Simple approach that works with any Passport.js version
    req.logout(function(err) {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        
        // Redirect to login page
        res.redirect(`${FRONTEND_URL}/login`);
    });
});

// Auth status endpoint
app.get('/api/auth/status', (req, res) => {
    console.log('Auth status check for user:', req.user?.id);
    console.log('Session ID:', req.sessionID);
    console.log('Is authenticated:', req.isAuthenticated());
    
    if (req.isAuthenticated()) {
        return res.json({ 
            isAuthenticated: true, 
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                profile_picture: req.user.profile_picture
            },
            sessionID: req.sessionID
        });
    }
    
    res.json({ 
        isAuthenticated: false,
        sessionID: req.sessionID
    });
});

// Auth status endpoint
app.get('/auth/status', (req, res) => {
    console.log('Auth status check:', { 
        isAuthenticated: req.isAuthenticated(),
        user: req.user 
    });
    
    if (req.isAuthenticated()) {
        res.json({ 
            isAuthenticated: true, 
            user: req.user 
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log('Authentication check:', req.isAuthenticated(), req.user);
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
}

// API Routes
app.get('/api/writers', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, wp.sample_work_image 
            FROM users u
            LEFT JOIN writer_portfolios wp ON wp.writer_id = u.id
            WHERE u.writer_status IS NOT NULL
            ORDER BY u.rating DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching writers:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/writers/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, wp.sample_work_image 
            FROM users u
            LEFT JOIN writer_portfolios wp ON wp.writer_id = u.id
            WHERE u.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Writer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching writer:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/assignment-requests', isAuthenticated, async (req, res) => {
    const { course_name, course_code, assignment_type, num_pages, deadline, estimated_cost } = req.body;
    
    try {
        // Validate required fields
        if (!course_name || !course_code || !assignment_type || !num_pages || !deadline || !estimated_cost) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate numeric fields
        if (isNaN(parseInt(num_pages)) || isNaN(parseFloat(estimated_cost))) {
            return res.status(400).json({ error: 'Number of pages and estimated cost must be numbers' });
        }
        
        // Validate field lengths based on database schema
        if (course_name.length > 255) {
            return res.status(400).json({ error: 'Course name must be less than 255 characters' });
        }
        
        if (course_code.length > 50) {
            return res.status(400).json({ error: 'Course code must be less than 50 characters' });
        }
        
        if (assignment_type.length > 100) {
            return res.status(400).json({ error: 'Assignment type must be less than 100 characters' });
        }

        // Calculate expiration deadline (7 days from now by default)
        const now = new Date();
        const expirationDeadline = new Date(now);
        expirationDeadline.setDate(now.getDate() + 7);
        
        // Format deadline as ISO string if it's not already
        let formattedDeadline = deadline;
        if (!(deadline instanceof Date) && !isNaN(Date.parse(deadline))) {
            formattedDeadline = new Date(deadline).toISOString();
        }

        // Ensure values are properly formatted and truncated to match database constraints
        const sanitizedData = {
            client_id: req.user.id,
            course_name: course_name.substring(0, 255),
            course_code: course_code.substring(0, 50),
            assignment_type: assignment_type.substring(0, 100),
            num_pages: parseInt(num_pages),
            deadline: formattedDeadline,
            // Round estimated cost to the nearest multiple of 50
            estimated_cost: Math.round(parseFloat(estimated_cost) / 50) * 50,
            expiration_deadline: expirationDeadline.toISOString()
        };

        console.log('Creating assignment request with data:', sanitizedData);

        const result = await pool.query(`
            INSERT INTO assignment_requests 
            (client_id, course_name, course_code, assignment_type, num_pages, deadline, estimated_cost, status, expiration_deadline)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8)
            RETURNING *
        `, [
            sanitizedData.client_id, 
            sanitizedData.course_name, 
            sanitizedData.course_code, 
            sanitizedData.assignment_type, 
            sanitizedData.num_pages, 
            sanitizedData.deadline, 
            sanitizedData.estimated_cost, 
            sanitizedData.expiration_deadline
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating assignment request:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.get('/api/assignment-requests', isAuthenticated, async (req, res) => {
    try {
        // Comment out the writer role check to allow all authenticated users to browse requests
        // if (req.user.role !== 'writer') {
        //     return res.status(403).json({ error: 'Only writers can browse assignment requests' });
        // }

        const result = await pool.query(`
            SELECT 
                ar.id,
                ar.course_name,
                ar.course_code,
                ar.assignment_type,
                ar.num_pages,
                ar.deadline,
                ar.estimated_cost,
                ar.status,
                ar.created_at,
                ar.expiration_deadline,
                u.id as client_id,
                u.name as client_name,
                u.rating as client_rating,
                u.total_ratings as client_total_ratings,
                u.profile_picture as client_profile_picture
            FROM assignment_requests ar
            JOIN users u ON u.id = ar.client_id
            WHERE ar.status = 'open' AND (ar.expiration_deadline IS NULL OR ar.expiration_deadline > NOW())
            ORDER BY ar.created_at DESC
        `);
        
        // Transform the data to match the expected format in the frontend
        const transformedRequests = result.rows.map(req => ({
            id: req.id,
            client: {
                id: req.client_id,
                name: req.client_name,
                rating: req.client_rating || 0,
                total_ratings: req.client_total_ratings || 0,
                profile_picture: req.client_profile_picture
            },
            course_name: req.course_name,
            course_code: req.course_code,
            assignment_type: req.assignment_type,
            num_pages: req.num_pages,
            deadline: req.deadline,
            expiration_deadline: req.expiration_deadline,
            estimated_cost: req.estimated_cost,
            status: req.status,
            created_at: req.created_at
        }));

        console.log(`Found ${transformedRequests.length} open assignment requests`);
        res.json(transformedRequests);
    } catch (error) {
        console.error('Error fetching assignment requests:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/assignment-requests/:id/accept', isAuthenticated, async (req, res) => {
    const requestId = req.params.id;
    
    try {
        // Start transaction
        await pool.query('BEGIN');
        
        // Update request status
        const requestResult = await pool.query(`
            UPDATE assignment_requests 
            SET status = 'assigned'
            WHERE id = $1 AND status = 'open'
            RETURNING *
        `, [requestId]);
        
        if (requestResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found or already assigned' });
        }
        
        // Create assignment
        await pool.query(`
            INSERT INTO assignments (request_id, writer_id, client_id, status)
            VALUES ($1, $2, $3, 'in_progress')
        `, [requestId, req.user.id, requestResult.rows[0].client_id]);
        
        // Update writer status
        await pool.query(`
            UPDATE users 
            SET writer_status = 'busy'
            WHERE id = $1
        `, [req.user.id]);
        
        await pool.query('COMMIT');
        
        // Get client's WhatsApp number
        const clientResult = await pool.query(`
            SELECT whatsapp_number 
            FROM users 
            WHERE id = $1
        `, [requestResult.rows[0].client_id]);
        
        res.json({
            ...requestResult.rows[0],
            client_whatsapp: clientResult.rows[0].whatsapp_number
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error accepting assignment request:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's assignments
app.get('/api/my-assignments', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if user is authenticated and has a valid role
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log(`Fetching assignments for user ${userId} with role ${userRole}`);

        // For student role, treat them as a client
        const effectiveRole = userRole === 'student' ? 'client' : userRole;

        if (effectiveRole === 'client') {
            // Get client assignments
            const result = await pool.query(`
                SELECT 
                    ar.id as request_id,
                    ar.course_name,
                    ar.course_code,
                    ar.assignment_type,
                    ar.num_pages,
                    ar.deadline,
                    ar.estimated_cost,
                    a.created_at,
                    COALESCE(a.status, 'pending') as status,
                    a.completed_at,
                    writer.id as writer_id,
                    writer.name as writer_name,
                    writer.email as writer_email,
                    writer.profile_picture as writer_profile_picture,
                    COALESCE(writer.rating::numeric, 0.0) as writer_rating,
                    COALESCE(writer.total_ratings, 0) as writer_total_ratings,
                    writer.whatsapp_number as writer_whatsapp_number,
                    client.id as client_id,
                    client.name as client_name,
                    client.email as client_email,
                    client.profile_picture as client_profile_picture,
                    COALESCE(client.rating::numeric, 0.0) as client_rating,
                    COALESCE(client.total_ratings, 0) as client_total_ratings,
                    client.whatsapp_number as client_whatsapp_number
                FROM assignment_requests ar
                LEFT JOIN assignments a ON ar.id = a.request_id
                LEFT JOIN users writer ON a.writer_id = writer.id
                JOIN users client ON ar.client_id = client.id
                WHERE ar.client_id = $1
                ORDER BY ar.created_at DESC
            `, [userId]);
            
            console.log(`Found ${result.rows.length} assignments for client ${userId}`);

            // Get ratings submitted by this user
            const ratingsResult = await pool.query(`
                SELECT assignment_request_id, rated_id 
                FROM ratings 
                WHERE rater_id = $1
            `, [userId]);
            
            // Create a map of rated assignments for quick lookup
            const ratedAssignments = new Map();
            ratingsResult.rows.forEach(rating => {
                ratedAssignments.set(rating.assignment_request_id, rating.rated_id);
            });

            // Transform the data
            const transformedAssignments = result.rows.map(a => ({
                id: a.request_id,
                request_id: a.request_id,
                writer: a.writer_id ? {
                    id: a.writer_id,
                    name: a.writer_name,
                    email: a.writer_email,
                    profile_picture: a.writer_profile_picture,
                    rating: a.writer_rating,
                    total_ratings: a.writer_total_ratings,
                    whatsapp_number: a.writer_whatsapp_number
                } : null,
                client: {
                    id: a.client_id,
                    name: a.client_name,
                    email: a.client_email,
                    profile_picture: a.client_profile_picture,
                    rating: a.client_rating,
                    total_ratings: a.client_total_ratings,
                    whatsapp_number: a.client_whatsapp_number
                },
                status: a.status,
                created_at: a.created_at,
                completed_at: a.completed_at,
                course_name: a.course_name,
                course_code: a.course_code,
                assignment_type: a.assignment_type,
                num_pages: a.num_pages,
                deadline: a.deadline,
                estimated_cost: a.estimated_cost,
                // Check if client has rated the writer
                has_rated_writer: a.writer_id ? ratedAssignments.has(a.request_id) && ratedAssignments.get(a.request_id) === a.writer_id : false,
                has_rated_client: false // Clients don't rate themselves
            }));

            res.json({ 
                role: 'client',
                assignments: transformedAssignments 
            });
        } else if (effectiveRole === 'writer') {
            // Get writer assignments
            const result = await pool.query(`
                SELECT 
                    ar.id as request_id,
                    ar.course_name,
                    ar.course_code,
                    ar.assignment_type,
                    ar.num_pages,
                    ar.deadline,
                    ar.estimated_cost,
                    a.created_at,
                    a.status,
                    a.completed_at,
                    writer.id as writer_id,
                    writer.name as writer_name,
                    writer.email as writer_email,
                    writer.profile_picture as writer_profile_picture,
                    COALESCE(writer.rating::numeric, 0.0) as writer_rating,
                    COALESCE(writer.total_ratings, 0) as writer_total_ratings,
                    writer.whatsapp_number as writer_whatsapp_number,
                    client.id as client_id,
                    client.name as client_name,
                    client.email as client_email,
                    client.profile_picture as client_profile_picture,
                    COALESCE(client.rating::numeric, 0.0) as client_rating,
                    COALESCE(client.total_ratings, 0) as client_total_ratings,
                    client.whatsapp_number as client_whatsapp_number
                FROM assignments a
                JOIN assignment_requests ar ON a.request_id = ar.id
                JOIN users writer ON a.writer_id = writer.id
                JOIN users client ON ar.client_id = client.id
                WHERE a.writer_id = $1
                ORDER BY a.created_at DESC
            `, [userId]);
            
            console.log(`Found ${result.rows.length} assignments for writer ${userId}`);

            // Get ratings submitted by this user
            const ratingsResult = await pool.query(`
                SELECT assignment_request_id, rated_id 
                FROM ratings 
                WHERE rater_id = $1
            `, [userId]);
            
            // Create a map of rated assignments for quick lookup
            const ratedAssignments = new Map();
            ratingsResult.rows.forEach(rating => {
                ratedAssignments.set(rating.assignment_request_id, rating.rated_id);
            });

            // Transform the data
            const transformedAssignments = result.rows.map(a => ({
                id: a.request_id,
                request_id: a.request_id,
                writer: {
                    id: a.writer_id,
                    name: a.writer_name,
                    email: a.writer_email,
                    profile_picture: a.writer_profile_picture,
                    rating: a.writer_rating,
                    total_ratings: a.writer_total_ratings,
                    whatsapp_number: a.writer_whatsapp_number
                },
                client: {
                    id: a.client_id,
                    name: a.client_name,
                    email: a.client_email,
                    profile_picture: a.client_profile_picture,
                    rating: a.client_rating,
                    total_ratings: a.client_total_ratings,
                    whatsapp_number: a.client_whatsapp_number
                },
                status: a.status,
                created_at: a.created_at,
                completed_at: a.completed_at,
                course_name: a.course_name,
                course_code: a.course_code,
                assignment_type: a.assignment_type,
                num_pages: a.num_pages,
                deadline: a.deadline,
                estimated_cost: a.estimated_cost,
                has_rated_writer: false, // Writers don't rate themselves
                // Check if writer has rated the client
                has_rated_client: ratedAssignments.has(a.request_id) && ratedAssignments.get(a.request_id) === a.client_id
            }));

            res.json({ 
                role: effectiveRole,
                assignments: transformedAssignments 
            });
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's ratings and reviews
app.get('/api/my-ratings', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`Fetching ratings for user ${userId}`);
        
        // Get the user's current average rating
        const userResult = await pool.query(`
            SELECT rating, total_ratings FROM users WHERE id = $1
        `, [userId]);
        
        const averageRating = parseFloat(userResult.rows[0]?.rating) || 0;
        const totalRatings = parseInt(userResult.rows[0]?.total_ratings) || 0;
        
        console.log(`User ${userId} has average rating ${averageRating} from ${totalRatings} ratings`);
        
        // Return just the user's average rating for now
        // This simplified endpoint should work even if the detailed ratings query fails
        res.json({
            ratings: [],
            averageRating,
            totalRatings
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get user profile
app.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, wp.sample_work_image, wp.description as portfolio_description
            FROM users u
            LEFT JOIN writer_portfolios wp ON wp.writer_id = u.id
            WHERE u.id = $1
        `, [req.user.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        const { portfolio_description, sample_work_image, ...userData } = user;
        
        res.json({
            ...userData,
            portfolio: portfolio_description || sample_work_image ? {
                description: portfolio_description,
                sample_work_image
            } : null
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update writer profile
app.put('/api/profile/writer', isAuthenticated, async (req, res) => {
    const { university_stream, whatsapp_number, writer_status } = req.body;
    
    try {
        console.log('Updating writer profile with data:', { university_stream, whatsapp_number, writer_status });
        console.log('User ID:', req.user.id);
        
        // Validate writer_status
        if (writer_status && !['active', 'busy', 'inactive'].includes(writer_status)) {
            console.log('Invalid writer status:', writer_status);
            return res.status(400).json({ error: 'Invalid writer status' });
        }
        
        const result = await pool.query(`
            UPDATE users 
            SET university_stream = $1,
                whatsapp_number = $2,
                writer_status = $3
            WHERE id = $4
            RETURNING *
        `, [university_stream, whatsapp_number, writer_status, req.user.id]);
        
        if (result.rows.length === 0) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('Writer profile updated successfully:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating writer profile:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Update writer portfolio
app.post('/api/profile/portfolio', isAuthenticated, async (req, res) => {
    const { sample_work_image, description } = req.body;
    
    try {
        const result = await pool.query(`
            INSERT INTO writer_portfolios (writer_id, sample_work_image, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (writer_id) 
            DO UPDATE SET 
                sample_work_image = EXCLUDED.sample_work_image,
                description = EXCLUDED.description
            RETURNING *
        `, [req.user.id, sample_work_image, description]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating writer portfolio:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user's WhatsApp number (for testing)
app.post('/api/update-whatsapp', isAuthenticated, async (req, res) => {
    try {
        const { whatsapp_number } = req.body;
        const userId = req.user.id;
        
        if (!whatsapp_number) {
            return res.status(400).json({ error: 'WhatsApp number is required' });
        }
        
        console.log(`Updating WhatsApp number for user ${userId} to ${whatsapp_number}`);
        
        await pool.query(
            'UPDATE users SET whatsapp_number = $1 WHERE id = $2',
            [whatsapp_number, userId]
        );
        
        res.json({ message: 'WhatsApp number updated successfully' });
    } catch (error) {
        console.error('Error updating WhatsApp number:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit rating
app.post('/api/ratings', isAuthenticated, async (req, res) => {
    const { rated_id, rating, comment, assignment_request_id } = req.body;
    
    try {
        console.log('Received rating submission:', { 
            rater_id: req.user.id, 
            rated_id, 
            rating, 
            comment, 
            assignment_request_id 
        });
        
        // Validate input
        if (!rated_id || !rating || !assignment_request_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Start transaction
        await pool.query('BEGIN');
        
        // Check if rating already exists
        const existingRating = await pool.query(`
            SELECT id FROM ratings 
            WHERE ratings.rater_id = $1 AND ratings.assignment_request_id = $2
        `, [req.user.id, assignment_request_id]);
        
        if (existingRating.rows.length > 0) {
            // Update existing rating instead of inserting a new one
            await pool.query(`
                UPDATE ratings 
                SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP
                WHERE rater_id = $3 AND assignment_request_id = $4
            `, [rating, comment, req.user.id, assignment_request_id]);
            console.log(`Updated existing rating for assignment ${assignment_request_id}`);
        } else {
            // Add new rating
            await pool.query(`
                INSERT INTO ratings (rater_id, rated_id, rating, comment, assignment_request_id)
                VALUES ($1, $2, $3, $4, $5)
            `, [req.user.id, rated_id, rating, comment, assignment_request_id]);
            console.log(`Added new rating for assignment ${assignment_request_id}`);
        }
        
        // Update user's average rating
        await pool.query(`
            WITH rating_stats AS (
                SELECT 
                    rated_id,
                    AVG(rating)::numeric(3,2) as avg_rating,
                    COUNT(*) as total_ratings
                FROM ratings
                WHERE rated_id = $1
                GROUP BY rated_id
            )
            UPDATE users
            SET rating = rs.avg_rating,
                total_ratings = rs.total_ratings
            FROM rating_stats rs
            WHERE users.id = rs.rated_id
        `, [rated_id]);
        
        // Update assignment status to completed
        const updateAssignmentResult = await pool.query(`
            UPDATE assignments
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP
            FROM assignment_requests ar
            WHERE ar.id = $1
            AND assignments.request_id = ar.id
            RETURNING assignments.id, assignments.status
        `, [assignment_request_id]);
        
        if (updateAssignmentResult.rows.length > 0) {
            console.log(`Assignment ${updateAssignmentResult.rows[0].id} status updated to: ${updateAssignmentResult.rows[0].status}`);
        } else {
            console.log(`No assignment found for request ID ${assignment_request_id}`);
            
            // Try to find the assignment to debug
            const findAssignment = await pool.query(`
                SELECT a.id, a.status, a.request_id 
                FROM assignments a
                JOIN assignment_requests ar ON a.request_id = ar.id
                WHERE ar.id = $1
            `, [assignment_request_id]);
            
            if (findAssignment.rows.length > 0) {
                console.log(`Found assignment: `, findAssignment.rows[0]);
            } else {
                console.log(`No assignment record exists for request ID ${assignment_request_id}`);
            }
        }
        
        await pool.query('COMMIT');
        res.status(201).json({ message: 'Rating submitted successfully and assignment marked as completed' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error submitting rating:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get user's assignments (temporary version without authentication for testing)
app.get('/api/my-assignments-test', async (req, res) => {
    try {
        // For testing purposes, we'll return generic sample data
        const sampleData = {
            role: 'client',
            assignments: [
                {
                    id: 1,
                    request_id: 1,
                    writer: {
                        id: 2,
                        name: 'Writer Name',
                        email: 'writer@example.com',
                        profile_picture: '',
                        rating: 4.5, // Ensure this is a number
                        total_ratings: 3,
                        whatsapp_number: '1234567890'
                    },
                    client: {
                        id: 1,
                        name: 'Client Name',
                        email: 'client@example.com',
                        profile_picture: '',
                        rating: 4.0, // Ensure this is a number
                        total_ratings: 2,
                        whatsapp_number: '0987654321'
                    },
                    status: 'in_progress',
                    created_at: '2023-01-01T00:00:00Z',
                    completed_at: null,
                    course_name: 'Sample Course',
                    course_code: 'CS101',
                    assignment_type: 'Assignment',
                    num_pages: 5,
                    deadline: '2023-04-15T00:00:00Z',
                    estimated_cost: 500,
                    has_rated_writer: false,
                    has_rated_client: false
                }
            ]
        };
        
        res.json(sampleData);
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Complete assignment endpoint
app.put('/api/assignments/:id/complete', isAuthenticated, async (req, res) => {
    const assignmentId = req.params.id;
    
    try {
        // Check if the user is the writer of this assignment
        const assignmentCheck = await pool.query(
            'SELECT * FROM assignments WHERE id = $1 AND writer_id = $2',
            [assignmentId, req.user.id]
        );
        
        if (assignmentCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to complete this assignment' });
        }
        
        // Update the assignment status to completed
        const result = await pool.query(
            'UPDATE assignments SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *',
            ['completed', assignmentId]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error completing assignment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Test endpoint - no authentication required
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend server is working correctly' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        message: err.message 
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested resource was not found' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});