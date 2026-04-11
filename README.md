🛡️ Guild Protocol
Guild is an elite, high-performance community management and messaging backend architecture. Built using the MFRN stack (MongoDB, Fastify, React, Node.js), it implements advanced administrative protocols, real-time state synchronization via Redis, and a secure "Tactical UI" designed for high-stakes environment management.

✨ Core Features
Tactical UI: An industrial, glassmorphic interface built with custom CSS for high data density and clarity.

Real-Time Intelligence: * Typing Indicators: Instant visual feedback showing specifically which units are active.

Auto-Focus Messaging: The viewport automatically scrolls and locks to new incoming transmissions, ensuring zero missed data.

Redis-Powered Moderation: Real-time "Timeout" protocols with automatic UI synchronization and binary status tracking.

MFRN Architecture: Leverages Fastify for ultra-low overhead routing and TanStack Query for efficient data fetching.

🛠️ Tech Stack
Frontend: React 18, TypeScript, Vite

Routing & State: TanStack Router, Zustand, TanStack Query

Backend: Fastify (High Performance), Node.js

Database: MongoDB (Mongoose), Redis (Real-time state/TTL)

Security: JWT (JSON Web Tokens) with auto-expiry logout.

⚠️ Operational Constraints
To maintain peak performance and structural integrity, the following limitations are enforced:

Guild Limit: Each Identity (User) is permitted to establish only one (1) Guild.

Channel Capacity: Each Guild is restricted to a maximum of three (3) dedicated Channels.

⚡ Administrative Authority (Admin Powers)
The Guild Owner possesses absolute control over the operational environment:

Access Provisioning: Admin can manually grant access to new units (Users) within the Guild.

Unit Exclusion (Kick/Ban): Ability to temporarily remove or permanently blacklist units from the environment.

Silence Protocol (Timeout): Initiate a 5-minute communication block on any unit, synchronized across Redis and the UI.

Data Purge: Exclusive permission to perform hard-deletes on database message records.

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
3. Run the Operation
Bash
# In backend directory
npm run dev

# In frontend directory
npm run dev
