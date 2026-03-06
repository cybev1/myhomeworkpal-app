# MyHomeworkPal - Frontend

Beautiful mobile-first academic marketplace built with Expo and React Native.

## 🚀 Architecture

```
myhomeworkpal-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation (Home, Explore, Orders, Messages, Account)
│   ├── (auth)/             # Auth screens (Login, Register, Forgot Password)
│   ├── task/[id].tsx       # Task detail with bidding
│   ├── service/[id].tsx    # Service detail
│   ├── chat/[id].tsx       # Real-time chat
│   ├── payment.tsx         # Wallet & Stripe payments
│   ├── create-task.tsx     # Post new homework task
│   └── create-service.tsx  # Create helper service
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── UI.tsx          # Button, Card, Input, Avatar, Badge, etc.
│   │   └── Cards.tsx       # TaskCard, ServiceCard, BidCard, etc.
│   ├── constants/theme.ts  # Design system (colors, fonts, spacing)
│   ├── context/stores.ts   # Zustand global state
│   └── services/api.ts     # Axios API layer
├── services/api/           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── routers/        # API routes (auth, tasks, bids, orders, etc.)
│   │   ├── models/         # SQLAlchemy models
│   │   └── services/       # Business logic
│   └── requirements.txt
└── package.json
```

## 🎨 Design System

- **Theme**: Premium Dark with Electric Violet accents
- **Primary**: `#6C5CE7` (Electric Violet)
- **Accent**: `#00D2FF` (Cyan Spark)
- **Success**: `#00E676` (Mint)
- **Dark Base**: `#0A0F1E` (Deep Navy)

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Home | Dashboard with stats, categories, latest tasks, top helpers |
| Explore | Search & browse tasks, services, helpers with filters |
| Orders | Order management with progress tracking |
| Messages | Chat conversations with online indicators |
| Account | Profile, wallet, settings, reviews |
| Task Detail | Full task info with bidding system |
| Chat | Real-time messaging with file sharing |
| Payment | Stripe-style floating wallet card |

## 🔧 Tech Stack

**Frontend**: React Native / Expo 51 / TypeScript / Zustand / Expo Router
**Backend**: FastAPI / SQLAlchemy / PostgreSQL / JWT Auth
**Payments**: Stripe (escrow model)
**Deploy**: Vercel (frontend) + Railway (backend + Postgres)

## 🏗️ Setup

### Frontend
```bash
npm install
npx expo start
```

### Backend
```bash
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables

**Frontend** (`.env`):
```
EXPO_PUBLIC_API_URL=https://your-api.railway.app
EXPO_PUBLIC_STRIPE_KEY=pk_test_...
```

**Backend** (Railway):
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
```

## 🚢 Deployment

### Vercel (Frontend)
- Root: `/` (or where app.json lives)
- Build: `npx expo export --platform web`
- Output: `dist`

### Railway (Backend)
- Root: `services/api`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add PostgreSQL addon

## 📋 Roadmap

- [x] Phase 1: Core MVP (Auth, Tasks, Bidding, Orders, Chat)
- [ ] Phase 2: Trust Layer (Ratings, Verification, Disputes, Wallet)
- [ ] Phase 3: Community (Social Feed, Following, Public Q&A)
- [ ] Phase 4: Optimization (Smart Matching, Analytics)
- [ ] Phase 5: Native Mobile (Android & iOS via EAS Build)
