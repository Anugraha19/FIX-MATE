# FixMate – Home Repair Service Provider

A full-stack web application where customers book home-repair services (plumbing, electrical, carpentry, painting, appliance and AC repair, cleaning, masonry, general maintenance), service providers manage their jobs, and an admin runs the platform.
React + Vite → React Router → Redux Toolkit → Axios → Express → Controllers → Sequelize → MySQL

text

The UI follows the supplied Figma login design (sand/tan backdrop, frosted-glass panel, white pill inputs, black pill buttons, Poppins + Lato type) and extends it across the whole site.

---

## 1. Features

**Customer** – register / login (email or phone), search and filter services, view service and provider details, book with date, time and address, track status, cancel pending bookings, booking history, leave reviews after completion, manage profile and password.

**Service provider** – dashboard (new requests, active jobs, completed jobs, earnings), accept / reject requests, start and complete jobs, manage the services they offer, set availability windows, view reviews, edit profile.

**Admin** – live dashboard statistics, customers (search, edit, disable/delete), providers (add, edit, deactivate/delete), services and categories (full CRUD), bookings (assign provider, change status), reviews (moderate), reports (monthly statistics, service popularity, provider jobs, revenue, CSV export).

**Chatbot** – a floating "FixMate Assistant" on every public/dashboard page, powered by the Groq API (see section 10). It answers questions about services, prices and booking using live data from the database.

**Business rules enforced by the backend:** a provider cannot be double-booked, bookings cannot be in the past, price is set by the server (never trusted from the browser), invalid status jumps are rejected (for example `Pending → Completed`), only completed bookings can be reviewed, one review per booking, nobody can self-register as admin.

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, HTML5, CSS3, React Router 6, Redux Toolkit, Axios |
| Backend | Node.js, Express, REST APIs, JWT, bcryptjs, node-cron |
| Database | MySQL, Sequelize ORM (models, migrations, seeders, associations), mysql2 |
| Tooling | npm, `.env` files, concurrently |

No PHP, no Firebase, no MongoDB.

---

## 3. Folder structure
FixMate/
├── client/ React + Vite app
│ ├── public/ put login-bg.jpg and logo.png here (Figma exports)
│ └── src/
│ ├── components/ Navbar, Footer, ServiceCard, ProviderCard, BookingCard,
│ │ Modal, ProtectedRoute, DashboardLayout, ui.jsx (Alert, Loading, ...)
│ ├── pages/ Home, Login, Register, Services, ServiceDetails, Providers,
│ │ ├── customer/ ProviderDetails, Booking, BookingConfirmation ...
│ │ ├── provider/
│ │ ├── admin/
│ │ └── shared/ profile + settings pages used by all roles
│ ├── redux/ store.js + slices (auth, service, booking, user)
│ ├── context/ AuthContext
│ ├── hooks/ useFetch, useDebounce
│ ├── services/api.js the only file that calls the backend (Axios)
│ └── utils/ formatting + validation helpers
├── server/
│ ├── config/ config.js (reads .env), database.js (Sequelize connection)
│ ├── controllers/ auth, user, category, service, provider, booking, review, admin
│ ├── models/ User, Category, Service, Provider, ProviderService,
│ │ Booking, Review, Availability + index.js (associations)
│ ├── migrations/ 8 migrations, one per table
│ ├── seeders/ demo data
│ ├── routes/ one router per feature + index.js (API gateway)
│ ├── middleware/ authMiddleware, roleMiddleware, errorMiddleware
│ ├── events/ bookingEvents.js (EventEmitter)
│ ├── jobs/ reminderJob.js (cron)
│ ├── utils/ AppError, asyncHandler, logger, bookingWorkflow, reportExport (streams) ...
│ ├── data/ bookingConfig.json (time slots, read with fs)
│ ├── logs/ reports/ written at run time
│ ├── app.js builds the Express app
│ └── server.js connects to MySQL and starts listening
├── package.json root scripts (dev, server, client, db:setup)
└── README.md

text

---

## 4. Setup (first time)

**Requirements:** Node.js 18+ and MySQL 8 (or MariaDB 10.5+) running locally.

