# 🛡️ Guild Protocol

**Guild** is an elite, high-performance community management and messaging backend architecture. Built using the **MFRN stack** (MongoDB, Fastify, React, Node.js), it implements advanced administrative protocols, real-time state synchronization via **Redis**, and a secure "Tactical UI" designed for high-stakes environment management.

## ✨ Core Features

* **Tactical UI:** An industrial, glassmorphic interface built with custom CSS for high data density and clarity.
* **Real-Time Intelligence:** * **Typing Indicators:** Instant visual feedback showing specifically which units are active in the transmission field.
    * **Auto-Focus Messaging:** The viewport automatically scrolls and locks to new incoming transmissions, ensuring zero missed data.
* **Redis-Powered Moderation:** Real-time "Timeout" protocols with automatic UI synchronization and binary status tracking.
* **MFRN Architecture:** Leverages **Fastify** for ultra-low overhead routing and **TanStack Query** for efficient data fetching.

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite
* **Routing & State:** TanStack Router, Zustand, TanStack Query
* **Backend:** Fastify (High Performance), Node.js
* **Database:** MongoDB (Mongoose), Redis (Real-time state/TTL)
* **Security:** JWT (JSON Web Tokens) with auto-expiry logout.

## ⚠️ Operational Constraints & Anti-Spam

To maintain peak performance and structural integrity, the following limitations are enforced:

* **Guild Limit:** Each Identity (User) is permitted to establish only **one (1) Guild**.
* **Channel Capacity:** Each Guild is restricted to a maximum of **three (3) dedicated Channels**.
* **Anti-Spam Protocols:** * **User Cap:** Each individual unit can send a maximum of **20 messages** total.
    * **Channel Cap:** Each individual channel can hold a maximum of **100 messages**.

## ⚡ Permission Hierarchy & Authority

### Unit Permissions (Standard User)
* **Transmission Control:** Users possess the authority to **Edit** and **Soft-Delete** their own messages.
* **Restricted Access:** Users cannot modify or remove data sent by other units, nor can they alter Guild/Channel structures.

### Administrative Authority (Guild Owner)
The Admin possesses absolute control over the operational environment:

* **Structural Control:** Exclusive authority to **Delete the Guild** or **Remove Channels**.
* **Self-Management:** Full control to Edit, Soft-Delete, and **Hard-Delete** their own messages.
* **Universal Moderation:** Administrative override allowing the **Soft-Deletion** and **Hard-Deletion** of any message sent by any unit within the Guild.
* **Access Provisioning:** Authority to manually grant access to new units.
* **Unit Exclusion (Kick/Ban):** Ability to temporarily remove or permanently blacklist units.
* **Silence Protocol (Timeout):** Initiate a 5-minute communication block via Redis.

## 🛰️ API Protocol (Endpoints)

### Auth Endpoints
* `POST /auth/signup` - Register new identity.
* `POST /auth/login` - Authenticate and receive JWT.
* `GET /auth/me` - Retrieve current unit data.
* `PUT /auth/profile` - Update unit profile details.

### Guild Endpoints
* `GET /auth/guilds` - List accessible guilds.
* `POST /auth/guild` - Establish a new Guild (Limit: 1).
* `DELETE /auth/guild/:id` - Dissolve Guild (Admin Only).

### Channel Endpoints
* `GET /auth/my-channels` - List channels within a specific guild.
* `POST /auth/channel` - Create a new channel (Limit: 3).
* `DELETE /auth/channel/:channel_id` - Remove channel (Admin Only).

### Message Endpoints
* `POST /auth/message/:guild_id/:channel_id` - Transmit new message.
* `GET /auth/messages/:guild_id/:channel_id` - Fetch transmission history.
* `PATCH /auth/message/edit/:guild_id/:message_id` - Modify existing message.
* `PATCH /auth/message/soft-delete/:guild_id/:message_id` - Mark message as deleted.
* `DELETE /auth/message/hard-delete/:guild_id/:message_id` - Purge message from DB.

### User Moderation Endpoints
* `POST /auth/guild/grant/:guild_id` - Grant unit access.
* `POST /auth/guild/kick/:guild_id/:member_id` - Remove unit from guild.
* `POST /auth/guild/timeout/:guild_id/:member_id` - Activate silence protocol.
* `DELETE /auth/guild/timeout/:guild_id/:member_id` - Deactivate silence protocol.
* `POST /auth/guild/ban/:guild_id/:member_id` - Blacklist unit.
* `POST /auth/guild/unban/:guild_id/:member_id` - Remove unit from blacklist.

### Typing Endpoints
* `POST /auth/channels/:channel_id/typing/start` - Broadcast typing status.
* `POST /auth/channels/:channel_id/typing/stop` - Terminate typing status.
* `GET /auth/channels/:channel_id/typing` - Retrieve active typists.

## 📦 Getting Started

#### 1. Clone the repository

```bash
git clone [https://github.com/AriChow1999/Guild.git](https://github.com/AriChow1999/Guild.git)
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
Open two terminal instances to run the services simultaneously:

Terminal 1 (Backend):

Bash
cd backend
npm run dev
Terminal 2 (Frontend):

Bash
cd guild
npm run dev
