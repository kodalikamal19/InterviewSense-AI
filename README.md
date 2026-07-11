# InterviewSense AI — Interview Intelligence System

InterviewSense AI is an AI-powered prototype designed to assist recruiters before, during, and after interview sessions. It analyzes candidate resumes, parses target job descriptions, records live browser sessions, transcribes dialogues (OpenAI Whisper), runs speaker diarization (turns separation), pairs graded technical/non-technical Q&As, validates resume consistency metrics, evaluates communication speeds, and generates downloadable evaluations.

---

## 1. Documentation Guides Directory

For detailed manuals and specs, refer to our comprehensive manuals:

- 📋 **[Installation Guide](file:///C:/Users/kodal/OneDrive/Desktop/btech-project/Interview/docs/INSTALLATION.md)**: Steps for setup, dependencies, database migrations, and local verification.
- 🔗 **[API Documentation Manual](file:///C:/Users/kodal/OneDrive/Desktop/btech-project/Interview/docs/API_DOCUMENTATION.md)**: HTTP routers, endpoints, parameter bodies, and JSON formats.
- 🗄️ **[Database Schema & ER Diagram](file:///C:/Users/kodal/OneDrive/Desktop/btech-project/Interview/docs/DATABASE_SCHEMA.md)**: PostgreSQL schemas, metadata models, and Mermaid database layouts.
- 🐳 **[Docker Orchestration Guide](file:///C:/Users/kodal/OneDrive/Desktop/btech-project/Interview/docs/DOCKER_GUIDE.md)**: Command references for compose up/down/rebuild configurations.
- 🚀 **[Production Deployment Manual](file:///C:/Users/kodal/OneDrive/Desktop/btech-project/Interview/docs/DEPLOYMENT.md)**: CORS controls, environments variable configurations, and storage checklists.
- 🛠️ **[Troubleshooting Guide](file:///C:/Users/kodal/OneDrive/Desktop/btech-project/Interview/docs/TROUBLESHOOTING.md)**: Common locks, DB ports, and ffmpeg failures solutions.

---

## 2. Directory Structure

```text
Interview/
├── docs/                   # System manuals
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/            # Router controllers
│   │   ├── services/       # Core business logics
│   │   ├── database/       # DB session connections
│   │   ├── models/         # SQLAlchemy metadata models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Rotators and config files
│   ├── tests/              # Pytest integrations suite
│   ├── Dockerfile          # Python backend container
│   ├── requirements.txt    # Python wheels list
│   └── .env.example        # Environment variables template
│
├── frontend/               # Next.js React Application
│   ├── src/
│   │   ├── app/            # App router pages & layouts
│   │   ├── components/     # Navigation lists & sidebars
│   │   ├── services/       # Fetch connection client
│   │   └── utils/          # Helpers
│   ├── Dockerfile          # NextJS frontend container
│   └── package.json        # Node requirements list
│
└── docker-compose.yml      # Orchestration compose configurations
```

---

## 3. Quick Run Options

### Local Development

1. **Start PostgreSQL Database**:
   ```bash
   docker compose up -d postgres
   ```
2. **Start Backend Server**:
   ```bash
   cd backend
   .\venv\Scripts\activate
   alembic upgrade head
   python -m uvicorn app.main:app --reload
   ```
3. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```

### Docker Compose Orchestration

To run the entire containerized stack on localhost ports `3000` (frontend), `8000` (backend), and `5433` (postgres db):
```bash
docker compose up --build -d
```
Monitor live streams using:
```bash
docker compose logs -f
```