```bash
# 1. Install everything
npm run install:all

# 2. Configure the server
cd server
cp .env.example .env        # then open .env and set DB_PASSWORD and JWT_SECRET
cd ..

# 3. Create the database, tables and demo data
npm run db:setup            # = db:create + db:migrate + db:seed

# 4. Run client and server together
npm run dev
Website: http://localhost:5173

API: http://localhost:5000/api (try /api/health)

Environment variables (server/.env)
env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fixmate_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ENABLE_CRON=true
GROQ_API_KEY=your_groq_key_here   # chatbot; free key from https://console.groq.com/keys
GROQ_MODEL=llama-3.3-70b-versatile
.env is git-ignored; secrets and database credentials never appear in source code or in the React app. The client needs no .env in development (Vite proxies /api to port 5000). To point at a deployed API set VITE_API_URL.

Database commands (run inside server/)
Command	What it does
npm run db:create	creates fixmate_db
npm run db:migrate	creates all tables from migrations/
npm run db:seed	inserts demo data
npm run db:migrate:undo	drops all tables (undo all migrations)
npm run db:seed:undo	removes demo data
npm run db:reset	undo → migrate → seed
npm run reminders	runs the daily reminder check once, by hand
The app does not use sequelize.sync() – the schema comes only from migrations.

Demo accounts (after seeding)
Role	Email	Password
Admin	admin@fixmate.com	admin123
Customer	meera@example.com (also arjun@, fathima@, sanjay@, priya@, rahul@example.com)	password123
Provider	rajesh@fixmate.com (also anil@, suresh@, vineeth@, faisal@, joseph@fixmate.com)	password123
Change these before any real deployment. The seed contains 9 categories, 14 services, 6 providers, 6 customers, 14 bookings in different statuses, 6 reviews and availability windows.

The Figma images
The background photo and the logo bitmap live in Figma and could not be downloaded while building. Export them and save them as:

client/public/login-bg.jpg – background photo for the login and home pages

client/public/logo.png – the FM house logo

Until then a warm sand colour is shown and the logo is a drawn SVG stand-in (house mark + "FM" in Leckerli One). Nothing breaks without the files.

5. User roles and authorization
Role	Can do
customer	book, view/cancel own bookings, review completed jobs, edit own profile
provider	see only bookings assigned to them, accept/reject/start/complete, manage own services and availability
admin	everything under /api/admin, plus service and category CRUD
Authorization happens in two places: React hides pages with ProtectedRoute (for a better experience) and Express enforces it with protect + authorizeRoles(...) middleware (this is the real security). The role is always read from the database, never trusted from the request.

6. Authentication flow
POST /api/auth/register or /login – password checked with bcrypt; the server returns a JWT and the user.

The client saves the token and Axios adds Authorization: Bearer <token> to every request.

authMiddleware.protect reads that request header, verifies the JWT, loads the user from MySQL and puts it on req.user.

roleMiddleware.authorizeRoles checks req.user.role.

After a page refresh the app calls GET /api/auth/me to restore the session. If the token is rejected the user is logged out automatically.

Passwords are stored only as bcrypt hashes and are excluded from every query by default (Sequelize defaultScope).

7. Database design (fixmate_db)
Table	Purpose
users	customers, providers and admins (role column)
categories	Plumbing, Electrical, ...
services	bookable jobs, each in one category
providers	profile of a provider user (experience, skills, location, status, rating)
provider_services	join table – which provider offers which service
bookings	a customer's request: service, optional provider, date, time, address, price, status
reviews	rating 1–5 for a completed booking
availability	dates and time windows a provider is free or blocked
Associations (server/models/index.js)
text
User     1 ─ 1  Provider          Category 1 ─ ∞ Service
Provider ∞ ─ ∞  Service           (through provider_services)
User     1 ─ ∞  Booking           (as customer)
Provider 1 ─ ∞  Booking           Service  1 ─ ∞ Booking
Booking  1 ─ 1  Review            User     1 ─ ∞ Review
Provider 1 ─ ∞  Review            Provider 1 ─ ∞ Availability
Constraints used: primary keys, foreign keys with CASCADE / RESTRICT / SET NULL, unique email, unique (provider_id, service_id), unique reviews.booking_id, NOT NULL, ENUMs for role / status / availability, and a CHECK (rating BETWEEN 1 AND 5) on MySQL 8.0.16+.

Booking status workflow (server/utils/bookingWorkflow.js)
text
Pending ─► Confirmed ─► Assigned ─► Accepted ─► In Progress ─► Completed
   │           │            │           │
   ├───────────┴────────────┴─► Rejected (admin may re-assign)
   └─► Cancelled  (customer: only while Pending / Confirmed / Assigned)
Any change not in this map returns 400 Bad Request.

8. API endpoints
All routes start with /api. 🔓 public · 🔑 any logged-in user · role shown otherwise.

Auth – POST /auth/register 🔓 · POST /auth/login 🔓 · GET /auth/me 🔑

Users – GET /users/me · PUT /users/me · PUT /users/me/password 🔑

Categories – GET /categories 🔓 · POST · PUT /:id · DELETE /:id (admin)

Services – GET /services 🔓 (query: q, category, minPrice, maxPrice, rating, location, available, sort, page, limit) · GET /services/:id 🔓 · POST · PUT /:id · DELETE /:id (admin)

Providers – GET /providers 🔓 · GET /providers/:id 🔓 · GET /providers/me (provider) · PUT /providers/:id (provider/admin; me allowed) · GET|POST /providers/me/availability, DELETE /providers/me/availability/:slotId (provider)

Bookings (login required)
POST /bookings (customer) · GET /bookings (scoped to the role) · GET /bookings/:id · PUT /bookings/:id · DELETE /bookings/:id (cancel) · PUT /bookings/:id/accept|reject|start|complete (provider)

Reviews – POST /reviews (customer) · GET /reviews/provider/:providerId 🔓 · GET /reviews/mine (customer) · GET /reviews/featured 🔓

Admin (admin only) – GET /admin/dashboard · GET|PUT|DELETE /admin/users · GET|POST|PUT|DELETE /admin/providers · GET /admin/services · GET /admin/bookings · PUT /admin/bookings/:id/assign · PUT /admin/bookings/:id/status · GET /admin/reviews · DELETE /admin/reviews/:id · GET /admin/reports · GET /admin/reports/bookings.csv · POST /admin/reports/save

Chatbot (public, optional login, 15 messages/min per IP) – POST /chatbot with { messages: [{ role, content }] } → { reply }

Other – GET /health · GET /config/booking

Errors are always JSON { "message": "..." } with status 400, 401, 403, 404 or 500, produced by one central error handler.

9. How React talks to Node and Node talks to MySQL
text
Component (e.g. Services.jsx)
   │ dispatch(fetchServices(filters))            ← Redux Toolkit thunk
   ▼
services/api.js  →  axios.get('/api/services')   ← adds the JWT header
   ▼  (Vite proxy in development)
Express  routes/index.js (gateway) → serviceRoutes → serviceController
   ▼
Sequelize  Service.findAndCountAll({ where, include, limit, offset })
   ▼
MySQL  (mysql2 driver)
The browser never connects to MySQL and never sees database credentials. Search, filters, pagination, statistics and reports are all calculated by MySQL through Sequelize; dashboards contain no hard-coded numbers.

10. Chatbot (Groq API)
The "FixMate Assistant" is a chat window opened by the round button at the bottom-right of the site.

Flow: Chatbot.jsx (React) → POST /api/chatbot (Express) → chatbotController.js → Groq chat/completions → reply back to the browser.

The API key stays on the server. It is read from GROQ_API_KEY in server/.env (git-ignored). The browser never sees it.

Setup: create a free key at https://console.groq.com/keys, put it in server/.env, restart the server. Without a key the endpoint answers 503 and the widget shows a friendly message.

Grounded answers: for every request the server builds a system prompt from the live database (categories, services, prices, duration) plus the booking steps, so the bot quotes real FixMate prices instead of inventing them. If the visitor is logged in (optionalAuth middleware) the bot knows their name and role.

Safety: input is validated (roles limited to user/assistant, 1000 characters per message, last 12 messages only); a per-IP rate limit (utils/rateLimit.js) protects the key; Groq errors are mapped to safe messages (429 busy, 502 problem) and never leak the key.

Files: server/controllers/chatbotController.js, server/routes/chatbotRoutes.js, server/utils/rateLimit.js, optionalAuth in server/middleware/authMiddleware.js, client/src/components/Chatbot.jsx, chatbotApi in client/src/services/api.js, styles at the end of client/src/index.css.

11. Testing
The following were checked against a running copy of the app (API through HTTP, UI through a headless browser):

Authentication – register, login by email and by phone, wrong password (401), duplicate email (400), admin self-registration blocked (403), protected routes without a token (401), wrong role (403).

Customer – browse and filter services, view details, book (price set by server, past dates and double-booking rejected), view and cancel bookings, review after completion (only once, rating 1–5).

Provider – see requests, accept, reject, start, complete; other providers' bookings are forbidden; invalid status jumps rejected; availability create/delete.

Admin – dashboard statistics, users, providers (create with transaction, edit, deactivate), services and categories CRUD (category with services cannot be deleted), assign provider, status changes, reviews, reports, streamed CSV export.

UI – no horizontal scrolling at 375, 768, 1024 and 1920 px; sidebar becomes a mobile menu; tables become cards on phones.

To test the API yourself use Postman or any REST client: log in at POST /api/auth/login, copy the token, and send it as Authorization: Bearer <token>.

12. Known limitations
Social login buttons (Google, Facebook, X) are UI-only, as allowed by the brief; email/phone + password login is fully real.

"Forgot password" and the contact form are interface-only; no email service is connected.

The photo and logo bitmaps from Figma must be added by hand (see "The Figma images").