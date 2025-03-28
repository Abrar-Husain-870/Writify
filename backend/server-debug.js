// This is a temporary file to add more detailed logging to debug authentication issues
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

// Add more detailed logging for debugging
console.log('Environment variables:');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'not set (using default)');
console.log('- BACKEND_URL:', process.env.BACKEND_URL || 'not set (using default)');
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'set (hidden)' : 'not set');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set (hidden)' : 'not set');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'set (hidden)' : 'not set');

// Define frontend and backend URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
console.log('Using FRONTEND_URL:', FRONTEND_URL);
console.log('Using BACKEND_URL:', BACKEND_URL);

// Middleware setup with detailed logging
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('CORS configured with origin:', FRONTEND_URL);

// Configure session with more secure settings for production
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: BACKEND_URL.startsWith('https'), // Only use secure cookies on HTTPS
        httpOnly: true,
        sameSite: 'lax', // Helps with CSRF protection
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
console.log('Session configured with secure:', BACKEND_URL.startsWith('https'));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth callback URL
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/auth/google/callback`;
console.log('Using Google callback URL:', GOOGLE_CALLBACK_URL);

// Function to validate university email
const isValidUniversityEmail = (email) => {
    const isValid = email.endsWith('@student.iul.ac.in');
    console.log(`Email validation for ${email}: ${isValid}`);
    return isValid;
};

// Google OAuth Strategy with detailed logging
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, async (accessToken, refreshToken, profile, done) => {
    console.log('Google OAuth callback received for profile:', profile.id);
    try {
        // Check if the email is a valid university email
        const email = profile.emails[0].value;
        console.log('Processing OAuth callback for email:', email);
        
        if (!isValidUniversityEmail(email)) {
            console.log('Email validation failed for:', email);
            return done(null, false, { message: 'Only university students can sign up!' });
        }

        console.log('Email validation passed, checking user in database');
        const userResult = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [profile.id]
        );

        if (userResult.rows.length === 0) {
            console.log('Creating new user with email:', email);
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
            console.log('New user created with ID:', newUser.rows[0].id);
            return done(null, newUser.rows[0]);
        }

        console.log('Existing user found with ID:', userResult.rows[0].id);
        return done(null, userResult.rows[0]);
    } catch (error) {
        console.error('Database error during authentication:', error);
        return done(error);
    }
}));

// User serialization/deserialization with detailed logging
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user ID:', id);
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            console.log('User not found during deserialization for ID:', id);
            return done(null, false);
        }
        console.log('User deserialized successfully:', result.rows[0].id);
        done(null, result.rows[0]);
    } catch (error) {
        console.error('Deserialization error:', error);
        done(error);
    }
});

// Auth routes with detailed logging
app.get('/auth/google',
    (req, res, next) => {
        console.log('Initiating Google OAuth flow');
        next();
    },
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    (req, res, next) => {
        console.log('Google OAuth callback received with query:', req.query);
        
        passport.authenticate('google', (err, user, info) => {
            console.log('Auth callback authentication result:', { 
                error: err ? 'Yes' : 'No', 
                user: user ? `ID: ${user.id}` : 'None', 
                info: info 
            });
            
            if (err) {
                console.error('Authentication error:', err);
                return res.redirect(`${FRONTEND_URL}/login?error=server`);
            }
            
            if (!user) {
                console.log('Authentication failed:', info?.message);
                return res.redirect(`${FRONTEND_URL}/login?error=unauthorized`);
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.redirect(`${FRONTEND_URL}/login?error=server`);
                }
                console.log('User logged in successfully, redirecting to dashboard');
                return res.redirect(`${FRONTEND_URL}/dashboard`);
            });
        })(req, res, next);
    }
);

// Auth status endpoint with detailed logging
app.get('/api/auth/status', (req, res) => {
    console.log('Auth status check for user:', req.user?.id);
    if (req.isAuthenticated()) {
        console.log('User is authenticated:', req.user.id);
        return res.json({ 
            isAuthenticated: true, 
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                profile_picture: req.user.profile_picture
            } 
        });
    }
    console.log('User is not authenticated');
    res.json({ isAuthenticated: false });
});

// Logout route with detailed logging
app.get('/auth/logout', (req, res) => {
    console.log('Logging out user:', req.user?.id);
    
    req.logout(function(err) {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        
        console.log('User logged out successfully, clearing session cookie');
        res.clearCookie('connect.sid');
        
        console.log('Redirecting to login page');
        res.redirect(`${FRONTEND_URL}/login`);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
