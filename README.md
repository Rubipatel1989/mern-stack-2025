# mern-stack-2025

# Install Dependencies for Backend
1. npm i express mongoose
2. npm install -g nodemon

# Execute program
1. nodemon [backend]
1. npm start [fornend]

# Install React
1. npx create-react-app front-end

## Backend Setup
- Create a `backend/.env` file with the values shown below.
- From the `backend` directory run `npm install`.
- Start the backend in dev mode with `npm run dev` (uses Nodemon) or `npm start` for a one-off run.

### Environment Variables (`backend/.env`)
```
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=change-me
JWT_EXPIRES_IN=1h
```

### Available REST Endpoints
- `GET /health` – health probe.
- `POST /api/auth/register-superadmin` – bootstrap first superadmin (one-off).
- `POST /api/auth/login` – login and receive JWT.
- `POST /api/auth/logout` – invalidate client session (requires bearer token).
- `GET /api/users` – list users (requires bearer token; superadmin/admin/support).
- `POST /api/users` – create user (bearer token; superadmin/admin).
- `GET /api/users/:id` – fetch details (bearer token; superadmin/admin/support).
- `PUT /api/users/:id` – update user (bearer token; superadmin/admin).
- `DELETE /api/users/:id` – remove user (bearer token; superadmin only).
- `POST /api/roles` – create role (bearer token; superadmin).
- `GET /api/roles` – list roles (bearer token; superadmin/admin).

### Request Notes
- Authenticate with `Authorization: Bearer <jwt-token>`. Token payload includes user id, email, and role name.
- To bootstrap the system: call `/api/auth/register-superadmin`, then log in as superadmin and create additional roles/users.
- `POST /api/users` requires `password` along with profile info and role (role id or name).
- `dob` must be `dd-mm-yyyy`. Address is optional but accepts the following structure:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "customer",
    "dob": "17-05-1995",
    "address": {
      "line1": "23 Baker Street",
      "city": "London",
      "postalCode": "NW1",
      "country": "UK"
    }
  }
  ```

All responses are JSON and errors return appropriate HTTP status codes.



