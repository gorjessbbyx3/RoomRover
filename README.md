
# RoomRover – Enterprise-Grade Property & Operations Platform

> Modern, mobile-first, and AI-augmented platform for managing boutique hospitality, short-term rentals, and private clubs.

---

## 🚀 Features

- **Mobile-First Responsive UI**: PWA-ready, touch-friendly, and accessible on all devices
- **Booking & Calendar**: Advanced booking, availability, check-in/out, and calendar sync
- **Task & Workflow Automation**: Assign, track, and comment on tasks (cleaning, maintenance, etc.)
- **Payments**: Cash/Cash App checkout flows, payment receipts, and dispute management
- **Membership & Profiles**: Role-based access, guest/host/manager/admin, and profile management
- **Dashboards & Analytics**: Real-time dashboards, audit logs, and exportable analytics
- **Inventory & Maintenance**: Usage, restock, scheduling, and maintenance logs
- **Notifications**: In-app and email notifications for all critical events
- **AI/Automation**: Room assignment, maintenance prediction, and auto-scheduling
- **Audit Logging**: Full audit trail for all critical actions
- **Accessibility (a11y)**: Keyboard navigation, ARIA, and color contrast
- **Testing**: Automated and manual tests for all workflows

---

## 🛠️ Tech Stack

**Frontend**: React + TypeScript, React Router, Tailwind CSS, shadcn/ui, React Query, Zod, Jest, Testing Library, Heroicons

**Backend**: Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL, Zod, Passport.js, Supertest, AI/automation endpoints

**Database**: PostgreSQL (Neon or Supabase), Drizzle migrations

**DevOps**: Replit, Vite, PWA, CI/CD ready

---

## ⚡ Quick Start

1. **Clone or Fork** this repo
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up environment variables** (see below)
4. **Run the app**
   ```bash
   npm run dev
   ```
5. **Push DB schema**
   ```bash
   npm run db:push
   ```

---

## 🔑 Environment Variables

- `DATABASE_URL` – PostgreSQL connection string
- `SESSION_SECRET` – Session encryption key
- `NODE_ENV` – `development` or `production`
- `PORT` – (optional, default: 3000)

---

## 🏗️ Project Structure

```
client/           # React frontend (mobile-first, PWA-ready)
  src/
    components/   # UI & workflow components
    pages/        # Route-level components
    assets/       # Images, icons, mobile assets
    __tests__/    # Frontend tests (Jest, a11y)
server/           # Express backend (REST, AI, automation)
  routes.ts       # API endpoints
  db.ts           # DB logic (Drizzle)
  ai-engine.ts    # AI/automation endpoints
migrations/       # DB migrations (Drizzle SQL)
shared/           # Shared types, Zod schemas
```

---

## 🧪 Testing

- `npm run test` – Run all tests
- `npm run test:frontend` – Frontend tests (Jest, a11y)
- `npm run test:backend` – Backend API tests (Supertest)

---

## 🔥 Key Workflows

- **Bookings**: Create, update, cancel, attach notes/files, audit
- **Tasks**: Assign, comment, attach files, audit, complete
- **Payments**: Cash/Cash App checkout, upload receipts, dispute
- **Analytics**: Real-time dashboards, export, audit logs
- **Inventory**: Usage, restock, maintenance, scheduling
- **Notifications**: In-app, email, mobile push (PWA)
- **User Management**: Profiles, roles, onboarding tour

---

## 🛡️ Security & Compliance

- Password hashing (bcrypt)
- Session & role-based access
- Input validation (Zod)
- Audit logging
- CORS & environment variable protection

---

## 📱 Mobile & Accessibility

- Fully responsive, mobile-first UI
- Keyboard navigation, ARIA, color contrast
- PWA installable on iOS/Android

---

## 💸 Payments

- Cash/Cash App checkout flows (no Stripe)
- Payment receipt upload & dispute
- Plan metadata for subscription tiers

---

## 🧑‍💻 Contributing

PRs welcome! Please add tests for new features and follow the code style.

---

## 📄 License

MIT License
