# SnapSave Pro

A professional social media downloader platform for Instagram and YouTube.

## Project Structure
- `frontend/`: Next.js 15+ (React 19)
- `backend/`: FastAPI extraction engine
- `docs/`: Architecture and design documentation

## Getting Started

### Backend Setup
1. Navigate to `/backend`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
4. Install dependencies: `pip install -r requirements.txt`.
5. Run the server: `python main.py`.

### Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Run the dev server: `npm run dev`.

## Tech Stack
- **Frontend**: Next.js, TypeScript, Vanilla CSS
- **Backend**: FastAPI, yt-dlp
- **Database/Auth**: Supabase
- **Monetization**: PKR 10 per download (integrated via Supabase quotas)
