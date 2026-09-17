# Task Manager — Backend

REST API for the Task Manager application, built with Express and MongoDB.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (authentication, HttpOnly cookies)
- Bcrypt.js (password hashing)
- Cookie-Parser (signed JWT cookies)
- CORS (credentials-enabled for the frontend origin)

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
FRONTEND_BASE_URL=http://localhost:5173
```

Start the server:

```bash
npm start
```

The API runs on `http://localhost:3000`.

## Scripts

| Command       | Description                  |
| ------------- | ---------------------------- |
| `npm start`   | Start server (nodemon)       |

## API Endpoints

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| POST   | `/api/v1/user/signup`   | Register a new user             |
| POST   | `/api/v1/user/login`    | Log in (sets JWT cookie)        |
| POST   | `/api/v1/user/logout`   | Log out (clears JWT cookie)     |
| POST   | `/api/v1/user/google`   | Google OAuth login              |
| GET    | `/api/v1/tasks`         | List tasks                      |
| POST   | `/api/v1/tasks`         | Create a task                   |
| PUT    | `/api/v1/tasks/reorder` | Reorder tasks (drag-and-drop)   |
| PUT    | `/api/v1/tasks/:id`     | Update a task                   |
| DELETE | `/api/v1/tasks/:id`     | Delete a task                   |

## Structure

```
backend/
├── controllers/     # Route handlers (userController, taskController)
├── db/              # MongoDB connection (connectDatabase)
├── middlewares/     # JWT auth middleware
├── models/          # Mongoose schemas
├── routes/          # Express routers (userRoutes, taskRoutes)
├── utils/           # JWT token generation helpers
└── server.js        # App entry point
```
