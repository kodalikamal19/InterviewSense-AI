# Production Deployment Guide

This guide details configuration settings, environment variables, and architecture checklists for deploying **InterviewSense AI** to production servers.

---

## 1. Production Config Environment Checklist

Ensure the following variables are configured inside your production orchestrator (e.g. AWS ECS, Kubernetes, or Heroku):

| Variable Name | Description | Production Value Recommendation |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection link | PostgreSQL managed service URL (e.g. AWS RDS) |
| `OPENAI_API_KEY` | Paid API keys for parsing and analysis | Secure environment secret key |
| `NEXT_PUBLIC_API_URL` | Frontend URL targeting REST APIs | Domain URL where backend is hosted (e.g. `https://api.interviewsense.com`) |

---

## 2. Docker Swarm / compose Production Setup

For basic staging environments, you can run services using a production-hardened compose file:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${PROD_DB_USER}
      POSTGRES_PASSWORD: ${PROD_DB_PASSWORD}
      POSTGRES_DB: interviewsense
    volumes:
      - pg_prod_data:/var/lib/postgresql/data

  backend:
    image: interviewsense-backend:latest
    restart: always
    environment:
      - DATABASE_URL=postgresql://${PROD_DB_USER}:${PROD_DB_PASSWORD}@postgres:5432/interviewsense
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - backend_uploads:/app/uploads

  frontend:
    image: interviewsense-frontend:latest
    restart: always
    ports:
      - "80:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.interviewsense.com/api
```

---

## 3. Storage Considerations

Because this prototype uses the local filesystem for uploading audio recordings and resumes, you must configure persistent storage volumes in production:
- **Docker Volumes**: Map `/app/uploads` on the backend container to a persistent volume (e.g. AWS EFS or digital ocean volume).
- **S3 Storage (Scale-out)**: For enterprise workloads, refactor `backend/app/utils/file_helper.py` to upload audio recordings directly to Amazon S3.

---

## 4. CORS Setup

In production, verify that `backend/app/main.py` CORSMiddleware has explicit origin permissions:
```python
origins = [
    "https://interviewsense.com",
    "https://www.interviewsense.com",
]
```
Avoid using wildcard (`"*"`) settings in production environments.
