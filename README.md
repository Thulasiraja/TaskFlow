# TaskFlow

## Overview

TaskFlow is a lightweight, Trello-style task management board. It has a single
demo board with three columns — **To Do**, **In Progress**, **Done** — and lets
you create, edit, delete, move, filter, and search tasks. Everything is backed
by a real SQLite database via a REST API; there's no mock data living only in
the browser.

## Tech Stack

- **Frontend:** React + Vite (JavaScript), plain CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`), raw SQL in a repository layer
- **Testing:** Jest + Supertest

## Features

- View the board with all three columns and their tasks
- Create a task (title required, description and priority optional)
- Edit a task's title, description, and priority
- Delete a task
- Move a task between columns via **drag-and-drop**, with a **dropdown**
  fallback control on every card (both are always available — drag-and-drop
  never replaces the dropdown)
- Filter tasks by priority: All / Low / Medium / High
- Search tasks by title (stretch goal — implemented)
- Task count shown in each column header (stretch goal — implemented)
- Backend rejects missing/empty/whitespace-only titles, independent of the
  frontend
- Errors (network, validation, 404, 500) are shown as a dismissable banner,
  never a blank screen or a raw stack trace

## Project Structure

```
taskflow/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/        # Board, Column, TaskCard, TaskForm, FilterBar, ErrorMessage
│       ├── services/api.js    # All fetch calls to the backend live here
│       ├── App.jsx            # App state, data loading, filtering/search
│       └── styles.css
│
├── server/                    # Express + SQLite backend
│   ├── database/
│   │   ├── schema.sql         # Table definitions (boards, columns, tasks)
│   │   └── seed.js            # Resets + seeds demo data
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js    # SQLite connection (enables foreign_keys)
│   │   │   └── queries.js     # Repository layer — every raw SQL query lives here
│   │   ├── controllers/       # Request handling / response shaping
│   │   ├── routes/            # Express route definitions
│   │   ├── middleware/        # Validation + centralized error handling
│   │   └── app.js             # Express app factory (used by both server.js and tests)
│   ├── tests/task.test.js     # Jest + Supertest test suite
│   └── server.js              # Entry point
│
└── README.md
```

## Database

**Relationship:** `Board → Column → Task` (one-to-many at each level).

- `columns.board_id` is a foreign key referencing `boards.id`
- `tasks.column_id` is a foreign key referencing `columns.id`
- Both foreign keys use `ON DELETE CASCADE`, so deleting a board or column
  cleans up what belongs to it
- `boards.name`, `columns.name`/`position`, and `tasks.title` are all `NOT NULL`
- `tasks.priority` is constrained with `CHECK (priority IN ('Low','Medium','High'))`
- SQLite does **not** enforce foreign keys by default — every connection in
  this project explicitly runs `PRAGMA foreign_keys = ON` (see `server/src/db/database.js`)

Schema file: [`server/database/schema.sql`](server/database/schema.sql)

## Setup

Requires Node.js 18+ installed locally.

```bash
git clone <repo-url>
cd taskflow
```

You'll run the backend and frontend in **two separate terminals**.

**Terminal 1 — backend:**

```bash
cd server
npm install
npm run db:setup   # creates the SQLite schema
npm run db:seed    # loads sample data
npm run dev         # starts the API on http://localhost:4000
```

**Terminal 2 — frontend:**

```bash
cd client
npm install
npm run dev         # starts Vite on http://localhost:5173
```

Open **http://localhost:5173** in your browser. Vite is configured to proxy
any request to `/api/*` to `http://localhost:4000`, so the frontend and
backend talk to each other with no extra configuration.

## Database Setup

These commands live in `server/package.json` and can be re-run any time you
want a clean slate:

```bash
cd server
npm run db:setup   # (re)creates server/database/taskflow.db from schema.sql
npm run db:seed     # wipes and reloads the demo board/columns/tasks
```

`npm run dev` (i.e. `node server.js`) will also auto-create the schema on
first run if `taskflow.db` doesn't exist yet — but running `db:setup` /
`db:seed` explicitly is recommended so you know exactly what data you're
starting with.

## Environment Variables

None are required to run the project locally. One optional variable:

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `4000` |
| `TASKFLOW_DB_PATH` | Overrides the SQLite file location (used by the test suite so tests never touch the dev database) | `server/database/taskflow.db` |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/boards/:boardId` | Get a board with its columns and tasks, plus a per-column task count |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/priority/:priority` | Tasks with a given priority, newest first |
| POST | `/api/tasks` | Create a task (`columnId`, `title` required; `description`, `priority` optional) |
| PUT | `/api/tasks/:id` | Update a task's title/description/priority |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/move` | Move a task to a different column (`columnId` required) |

All endpoints validate input, return proper HTTP status codes (`400` for bad
input, `404` for missing resources, `500` only for genuinely unexpected
failures), and never leak a raw stack trace in the response body.

## Testing

```bash
cd server
npm test
```

This runs the Jest + Supertest suite in `server/tests/task.test.js` against a
throwaway SQLite file (`server/tests/test.db`), created and destroyed on each
run — your dev database is never touched. It covers:

1. **Creating a task without a title must fail** — missing, empty-string, and
   whitespace-only titles are all rejected with `400`; a valid title is
   accepted and persisted.
2. **Moving a task must update its column/status correctly** — verified both
   through the API response and by reading the row back from the database
   directly.
3. **A database-layer query returns correct results using known seed data** —
   tests `countTasksPerColumn` and `getTasksByPriority` directly against
   rows inserted in the test, confirming counts and ordering.

## Design Decisions

- **`better-sqlite3` over an ORM:** the assignment asks for raw SQL in a
  clear repository layer, and a synchronous SQLite driver keeps that layer
  simple and easy to read/test — no async ceremony around what's a very fast,
  local, file-based database.
- **Single demo board:** the schema supports multiple boards, but the app is
  scoped to one board (`id = 1`) since multi-board management wasn't part of
  the spec and would add UI surface area for no required benefit.
- **Priority filter and search are client-side** over the already-fetched
  board, rather than re-fetching per keystroke. This keeps the column layout
  intact while filtering (the dedicated `GET /api/tasks/priority/:priority`
  endpoint exists as the required SQL-query-backed route and is covered by
  its own test and repository function — it's just not what drives the
  on-screen filter, since that needs to filter within columns, not flatten
  them).
- **Both drag-and-drop and a dropdown** are always present on every task
  card, per the "don't sacrifice stability for drag-and-drop" instruction —
  if drag-and-drop ever misbehaves in a given browser, the dropdown is a
  fully working fallback, not a hidden backup.
- **Errors surface as a dismissible banner, not a modal or blank screen** —
  failed create/edit/delete/move calls leave the rest of the board usable.

## What I Would Improve

- Optimistic UI updates (currently every mutation re-fetches the whole board;
  simple and consistent, but not the fastest for a large board)
- Reordering tasks *within* a column (currently newest-first by creation
  time; no manual ordering)
- Multiple boards with a board switcher
- A proper toast/notification system instead of a single top-level error banner

## Time Spent

_(fill in your actual time here)_

## Interesting Thing Learned

_(fill in your own note here)_

## Optional Deployment

Not deployed — the assignment prioritizes a working local project — but here's
how it could be done:

- **Frontend → Vercel:** point Vercel at the `client/` folder, build command
  `npm run build`, output directory `dist`. Set an environment-based API base
  URL in `client/src/services/api.js` (currently a relative `/api` path that
  relies on the Vite dev proxy — in production you'd point it at the deployed
  backend URL instead, e.g. via `import.meta.env.VITE_API_URL`).
- **Backend → Render or Railway:** point at the `server/` folder, build
  command `npm install`, start command `npm start`. Run `npm run db:setup && npm run db:seed`
  once after the first deploy (or on every deploy, if you want the demo data reset).
- **Database:** SQLite is a single file, so it only survives on a platform
  with a **persistent disk** (Render's paid persistent disks, a Railway
  volume, etc.) — on ephemeral/serverless hosting the file resets on every
  redeploy or cold start. If persistent storage isn't available, swap
  `better-sqlite3` for a hosted Postgres instance (e.g. Railway/Neon) and
  adjust the repository layer's SQL accordingly — the schema is simple
  enough that the port is mostly mechanical.

## Assignment Compliance Checklist

- [x] View board with all columns and tasks in the correct column
- [x] Create task (title required, description/priority optional, saved to SQLite)
- [x] Edit task (title, description, priority — saved to database)
- [x] Delete task (removed from database, UI updates correctly)
- [x] Move task between columns (drag-and-drop **and** dropdown control)
- [x] Priority filtering (All / Low / Medium / High)
- [x] Text search by title (stretch goal)
- [x] Task count per column header (stretch goal)
- [x] `boards`, `columns`, `tasks` tables with foreign keys and `NOT NULL` constraints
- [x] `database/schema.sql` present
- [x] Foreign key enforcement enabled (`PRAGMA foreign_keys = ON`)
- [x] Required SQL query: count tasks per column on a board
- [x] Required SQL query: tasks by priority, newest first
- [x] Queries live in a clear repository layer (`server/src/db/queries.js`)
- [x] Seed script with a demo board, 3 columns, 4 realistic sample tasks
- [x] Clean REST API matching the suggested routes
- [x] Backend validates input; rejects missing/empty/whitespace-only titles
- [x] Frontend also shows a validation message ("Task title is required.")
- [x] Centralized Express error-handling middleware; no raw stack traces exposed
- [x] Clean, responsive frontend UI with header/toolbar/board/task card as specified
- [x] Sensible component structure (Board, Column, TaskCard, TaskForm, FilterBar, ErrorMessage)
- [x] Sensible backend structure (routes/controllers/services-db/middleware)
- [x] Test 1: create without title fails
- [x] Test 2: moving a task updates its column
- [x] Test 3: database-layer query correctness against known seed data
- [x] Tests actually run and pass (`npm test` in `server/` — 8/8 passing)
- [x] No authentication, multi-user, real-time, or other out-of-scope features
- [ ] Deployment (optional — see below; not done, only documented)
