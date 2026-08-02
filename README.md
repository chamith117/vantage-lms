# Vantage LMS

> *"See learning from a new vantage point."*

Vantage is a local, self-hosted, gamified, and social-driven corporate training platform designed for enterprise clients. It runs entirely on local infrastructure with zero cloud dependencies, powered by Docker, NestJS, PostgreSQL, Redis, and React.

---

## 🌟 Key Platform Features

- **Gamified Rewards & Leaderboards**: Real-time company rankings powered by **Redis Sorted Sets**, XP point awards for completing lessons and passing quizzes, and unlockable achievement badges.
- **Course & Lesson Studio**: Support for structured modules, video lectures, document manuals (PDFs), text guides, and local disk file uploads.
- **Assessments & Auto-Grading**: Interactive multiple-choice and true-false quizzes with instant scoring, attempt tracking, and pass/fail thresholds.
- **Social Collaboration & Idea Box**: Lesson discussion threads with live emoji reactions (👍 ❤️ 🚀 💡 🎉) and a community Idea Box portal with admin review & response workflows.
- **Enterprise Analytics & CSV Export**: Visual charts (Recharts) showing course popularity, completion rates, quiz score distributions, and 1-click downloadable CSV performance reports.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `admin`, `manager`, and `learner` roles enforced via JWT guards.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS | Enterprise dark mode UI (`#1E3A5F` deep blue + `#F5A623` gold) |
| **Backend API** | Node.js + NestJS | Modular REST API with TypeORM & Passport JWT |
| **Database** | PostgreSQL 16 | Relational database (`vantage_lms`) |
| **Cache & Leaderboard** | Redis 7 | High-performance Redis Sorted Sets |
| **File Storage** | Local Disk (`/uploads`) | Self-hosted static file storage |
| **Containerization** | Docker + Docker Compose | Local multi-container orchestration (`project: vantage`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### 1. Run the Platform via Docker Compose
From the root directory of the project, run:

```bash
docker-compose up --build -d
```

This will launch 4 services:
1. `vantage-postgres` (Port `5432`)
2. `vantage-redis` (Port `6379`)
3. `vantage-backend` (Port `4000`)
4. `vantage-frontend` (Port `3000`)

### 2. Populate Seed Data for "Vantage Demo Corp"
To seed default organization data, sample courses, modules, lessons, quizzes, badges, and default user accounts, execute:

```bash
docker-compose exec backend npm run seed
```

### 3. Open Vantage in Browser
Navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Default Enterprise Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@vantage.local` | `Password123!` | Full admin rights, analytics, course creation, idea response |
| **Manager** | `manager@vantage.local` | `Password123!` | Course manager, analytics viewer, idea reviewer |
| **Learner** | `learner@vantage.local` | `Password123!` | Learner catalog, quiz runner, leaderboard, idea submission |

---

## ⚙️ Environment Variables

The project includes an `.env.example` file:

```env
# Application
PORT=4000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vantage_lms

# Redis Cache & Leaderboard
REDIS_HOST=redis
REDIS_PORT=6379

# Auth JWT Secret
JWT_SECRET=vantage_super_secret_jwt_key_2026
JWT_EXPIRATION=7d
```

---

## 📁 Repository Structure

```text
/LMS
├── docker-compose.yml         # Container orchestrator
├── .env.example               # Environment variables template
├── README.md                  # System documentation
├── /backend                   # NestJS REST API source code
│   ├── Dockerfile             # Backend container build script
│   ├── src/
│   │   ├── auth/              # JWT strategy, login/register, RolesGuard
│   │   ├── users/             # User entity and management service
│   │   ├── courses/           # Course, Module, Lesson entities & API
│   │   ├── enrollments/       # Progress tracking & completion logic
│   │   ├── quizzes/           # Auto-graded assessment engine
│   │   ├── gamification/      # Points, Badges, Redis Leaderboard service
│   │   ├── social/            # Comments, Emoji reactions, Idea Box
│   │   ├── analytics/         # Aggregated metrics & CSV report exporter
│   │   ├── uploads/           # Static file serving controller
│   │   └── seed/              # Database seed script for Vantage Demo Corp
│   └── uploads/               # Local disk file storage folder
└── /frontend                  # React + Vite + Tailwind CSS source code
    ├── Dockerfile             # Nginx container build script
    ├── nginx.conf             # Nginx proxy configuration
    └── src/
        ├── components/        # Navbar, QuizRunner, CommentSection, ProtectedRoute
        ├── context/           # AuthContext
        ├── pages/             # Landing, Login, Register, CoursesList, LessonViewer,
        │                      # AdminCourseEditor, LeaderboardPage, ProfilePage,
        │                      # IdeaBoxPage, AnalyticsPage
        └── services/          # Axios API client with JWT Interceptors
```

---

## 🧪 Local Testing & Verification

1. **Backend Health Check**: `curl http://localhost:4000/api/health`
2. **Frontend UI**: Browse `http://localhost:3000`, test quick demo logins, enroll in courses, take quizzes, and verify real-time points updates on the leaderboard!

---

&copy; 2026 **Vantage Demo Corp**. All rights reserved.
