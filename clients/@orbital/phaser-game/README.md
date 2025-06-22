# Phaser Client

A frontend Phaser application with signup, login, and logout, communicating with the Gateway via HTTP.

## Setup

1. Install dependencies:

   ```sh
   cd services/phaser-client
   yarn install
   # or
   npm install
   ```

2. Run the development server:

   ```sh
   yarn dev
   # or
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Auth API

- Signup: `POST /api/auth/signup` `{ username, password }`
- Login: `POST /api/auth/login` `{ username, password }` → `{ token }`
- Logout: Client-side only (removes token)

Adjust API endpoints as needed to match your Gateway backend.
