# mern-stack-2025
# Install Dependencies
1. npm i express mongoose 
2. npm install -g nodemon
# Execute program
1. nodemon [backend]
1. npm start [frontend]
# Install React
1. npx create-react-app front-end
# Youtube Link
1. https://www.youtube.com/watch?v=Oj83zU0G5Lw&list=PLwGdqUZWnOp2Z3eFOgtOGvOWIk4e8Bsr_&index=4
2:30

## Backend Setup
- Create a `backend/.env` file with the values shown below.
- From the `backend` directory run `npm install`.
- Start the backend in dev mode with `npm run dev` (uses Nodemon) or `npm start` for a one-off run.

### Environment Variables (`backend/.env`)
```
PORT=5000
MONGODB_URI=your-mongodb-connection-string
```

### Available REST Endpoints
- `GET /health` – health probe.
- `GET /api/users` – list users.
- `POST /api/users` – create user.
- `GET /api/users/:id` – fetch details.
- `PUT /api/users/:id` – update.
- `DELETE /api/users/:id` – remove.

All responses are JSON and errors return appropriate HTTP status codes.



