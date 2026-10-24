# cpp-taskapp

A full-stack task management app that helps users organize everyday activities, track time spent working, and measure progress through a simple points system.

> **Designed and Developed by:** Suwaiba Mahammad, Aashaya Aryal, Iman Zahid
> **Status:** Planning and initial development
> **Name:** `cpp-taskapp` is the internal project name; the public-facing name is not decided yet.

## About

### Description and Purpose

`cpp-taskapp` is designed for students and young adults who want a straightforward way to stay on top of daily tasks without setting up an elaborate productivity system.

Instead of creating tasks from scratch, users choose from a curated catalog organized by category and difficulty. They add tasks to a personal list, start a timer when they begin working, and stop it when finished. Completed tasks earn points based on the time spent, and users can review their progress on their profile.

### Inspiration

Many task-tracking apps require users to organize everything before they can get started. `cpp-taskapp` takes a simpler approach: provide a useful starting list of everyday tasks, let users track the time they spend on each one, and make completed work visible.

The app focuses on three things:

- **Planning:** Make it easy to choose tasks and organize a daily list.
- **Focus:** Track time spent on a task using a simple start/stop timer.
- **Progress:** Record completed tasks and reward effort with points.

## Features

The following describes the **planned initial release**, not already-completed functionality.

### Accounts and profiles

- Sign up with a name, email address, and password.
- Log in and log out securely.
- View basic profile information, completed tasks, and total earned points.

### Task catalog

- Browse a predefined list of tasks maintained by the project team.
- View each task's title, category, and difficulty.
- Filter tasks by category.

### Personal task list

- Add catalog tasks to a personal list for a chosen day (today by default).
- View planned, in-progress, and completed tasks.
- Reschedule or remove a task that has not been started.

### Task timer

- Start a timer for a selected task and stop it upon completion.
- Save start and completion times to the database.
- Keep at most one timer running per user.
- Restore the elapsed-time display from the saved start time if the page is refreshed.

### Points and progress

- Earn **1 point per full minute** when a timer is stopped, up to **120 points per completed task**.
- Calculate a user's total points from completed task records.
- Preserve completed-task history for the profile view.

The initial release will not include user-created catalog tasks, pause/resume timers, reminders, artwork, leaderboards, or social features.

## How It Works

1. **Create an account** or log in.
2. **Browse tasks** and filter by category.
3. **Add tasks** to a personal list.
4. **Start and stop** a timer while working on a task.
5. **Earn points** and review completed work on the profile page.

## Tech Stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | React, Vite, React Router                                         |
| Backend        | Node.js, Express                                                  |
| Database       | PostgreSQL                                                        |
| Authentication | Email/password, hashed passwords, HTTP-only authentication cookie |
| Deployment     | Render (planned)                                                  |

## Data Model

The app uses four main tables:

| Table        | Purpose                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `users`      | Account and profile details                                                   |
| `categories` | Groups for organizing catalog tasks                                           |
| `tasks`      | Predefined tasks, each belonging to a category                                |
| `user_tasks` | A user's selected tasks, scheduled dates, timer timestamps, and earned points |

A category has many tasks. Users and tasks have a many-to-many relationship through `user_tasks`, which also stores each selected task's progress. The same catalog task can be selected on different days.

See [Entity Relationship Diagram](planning/entity_relationship_diagram.md) for the planned schema.

## Application Pages

| Route                | Page          | Purpose                                |
| -------------------- | ------------- | -------------------------------------- |
| `/signup`            | Sign Up       | Create an account                      |
| `/login`             | Log In        | Access an existing account             |
| `/`                  | My Tasks      | View and manage the personal task list |
| `/tasks`             | Task Catalog  | Browse and filter available tasks      |
| `/tasks/:category`   | Category View | Browse tasks in a selected category    |
| `/timer/:userTaskId` | Task Timer    | Track an active task                   |
| `/profile`           | Profile       | View account details and progress      |

## API Routes

The backend uses Express.js and exposes RESTful endpoints under `/api`. PostgreSQL stores user accounts, the predefined task catalog, and each user's selected tasks.

### Authentication & Profile

| Method  | Route              | Purpose                                                         |
| ------- | ------------------ | --------------------------------------------------------------- |
| `POST`  | `/api/auth/signup` | Create a new user account                                       |
| `POST`  | `/api/auth/login`  | Authenticate a user and establish a session                     |
| `POST`  | `/api/auth/logout` | End the current user session                                    |
| `GET`   | `/api/auth/me`     | Retrieve the currently authenticated user                       |
| `GET`   | `/api/profile`     | Retrieve profile information, total points, and task statistics |
| `PATCH` | `/api/profile`     | Update the user's first and last name                           |

### Task Catalog

| Method | Route                | Purpose                                                                  |
| ------ | -------------------- | ------------------------------------------------------------------------ |
| `GET`  | `/api/categories`    | Retrieve available task categories                                       |
| `GET`  | `/api/tasks`         | Retrieve predefined tasks, optionally filtered by category or difficulty |
| `GET`  | `/api/tasks/:taskId` | Retrieve details of a specific catalog task                              |

### Personal Tasks

| Method   | Route                         | Purpose                                                         |
| -------- | ----------------------------- | --------------------------------------------------------------- |
| `GET`    | `/api/user-tasks`             | Retrieve the user's selected tasks, optionally filtered by date |
| `GET`    | `/api/user-tasks/:userTaskId` | Retrieve a selected task, including its current timer state     |
| `POST`   | `/api/user-tasks`             | Add a catalog task to the user's personal list                  |
| `PATCH`  | `/api/user-tasks/:userTaskId` | Update a selected task's planned date                           |
| `DELETE` | `/api/user-tasks/:userTaskId` | Remove a task from the user's personal list                     |

### Timer & Points

| Method  | Route                               | Purpose                                                   |
| ------- | ----------------------------------- | --------------------------------------------------------- |
| `PATCH` | `/api/user-tasks/:userTaskId/start` | Start a task by recording its start timestamp             |
| `PATCH` | `/api/user-tasks/:userTaskId/stop`  | Stop a task, record its completion time, and award points |

### Database & Deployment

The project will include these development commands:

| Command              | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `npm run db:migrate` | Initialize or update the database schema  |
| `npm run db:seed`    | Populate categories and predefined tasks  |
| `npm run db:reset`   | Reset and reseed the development database |

### API Conventions

- All account-specific endpoints require authentication, except signup and login.
- Authentication uses securely hashed passwords and HTTP-only session cookies.
- Task identifiers refer to shared catalog tasks, while `userTaskId` identifies an individual user's selected task.
- Timer timestamps and awarded points are calculated and saved by the backend.
- API responses use JSON and appropriate HTTP status codes.
- Users can only modify their own selected tasks.

## Planning Documents

- [User Stories](planning/user_stories.md) — the main user journeys and expected behavior.
- [Wireframes](planning/wireframes.md) — planned screens and interface designs.
- [Entity Relationship Diagram](planning/entity_relationship_diagram.md) — database entities and relationships.

## Development

For installation, database setup, local development, builds,
formatting, and the repository layout, see the
[Development Guide](DEVELOPMENT.md).

For branch conventions and pull requests, see
[Contributing](CONTRIBUTING.md).
