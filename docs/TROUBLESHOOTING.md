# Troubleshooting Guide

This guide compiles common environmental issues, runtime error messages, and their corresponding solutions.

---

## 1. Win32 file Lock Exception (`WinError 32 PermissionError`)
- **Symptoms**: Pytest execution halts during database teardown displaying `PermissionError: [WinError 32] The process cannot access the file because it is being used by another process: './test_db.db'`.
- **Cause**: On Windows systems, SQLite active connections prevent files from being removed from disk before transactions are closed.
- **Solution**: Configure conftest database engines to use memory:
  ```python
  SQLALCHEMY_DATABASE_URL = "sqlite://"
  ```
  This creates in-memory databases and completely bypasses Windows disk locking issues.

---

## 2. Port Conflict on Host PostgreSQL Database (`5432`)
- **Symptoms**: Running `docker compose up` returns port binding errors because port `5432` is already in use.
- **Cause**: A local PostgreSQL database service is already running on your machine.
- **Solution**: Map the PostgreSQL container to port `5433` on the host side:
  ```yaml
  ports:
    - "5433:5432"
  ```
  FastAPI database configuration setting url will target `localhost:5433`.

---

## 3. OpenAI API Key Missing (`OPENAI_API_KEY`)
- **Symptoms**: Candidate resume parses return generic summaries, and candidate score reports always list a default `8.5` rating.
- **Cause**: The `.env` file does not contain a valid `OPENAI_API_KEY`.
- **Workaround**: The system automatically switches to regex matches or offline evaluation mocks to let recruiters run test sessions without billing credits. Insert a paid API key to trigger dynamic AI feedback evaluations.

---

## 4. Next.js Build-time Warnings
- **Symptoms**: Running `npm run build` triggers static page prerendering warning logs: `useSearchParams() should be wrapped in a Suspense boundary`.
- **Cause**: Next.js pages accessing query parameters must be wrapped inside Suspense structures to compile static pages.
- **Solution**: Wrap report visual page grids inside React `<Suspense>` blocks:
  ```typescript
  export default function ReportPage() {
    return (
      <Suspense fallback={<Loader />}>
        <ReportPageContent />
      </Suspense>
    );
  }
  ```

---

## 5. Whisper Audio Parser Failures
- **Symptoms**: Background transcription task outputs log warnings: `FileNotFoundError: [Errno 2] No such file or directory: 'ffmpeg'`.
- **Cause**: The host machine does not have `ffmpeg` audio slicing libraries installed.
- **Solution**:
  - **Windows**: Install ffmpeg via Scoop/Chocolatey:
    ```bash
    scoop install ffmpeg
    ```
  - **Docker**: The backend image installs `ffmpeg` automatically via `apt-get` packages. Run your application stack in Docker to guarantee execution.
