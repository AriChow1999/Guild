🛡️ Guild Protocol
Guild is an elite, high-performance community management and messaging backend architecture. Built using the MFRN stack (MongoDB, Fastify, React, Node.js), it implements advanced administrative protocols, real-time state synchronization via Redis, and a secure "Tactical UI" designed for high-stakes environment management.

✨ Features
Tactical UI: An industrial, glassmorphic interface built with custom CSS for high data density and clarity.

Redis-Powered Moderation: Real-time "Timeout" protocols with automatic UI synchronization and binary status tracking.

MFRN Architecture: Leverages Fastify for ultra-low overhead routing and TanStack Query for efficient data fetching.

Guild Hierarchy: Advanced permission system allowing Guild Owners to manage members, channels, and operational settings.


🛠️ Tech Stack
Frontend: React 18, TypeScript, Vite

Routing & State: TanStack Router, Zustand, TanStack Query

Backend: Fastify (High Performance), Node.js

Database: MongoDB (Mongoose), Redis (Real-time state/TTL)

Security: JWT (JSON Web Tokens) with auto-expiry logout.

📦 Getting Started
1. Clone the repository
Bash
git clone https://github.com/AriChow1999/Guild.git
cd Guild
2. Install dependencies
Bash
# Install backend assets
cd backend
npm install

# Install frontend assets
cd guild
npm install

# In backend directory
npm run dev

# In frontend directory
npm run dev
🛰️ API Protocol (Endpoints)
Administrative (Protected)
POST /auth/guild/timeout/:guild_id/:member_id — Initiates 5-minute silence protocol.

GET /auth/guild/:guild_id — Syncs guild state and validates Redis TTL.

DELETE /auth/message/hard-delete/:guild_id/:message_id — Permanent database purge (Admin Only).

Member Operations
GET /auth/guild/:guild_id/member-status/:member_id — Binary check (1/0) of member timeout status.

PATCH /auth/message/soft-delete/:guild_id/:message_id — Standard message removal.

🔒 Security & Sync Logic
Redis TTL Integration: Timeouts are managed via Redis EX (expiry). The UI automatically "self-expires" the silenced state using a useEffect countdown hook, ensuring zero latency between the server and client.

Auto-Healing DB: The backend logic performs a "lazy sync" on every GET request. If a member is marked as timed out in MongoDB but the Redis key has expired, the database auto-corrects itself instantly.
