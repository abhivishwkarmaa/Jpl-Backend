# JPL Portfolio - Standalone Backend API Server

This is the standalone **Node.js + Express + Prisma (MySQL)** backend API service for the JPL IT Solution website and admin portal.

---

## 📁 Directory Structure

```text
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (MySQL)
│   └── d.pass                 # Database credentials reference
├── src/
│   ├── controllers/           # Business logic for all endpoints
│   ├── middleware/            # JWT authentication & CORS middleware
│   ├── routes/                # Express router endpoints
│   └── lib/                   # Prisma client singleton & auth helpers
├── scripts/
│   ├── seed-db.js             # Initial database seed script
│   └── test-db-connection.js  # Database health & connection tester
├── uploads/
│   └── blogs/                 # Local image uploads directory
├── .env                       # Environment variables (Database URL, JWT Secret)
├── .env.example               # Example template for environment configuration
├── package.json               # Backend dependencies & npm scripts
└── server.js                  # Main server entrypoint
```

---

## ⚙️ Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or configure your existing `.env`):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:admin@localhost:3306/jpl_portfolio"
JWT_SECRET="your_secure_jwt_secret"
ADMIN_DEFAULT_EMAIL="admin@jplitsolution.com"
ADMIN_DEFAULT_PASSWORD="admin_password_123"
CORS_ORIGIN="http://localhost:3000,https://jplitsolution.com"
```

### 3. Initialize Prisma & Database
```bash
# Push schema tables into your MySQL database
npm run db:push

# Generate Prisma Client
npm run db:generate

# (Optional) Seed initial data (Admin user, jobs, settings)
npm run db:seed
```

### 4. Start the Server
```bash
# Development (with auto-reload):
npm run dev

# Production:
npm start
```
Server will be available at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

---

## 📡 API Endpoints Reference

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/blogs` - Get all published blogs (or single blog by `?slug=...`)
- `GET /api/comments?slug=...` - Get approved comments for a blog
- `POST /api/comments` - Submit a blog comment
- `GET /api/careers/jobs` - Get active job openings
- `POST /api/careers/apply` - Submit a job application
- `POST /api/contact` - Submit a client contact inquiry
- `GET /api/settings/contact` - Get company contact info and social links

### Admin Endpoints (Protected by JWT)
- `POST /api/admin/auth/login` - Admin login (sets `admin_token` cookie)
- `POST /api/admin/auth/logout` - Admin logout (clears cookie)
- `GET /api/admin/auth/me` - Get current authenticated admin session
- `GET /api/admin/stats` - Dashboard analytics & counts
- `GET /api/admin/notifications` - Unread alerts & inquiries count
- `POST /api/admin/notifications` - Mark all notifications read
- `GET /api/admin/blogs` - Get all blog posts (published & drafts)
- `POST /api/admin/blogs` - Create blog post
- `PATCH /api/admin/blogs` - Update blog post
- `DELETE /api/admin/blogs?id=...` - Delete blog post
- `POST /api/admin/upload` - Upload blog images (Multer)
- `GET /api/admin/jobs` - List all jobs
- `POST /api/admin/jobs` - Create job opening
- `PATCH /api/admin/jobs` - Update job opening
- `DELETE /api/admin/jobs?id=...` - Delete job opening
- `GET /api/admin/jobs/applications` - List job applications
- `PATCH /api/admin/jobs/applications` - Update application status
- `DELETE /api/admin/jobs/applications?id=...` - Delete job application
- `GET /api/admin/inquiries` - List client inquiries
- `PATCH /api/admin/inquiries` - Update inquiry status
- `DELETE /api/admin/inquiries?id=...` - Delete inquiry
- `GET /api/admin/settings/contact` - Get company contact settings
- `POST /api/admin/settings/contact` - Update company contact settings

---

## 🚀 Deployment Guide

### Option 1: cPanel "Setup Node.js App"
1. In cPanel, navigate to **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js version**: 18.x or 20.x
   - **Application root**: `backend` (or your subdomain folder, e.g. `api.jplitsolution.com`)
   - **Application URL**: `api.jplitsolution.com` (or desired path)
   - **Application startup file**: `server.js`
3. Upload the `backend/` files via cPanel File Manager or FTP.
4. Click **Run NPM Install** in the cPanel Node.js App interface.
5. In cPanel, click **Add Variable** under Environment variables to add:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN` (`https://jplitsolution.com`)
6. Click **Restart** to run the backend service.

### Option 2: VPS (Ubuntu / Debian with PM2 & Nginx)
```bash
# 1. Clone or copy backend folder to server:
cd /var/www/jpl-backend

# 2. Install dependencies:
npm install --production

# 3. Generate prisma:
npx prisma generate

# 4. Start with PM2:
pm2 start server.js --name "jpl-api"
pm2 save
pm2 startup
```

### Option 3: Render / Railway
- Build Command: `npm install && npx prisma generate`
- Start Command: `npm start`
- Environment Variables: set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
