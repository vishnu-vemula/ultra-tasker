# Task Manager — Frontend

React SPA for the Task Manager application, built with Vite.

## Tech Stack

- React 18 (Vite)
- Redux Toolkit (state management)
- React Router (routing)
- React Query (server state and caching)
- React Hook Form + Zod (form validation)
- React Beautiful DnD (drag-and-drop task board)
- Tailwind CSS + Flowbite-React (styling and UI components)
- Axios (API calls)
- Firebase (Google OAuth)
- React Toastify (notifications)

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_BACKEND_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:5173`.

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start Vite dev server      |
| `npm run build`   | Build for production       |
| `npm run preview` | Preview production build   |
| `npm run lint`    | Run ESLint                 |

## Structure

```
src/
├── components/       # Header, Footer, TaskBoard, OAuth, Button, Input, Notification
├── pages/            # Home, Login, Signup
├── redux/            # Redux Toolkit store and slices
├── firebase.js       # Firebase (Google OAuth) config
├── helper.js         # Axios client (baseURL from VITE_BACKEND_BASE_URL)
├── App.jsx           # Routes and providers
└── main.jsx          # Entry point
```
