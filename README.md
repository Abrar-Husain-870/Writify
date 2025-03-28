# Writify

Writify is an assignment marketplace platform that connects students with writers for academic assistance.

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: Google OAuth via Passport.js

## Local Development Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your local PostgreSQL credentials and Google OAuth credentials.

5. Initialize the database:
   ```
   npm run setup-db
   ```

6. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Deployment

### Database Deployment on Railway

1. Create a Railway account at [railway.app](https://railway.app)

2. Create a new PostgreSQL database project:
   - Click "New Project" and select "PostgreSQL"
   - Railway will provision a PostgreSQL database for you

3. Get your database connection string:
   - Go to your PostgreSQL service dashboard
   - Click on "Connect" tab
   - Copy the "PostgreSQL Connection URL"

4. Set up the database schema:
   - Set the `DATABASE_URL` environment variable in your local `.env` file to the Railway connection URL
   - Run `npm run setup-db` from the backend directory to initialize the database schema

### Backend Deployment on Render

1. Create a Render account at [render.com](https://render.com)

2. Create a new Web Service:
   - Connect your GitHub repository
   - Select the repository and branch
   - Configure the service:
     - Name: `writify-backend`
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. Add environment variables:
   - `DATABASE_URL`: Your Railway PostgreSQL connection URL
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `SESSION_SECRET`: A secure random string
   - `NODE_ENV`: Set to `production`

### Frontend Deployment on Vercel/Netlify

1. Create an account on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

2. Connect your GitHub repository

3. Configure the deployment:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. Add environment variables:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://writify-backend.onrender.com`)

## Image Handling

Writify uses external image hosting. Users should:
1. Upload images to services like Google Drive, Imgur, etc.
2. Get a shareable link
3. Paste the URL into the appropriate fields in the application

## Features

- Google OAuth authentication with university email validation
- Writer discovery with ratings and profiles
- Assignment request submission and management
- Request expiration system
- Writer portfolio management
- Rating system for quality assurance
- WhatsApp integration for direct communication