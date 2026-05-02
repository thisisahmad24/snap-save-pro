# Implementation Plan: SnapSave Pro

## 1. Technical Architecture
The system follows a decoupled architecture with a React-based frontend and a Python-based extraction service.

### Frontend (Next.js 15)
- **Role**: User Interface, Authentication, Payment Processing, Routing.
- **Tech**: React 19, Vanilla CSS, Supabase Auth.
- **Endpoints**: Communicates with FastAPI for media extraction.

### Backend (FastAPI)
- **Role**: High-performance extraction engine.
- **Library**: `yt-dlp` for link parsing and stream extraction.
- **Security**: CORS restricted to the frontend domain.

## 2. Phase-by-Phase Roadmap

### Phase 1: Environment Setup
- Initialize Next.js in `/frontend`.
- Initialize FastAPI in `/backend`.
- Configure Supabase project and environment variables.

### Phase 2: Python Extraction Logic
- Create FastAPI endpoints for `/api/instagram` and `/api/youtube`.
- Implement error handling for invalid URLs or private content.

### Phase 3: Premium UI & Auth
- Develop the "Pro" Navbar and Footer with mobile responsiveness.
- Set up Supabase Auth (Sign up / Sign in).
- Design the Landing Page with the link input and download preview.

### Phase 4: Monetization & Quotas
- Implement the "Free Limit" middleware (5 IG / 3 YT).
- Integrate PKR 10 payment flow (Mock/Stripe).

### Phase 5: Contact & Feedback
- Integrate Formspree into the Contact and Queries forms.

### Phase 6: Deployment & SEO
- Deploy to Vercel/Netlify.
- Configure SEO meta tags and social sharing previews.

## 3. Verification Strategy
- **Unit Tests**: Python tests for `yt-dlp` reliability.
- **Integration Tests**: Verify Next.js communicates correctly with FastAPI.
- **UX Testing**: Responsive design check on iOS/Android/Desktop.
