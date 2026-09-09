# TaskHub — Next-Gen Human Intelligence & Micro-Task Marketplace

TaskHub is a modern, full-stack decentralized micro-task marketplace designed to connect AI laboratories, researchers, and enterprises with global human intelligence. From RLHF data labeling and computer vision bounding boxes to UX testing and code audits, TaskHub facilitates task creation, real-time collaboration with file attachments, deliverable verification, and instant direct settlements in multiple currencies (₹ / $).

---

## 🚀 Key Features

- **Fiverr-Inspired UI/UX**:
  - Global header with integrated service search bar and responsive category discovery.
  - Secondary horizontal sub-category navigation strip with active indicator underlines.
  - Gig-style task cards featuring thematic thumbnail banners, poster ratings, level badges, and prominent reward pricing.
  - Multi-facet filter and sorting engine (Category, Difficulty, Budget Range, Currency, and Sort By).
  - Two-column task detail layout with a sticky order summary checkout card and instant seat-locking actions.
- **Clean Modern Light Theme**:
  - High-contrast typography (`text-slate-900` headings, `text-slate-700` body).
  - Crisp white card panels with soft elevation shadows on a light slate background (`#f8fafc`).
  - Vibrant emerald (`#059669`), indigo (`#4f46e5`), and cyan (`#0891b2`) accents.
- **Multi-Currency Direct Settlements (0 Escrow Delay)**:
  - Full support for Indian Rupees (₹) and US Dollars ($).
  - Direct payout distribution to worker balances upon submission approval with zero deductions or commission fees.
- **Real-Time Collaboration & Chat**:
  - Socket.IO-powered real-time task chat threads between posters and workers.
  - File and image attachment uploads with automatic thumbnail rendering and lightbox previews.
  - Live submission status updates broadcast directly to dashboards without page reloads.
- **Role-Based Access Control (RBAC)**:
  - **Worker Workspace**: Browse available tasks, lock seats, collaborate in task chats, submit proofs (links, files, text), track earnings, and customize skills/bio.
  - **Business Workspace**: Create task batches with reward parameters, manage active tasks, review worker submissions with 1-5 quality ratings, collaborate via chat, and delete task batches anytime.
  - **Administrator Workspace**: User management, task oversight, submission review audits, KYC queues, and platform analytics.
- **Dynamic Authentication**:
  - JWT Access & HTTPOnly Refresh Token security.
  - Native Email/Password authentication with strict email uniqueness.
  - Dynamic Google OAuth integration routing directly into role-specific dashboards.

---

## 🛠️ Technology Stack

### Frontend (`frontend/`)
- **Framework**: React 18 with Vite
- **Language**: TypeScript (strict type checking)
- **Styling**: Tailwind CSS (v4) with custom theme tokens & glassmorphic utilities
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors
- **Real-Time**: Socket.IO Client
- **Routing**: React Router DOM (v7)

### Backend (`backend/`)
- **Runtime**: Node.js (with IPv4 priority for resilient cloud database connectivity)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon Serverless Cloud Database)
- **ORM**: Prisma Client
- **Real-Time**: Socket.IO Server
- **File Uploads**: Multer
- **Security**: Bcrypt, JSON Web Tokens (JWT), CORS, Helmet

---

## 📁 Repository Structure

```
TaskHub/
├── backend/                  # REST API server & database layer
│   ├── prisma/               # Prisma schema & migrations
│   ├── src/
│   │   ├── middleware/       # JWT auth & role validation middleware
│   │   ├── routes/           # Auth, Tasks, Submissions, Chat, Admin, Wallet
│   │   ├── lib/              # Socket.IO & Prisma singletons
│   │   ├── utils/            # Standardized API response formatters
│   │   └── index.ts          # Express application entry point
│   ├── scripts/              # Database maintenance & wipe utilities
│   ├── uploads/              # Local static media uploads directory
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React single-page client application
│   ├── src/
│   │   ├── api/              # Typed Axios HTTP API service clients
│   │   ├── components/       # Layouts, TaskCard, Google OAuth, Modals
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── pages/            # Public, Worker, Business, Admin page views
│   │   ├── types/            # TypeScript data contracts & models
│   │   ├── index.css         # Theme design tokens & Tailwind styles
│   │   └── App.tsx           # Route declarations & navigation trees
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .gitignore                # Comprehensive git ignore rules (secrets & builds)
└── README.md                 # Project documentation
```

---

## ⚙️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/RitunjKaushik20/TaskHub.git
cd TaskHub
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure your environment variables by creating `.env` in `backend/`:
```env
PORT=8000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
FRONTEND_URL="http://localhost:5173"
```

Initialize the database schema:
```bash
npx prisma generate
npx prisma db push
```

Start the backend server:
```bash
npm run dev
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 🧪 Build & Type Verification

Verify frontend TypeScript types and build bundle:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

Verify backend TypeScript types:
```bash
cd backend
npx tsc --noEmit
```

---

## 📄 License

This project is licensed under the MIT License.
