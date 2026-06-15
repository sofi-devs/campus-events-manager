
# 🎓 Campus Events

A Server-Side Rendered (SSR) campus event manager. Students and clubs can post
events, browse what's happening, and RSVP. Event organizers and admins can edit
or remove events, and every event page shows a live attendee list and count.

---

## 👥 Group Members

| Name | Responsibility (suggested) |
| --- | --- |
| Sofoniyas Tewodros 094 ||
| Roba molla  ||
| NahomFekadu  082 ||
| yanet belay 097  ||
---

## ✨ Features

- **User accounts** — register, log in, log out (passwords hashed with bcrypt).
- **Events CRUD** — create, view, edit and delete events.
- **RSVP system** — join or cancel attendance; capacity limits are enforced.
- **Roles & authorization** — only an event's organizer or an admin can edit/delete it.
- **Search** — filter events by title or location.
- **Live attendee counts** and attendee lists on every event page.
- **Flash messages** for user feedback after every action.
- **Reusable EJS layout + partials** (nav, footer, flash, event card).

---

## 🛠️ Technologies Used

- **Node.js** + **Express.js** — server and routing
- **EJS** + **express-ejs-layouts** — server-side templating and layout reuse
- **PostgreSQL** (via `pg`) — data storage
- **express-session** — session-based authentication
- **bcryptjs** — password hashing
- **method-override** — PUT/DELETE from HTML forms

---

## 📁 Project Structure

```
campus-events/
├── server.js              # app entry point + global middleware
├── db/
│   ├── pool.js            # PostgreSQL connection pool
│   ├── schema.sql         # CREATE TABLE statements
│   └── seed.js            # sample users + events (npm run seed)
├── middleware/
│   └── auth.js            # requireLogin / requireAdmin guards
├── routes/
│   ├── index.js           # home / event listing
│   ├── auth.js            # register / login / logout
│   └── events.js          # event CRUD + RSVP
├── views/
│   ├── layout.ejs         # master layout
│   ├── partials/          # nav, footer, flash, event-card
│   ├── events/            # new, edit, show
│   ├── auth/              # login, register
│   ├── index.ejs
│   └── error.ejs
└── public/css/style.css   # styling
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js 18+ and npm
- PostgreSQL running locally

### 2. Clone and install
```bash
git clone < https://github.com/sofi-devs/campus-events-manager.git>
cd campus-events
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL credentials and a session secret.

### 4. Create the database and tables
```bash
# create the database (run once)
createdb campus_events            # or:  psql -U postgres -c "CREATE DATABASE campus_events;"

# create the tables
psql -U postgres -d campus_events -f db/schema.sql
```

### 5. (Optional) Add sample data
```bash
npm run seed
```
This creates two demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@campus.edu` | `admin123` |
| Student | `sara@campus.edu` | `student123` |

### 6. Run the app
```bash
npm start      # production
npm run dev    # auto-reload with nodemon
```
Open **http://localhost:3000**

---

## 🔗 GitHub Repository

`<https://github.com/sofi-devs/campus-events-manager.git>`

---

## 📝 Notes

- All database queries use **parameterized statements** (`$1, $2, …`) to prevent SQL injection.
- Sessions are stored in memory by default, which is fine for development and demos.
  For production you would add a persistent session store (e.g. `connect-pg-simple`).

# campus-events-manager

