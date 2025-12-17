# Result Management System (RMS) - MERN Stack

## Overview
A modern MERN-style academic result management platform. Students can upload results and view analytics, while professors can view comprehensive result analytics with pass rates, toppers, and exportable reports.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite (using better-sqlite3)
- **Authentication**: JWT + bcryptjs

## Project Structure
```
/backend
├── server.js           # Express server (port 3001)
├── database/init.js    # SQLite connection & schema
├── models/             # User.js, Marks.js
├── controllers/        # auth, student, professor, admin
├── routes/             # RESTful API endpoints
├── middleware/         # JWT authentication
└── uploads/            # Uploaded PDF files

/frontend
├── src/
│   ├── App.jsx         # React Router setup
│   ├── context/        # AuthContext
│   ├── services/       # API client
│   ├── pages/          # All page components
│   └── components/     # Reusable components
├── vite.config.js      # Vite + proxy config
└── tailwind.config.js  # Tailwind CSS
```

## Running the Application
The app runs with two workflows:
- **Backend Server**: `cd backend && npm run dev` (port 3001)
- **Frontend**: `cd frontend && npm run dev` (port 5000)

## Default Credentials
- **Admin/Professor**: username=`admin`, password=`admin123`

## Features
- Student & Professor registration/login
- PDF result upload with text extraction
- **Automatic backlog tracking** - When backlogs are cleared, original semester records are updated
- **Attempt tracking** - Stars (*) indicate number of attempts to clear a subject
- Semester performance tracking
- Class statistics (FCD/FC/SC/Fail)
- Top performers ranking
- Subject-wise pass/fail analysis
- CSV export functionality

## Optimizations
- **SQLite Database** with WAL mode for better performance
- **Rate limiting** - 100 requests/15min general, 10 uploads/min per user
- **Compression middleware** for faster response times
- **Batch database inserts** for marks using transactions
- **Async file operations** for PDF processing
- **Upload progress tracking** in frontend
- **Skeleton loading states** for better UX

## API Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/professor` - Professor registration
- `GET /api/student/marks` - Get student marks
- `POST /api/student/upload` - Upload result PDF
- `GET /api/professor/dashboard` - Professor dashboard
- `GET /api/professor/analytics/:branchId/:batchId/:sem` - Result analytics

## Environment Variables
- `JWT_SECRET` - Secret for JWT token signing

## Recent Changes
- **Dec 2024**: Switched from PostgreSQL to SQLite database for simpler deployment and self-contained storage
