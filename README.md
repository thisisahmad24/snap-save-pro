# SnapSave Pro

A professional social media downloader platform focused exclusively on high-quality Instagram content.

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
6. Set `MONGO_URI`, `MONGO_DB_NAME` (optional), `JWT_SECRET`, and `STRIPE_SECRET_KEY` before starting the backend.

### Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Run the dev server: `npm run dev`.
4. Set `BACKEND_API_URL` if your FastAPI service is not running locally.

## Tech Stack
- **Frontend**: Next.js, TypeScript, Vanilla CSS
- **Backend**: FastAPI, yt-dlp
- **Database/Auth**: MongoDB Atlas + JWT
- **Monetization**: PKR 10 per download (tracked in MongoDB quotas)

## Strategic Pivot: Instagram-Only Focus
As of May 2026, SnapSave Pro has transitioned to an **Instagram-Only** platform. This strategic decision was made to ensure maximum stability and reliability for our users. 

**Rationale:**
- **Bot Detection**: YouTube has implemented extremely aggressive bot-detection measures that frequently block cloud-based server IPs (Render/Vercel).
- **User Experience**: By focusing 100% on Instagram, we can provide a faster, zero-failure extraction experience.
- **Direct Downloads**: This focus allowed us to implement the "Direct-to-Device" gallery download feature specifically optimized for Reels and IG posts.
