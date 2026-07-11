# Installation & Setup Guide

This guide details all step-by-step procedures to configure, build, and run the **InterviewSense AI** developer environment.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Git** (for version control)
- **Python v3.11** or **v3.13**
- **Node.js v18** or **v20** (with npm)
- **Docker Desktop** (to host PostgreSQL container)

---

## 2. Repository Cloning

```bash
git clone https://github.com/your-username/InterviewSense-AI.git
cd InterviewSense-AI
```

---

## 3. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Git Bash / macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure environment parameters:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and insert your API credentials:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/interviewsense
   OPENAI_API_KEY=your-openai-api-key-here
   ```

---

## 4. Database Setup (PostgreSQL)

The database runs inside a containerized PostgreSQL instance to bypass host service port conflicts.

1. Start the Docker Postgres service:
   Navigate to the repository root directory and run:
   ```bash
   docker compose up -d postgres
   ```
2. Apply database migrations:
   From the `/backend` folder (with virtual environment activated), execute Alembic schemas creation:
   ```bash
   alembic upgrade head
   ```

---

## 5. Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run Next.js development server:
   ```bash
   npm run dev
   ```

---

## 6. Verification

Open your browser to:
- **Recruiter Dashboard**: `http://localhost:3000`
- **Swagger API Docs**: `http://127.0.0.1:8000/docs`
