# Hello World React + Node.js App

This workspace contains a simple React frontend and Node.js backend demonstrating a "Hello World" message.

## Structure

- `frontend/` - React application (created with create-react-app)
- `backend/` - Node.js server using Express

## Running the app

1. Open two terminals or use a tool like `concurrently`.

### Start backend
```bash
cd backend
npm start
```

Server listens on port 5000 and exposes `/api/hello`.

### Start frontend
```bash
cd frontend
npm start
```

Proxy is configured to forward API requests to the backend.


## Notes
- Visit `http://localhost:3000` to see the message from the backend.
- The frontend fetches the message from the backend and displays it.
