# Docker Orchestration Guide

This guide explains how to compile, launch, and manage the containerized **InterviewSense AI** developer environment using Docker Compose.

---

## 1. Directory Setup

Ensure you are at the repository root folder where `docker-compose.yml` is registered:
```bash
cd InterviewSense-AI
```

---

## 2. Docker Commands Reference

### Build Container Images
Build the FastAPI backend and Next.js frontend images:
```bash
docker compose build
```
*(This triggers Next.js production builds and installs backend PyTorch dependencies inside isolated environments.)*

### Start All Services
Launch the PostgreSQL DB, backend server, and frontend server in the background:
```bash
docker compose up -d
```
The services will be exposed on:
- **Frontend App**: `http://localhost:3000`
- **Backend APIs**: `http://localhost:8000`
- **PostgreSQL Database**: `localhost:5433`

### Read Live Container Logs
Monitor runtime outputs and error streams:
- **All Services**:
  ```bash
  docker compose logs -f
  ```
- **Backend Container only**:
  ```bash
  docker compose logs -f backend
  ```
- **Frontend Container only**:
  ```bash
  docker compose logs -f frontend
  ```

### Stop Services
Tear down active containers and preserve volumes:
```bash
docker compose down
```

### Reset database volumes
To wipe database state completely and restart fresh:
```bash
docker compose down -v
docker compose up -d
```

### Rebuild and Restart after Code Changes
If you modify `requirements.txt` or `package.json` files and want to rebuild:
```bash
docker compose up --build -d
```
