/* eslint-disable @typescript-eslint/no-unused-vars */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User';
import Guild from './models/Guild';
import Channel from './models/Channel';
import Message from './models/Message';
import fastifyRedis from '@fastify/redis';

dotenv.config();

const fastify = Fastify({ logger: true });

// --- PLUGINS ---
fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
});

fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'fortress_super_secret_key_2026'
});


// Register Redis
fastify.register(fastifyRedis, {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    closeClient: false
});

fastify.ready((err) => {
    if (err) {
        // This will print the ACTUAL system error from Redis
        console.error("DEBUG -> Full Error Object:", err);

        fastify.log.error(`REDIS_ERROR: ${err.message}`);
        process.exit(1);
    }
    fastify.log.info('--- REDIS_UPLINK_ESTABLISHED ---');
});
// --- AUTH ENDPOINTS ---

fastify.post('/auth/signup', async (request, reply) => {
    try {
        const { username, email, password, bio } = request.body as any;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return reply.status(400).send({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = new User({
            username: username,
            email: email.toLowerCase(),
            password: hashedPassword,
            bio
        });

        await newUser.save();
        return reply.status(201).send({ message: 'User Saved' });

    } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ message: 'Signup Failed' });
    }
});


fastify.post('/auth/login', async (request, reply) => {
    try {
        const { email, password } = request.body as any;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return reply.status(401).send({ message: 'No such user exists' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return reply.status(401).send({ message: 'Invalid password' });
        }

        // Fastify JWT signing
        const token = fastify.jwt.sign(
            { id: user._id, name: user.username },
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            message: `Welcome, ${user.username}`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio
            }
        };

    } catch (err) {
        return reply.status(500).send({ message: 'Login failed' });
    }
});


fastify.get('/auth/me', async (request, reply) => {
    try {
        // This checks the header, verifies the secret, and decodes the payload
        const decoded: any = await request.jwtVerify();

        // Now you use the id from the decoded token to find the user
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return reply.status(404).send({ error: 'User Not Found' });
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio,
            is_banned: user.is_banned,
            timeout_until: user.timeout_until

        };
    } catch (err) {
        // If jwtVerify fails (expired, tampered, or missing), it throws an error
        return reply.status(401).send({ error: 'Error Occured' });
    }
});


fastify.put('/auth/profile', async (request, reply) => {
    try {
        // 1. Verify who is calling
        const decoded: any = await request.jwtVerify();

        // 2. Get the new data from the frontend
        const { username, bio, password } = request.body as any;

        // 3. Find the operator in the database
        const user = await User.findById(decoded.id);
        if (!user) return reply.status(404).send({ message: 'Invalid User' });

        // 4. Apply changes
        if (username) user.username = username;
        if (bio !== undefined) user.bio = bio;

        // 5. Hash new password only if provided
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        // 6. Return the clean data (No password!)
        return {
            id: user._id,
            username: user.username,
            email: user.email,
            bio: user.bio
        };
    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});

// -----------------------------GUILD--------------------------------
// 1. GET ALL GUILDS
fastify.get('/auth/guilds', async (request, reply) => {
    try {
        await request.jwtVerify();

        // Returning full Mongoose documents
        const guilds = await Guild.find();

        return guilds;
    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});

// 2. CREATE GUILD
// 1. CREATE GUILD: POST /auth/guild
fastify.post('/auth/guild', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { name, description } = request.body as any;

        if (!name) {
            return reply.status(400).send({ message: 'Guild name is required' });
        }

        // --- NEW LOGIC: LIMIT 1 GUILD PER USER ---
        const existingGuild = await Guild.findOne({ owner_id: decoded.id });
        if (existingGuild) {
            return reply.status(400).send({
                message: 'You have already created a guild. Limit is 1 guild per user.'
            });
        }

        // Fetch the creator's user data to embed it in the members list
        const creator = await User.findById(decoded.id);
        if (!creator) {
            return reply.status(404).send({ message: 'User not found' });
        }

        const newGuild = new Guild({
            name,
            description: description || "",
            owner_id: decoded.id,
            members: [creator],
            channels: []
        });

        const savedGuild = await newGuild.save();
        return reply.status(201).send(savedGuild);

    } catch (err) {
        console.log(err)
        return reply.status(401).send({ message: 'Unexpected Error' });
    }
});

// 3. DELETE GUILD
fastify.delete('/auth/guild/:id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { id } = request.params as any;

        const guild = await Guild.findById(id);

        if (!guild) {
            return reply.status(404).send({ message: 'Guild not found' });
        }

        // Security Check: Ensure owner_id matches decoded.id
        if (guild.owner_id !== decoded.id) {
            return reply.status(403).send({ message: 'Only the owner can delete this guild' });
        }
        await Message.deleteMany({ guild_id: id });
        await Guild.findByIdAndDelete(id);
        return { message: 'Guild deleted successfully', id };

    } catch (err) {
        return reply.status(401).send({ message: 'Unexpected Error' });
    }
});


// -----------------------------------CHANNEL---------------------------------------
// 1. SHOW ALL CHANNELS
fastify.get('/auth/my-channels', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();

        const guild = await Guild.findOne({ owner_id: decoded.id });
        if (!guild) return reply.status(404).send({ message: 'Guild not found' });

        return guild.channels;

    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});

// 2. CREATE CHANNEL
fastify.post('/auth/channel', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { name, topic } = request.body as any;

        if (!name) return reply.status(400).send({ message: 'Channel name is required' });

        // Find the specific guild owned by this user
        const guild = await Guild.findOne({ owner_id: decoded.id });

        if (!guild) {
            return reply.status(404).send({ message: 'You do not own a guild' });
        }

        // Limit Check: Max 3 channels
        if (guild.channels.length >= 3) {
            return reply.status(400).send({ message: 'Maximum limit of 3 channels reached' });
        }

        // Push the new channel into the nested array
        guild.channels.push({
            name,
            topic: topic || "",
            created_by: decoded.id
        } as any);

        await guild.save();

        // Return the newly created channel
        return reply.status(201).send(guild.channels[guild.channels.length - 1]);

    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});

// 3. DELETE CHANNEL
fastify.delete('/auth/channel/:channel_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { channel_id } = request.params as any;

        // Ensure we only look in the guild the user actually owns
        const guild = await Guild.findOne({ owner_id: decoded.id });

        if (!guild) return reply.status(404).send({ message: 'Guild not found' });

        await Message.deleteMany({ channel_id: channel_id });

        // Use Mongoose pull to remove by subdocument _id
        (guild.channels as any).pull({ _id: channel_id });
        await guild.save();

        return { message: 'Channel deleted successfully' };

    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});


// ------------------------------------MESSAGES----------------------------------------
// 1. POST MESSAGES
const LIMITS = {
    USER_MAX: 20,
    CHANNEL_MAX: 100,
    WINDOW_SECONDS: 60
};

fastify.post('/auth/message/:guild_id/:channel_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, channel_id } = request.params as any;
        const { content } = request.body as any;

        if (!content) return reply.status(400).send({ message: "Content is required" });

        // --- START REDIS RATE LIMITING ---
        const { redis } = fastify as any;
        const userKey = `ratelimit:user:${decoded.id}`;
        const channelKey = `ratelimit:channel:${channel_id}`;

        // Atomic increments for both user and channel
        const [userCount, channelCount] = await Promise.all([
            redis.incr(userKey),
            redis.incr(channelKey)
        ]);

        // Set TTL on first message in the window
        if (userCount === 1) await redis.expire(userKey, LIMITS.WINDOW_SECONDS);
        if (channelCount === 1) await redis.expire(channelKey, LIMITS.WINDOW_SECONDS);

        // Check Violation: User Limit
        if (userCount > LIMITS.USER_MAX) {
            const ttl = await redis.ttl(userKey);
            return reply.status(429).send({
                error: "USER_SPAM_DETECTED",
                message: `Slow down. You can send more messages in ${ttl}s.`
            });
        }

        // Check Violation: Channel Slowmode
        if (channelCount > LIMITS.CHANNEL_MAX) {
            return reply.status(429).send({
                error: "CHANNEL_SLOWMODE",
                message: "This channel is currently too busy. Try again in a minute."
            });
        }
        // --- END REDIS RATE LIMITING ---


        // --- REDIS SESSION-TIMEOUT CHECK ---
        const timeoutKey = `timeout:guild:${guild_id}:user:${decoded.id}`;
        const isTimedOut = await redis.get(timeoutKey);

        if (isTimedOut) {
            const ttl = await redis.ttl(timeoutKey); // Get remaining seconds
            return reply.status(403).send({
                error: "USER_TIMED_OUT",
                message: `You are currently timed out. You can message again in ${ttl}s.`,
                retry_after: ttl
            });
        }

        // 1. Find the Guild to check membership
        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "Guild not found" });

        // 2. MEMBERSHIP CHECK
        const isMember = guild.members.some(
            (m: any) => String(m._id) === String(decoded.id)
        );

        if (!isMember) {
            return reply.status(403).send({ message: "You are not a member of this guild" });
        }

        // 3. CHANNEL CHECK
        const channelExists = guild.channels.some(
            (c: any) => String(c._id) === channel_id
        );
        if (!channelExists) {
            return reply.status(404).send({ message: "Channel not found in this guild" });
        }

        // 4. SAVE MESSAGE
        const newMessage = new Message({
            guild_id,
            channel_id,
            sender_id: decoded.id,
            sender_name: decoded.name || "Anonymous",
            content: content
        });

        const savedMessage = await newMessage.save();
        return reply.status(201).send(savedMessage);

    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
});

// 2. GET MESSAGES
fastify.get('/auth/messages/:guild_id/:channel_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, channel_id } = request.params as any;

        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "Guild not found" });

        // Security: Check if User B is in the members array
        const isMember = guild.members.some(
            (m: any) => String(m._id) === String(decoded.id)
        );
        if (!isMember) return reply.status(403).send({ message: "Access Denied" });

        // FETCH ALL: No limit, only active messages
        const messages = await Message.find({ channel_id })
            .sort({ created_at: 1 }); // Changed to 1 so oldest is at top (standard chat flow)

        return messages;

    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
});


// 3. EDIT MESSAGES
fastify.patch('/auth/message/edit/:guild_id/:message_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, message_id } = request.params as any;
        const { content } = request.body as any;
        const { redis } = fastify as any;

        const guild = await Guild.findById(guild_id);
        const message = await Message.findById(message_id);

        if (!guild || !message) return reply.status(404).send({ message: 'Resource not found' });

        // 1. IDENTITY CHECK
        const userId = String(decoded.id);
        const isOwner = String(guild.owner_id) === userId;
        const isSender = String(message.sender_id) === userId;

        // 2. MEMBERSHIP CHECK: Is this user currently in the 5-person member list?
        const isMember = guild.members.some(m => String((m as any)._id) === userId);

        // REDIS TIMEOUT CHECK
        const timeoutKey = `timeout:guild:${guild_id}:user:${decoded.id}`;
        const isTimedOut = await redis.get(timeoutKey);

        if (isTimedOut) {
            const ttl = await redis.ttl(timeoutKey); // Get remaining seconds
            return reply.status(403).send({
                error: "USER_TIMED_OUT",
                message: `You are currently timed out. You can edit again in ${ttl}s.`,
                retry_after: ttl
            });
        }

        // 3. PERMISSION LOGIC
        // A user can edit if they are the OWNER 
        // OR if they are a CURRENT MEMBER and they were the ORIGINAL SENDER.
        if (isOwner || (isMember && isSender)) {
            message.content = content;
            await message.save();
            return { message: 'Updated successfully', data: message };
        }

        return reply.status(403).send({
            message: 'Unauthorized: You must be a member and the sender (or admin) to edit.'
        });

    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized' });
    }
});


// 4. SOFT DELETE
fastify.patch('/auth/message/soft-delete/:guild_id/:message_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, message_id } = request.params as any;
        const { redis } = fastify as any;

        const guild = await Guild.findById(guild_id);
        const message = await Message.findById(message_id);

        if (!guild || !message) {
            return reply.status(404).send({ message: 'Guild or Message not found' });
        }

        const userId = String(decoded.id);


        const isMember = guild.members.some(m => String((m as any)._id) === userId);

        const isOwner = String(guild.owner_id) === userId;
        const isSender = String(message.sender_id) === userId;

        // REDIS TIMEOUT CHECK
        const timeoutKey = `timeout:guild:${guild_id}:user:${decoded.id}`;
        const isTimedOut = await redis.get(timeoutKey);

        if (isTimedOut) {
            const ttl = await redis.ttl(timeoutKey); // Get remaining seconds
            return reply.status(403).send({
                error: "USER_TIMED_OUT",
                message: `You are currently timed out. You can soft delete again in ${ttl}s.`,
                retry_after: ttl
            });
        }


        if (isOwner || (isMember && isSender)) {
            message.is_deleted = true;
            await message.save();
            return { message: 'Message soft-deleted successfully' };
        }

        return reply.status(403).send({
            message: 'Forbidden: You do not have permission to delete this message or are no longer a member.'
        });

    } catch (err) {
        return reply.status(401).send({ message: 'Unauthorized session' });
    }
});

// 5. HARD DELETE
fastify.delete('/auth/message/hard-delete/:guild_id/:message_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, message_id } = request.params as any;

        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: 'Guild not found' });

        // STRICT PERMISSION: Only the Guild Owner
        const isOwner = String(guild.owner_id) === String(decoded.id);

        if (!isOwner) {
            return reply.status(403).send({ message: 'Only the Admin can hard-delete messages' });
        }

        await Message.findByIdAndDelete(message_id);

        return { message: 'Message permanently deleted from database' };
    } catch (err) {
        return reply.status(401).send({ message: 'Error' });
    }
});


// ----------------------------GRANTING ACCESS---------------------------------
// 1. GRANT ACCESS: POST /auth/guild/grant/:guild_id
fastify.post('/auth/guild/grant/:guild_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id } = request.params as any;
        const { username } = request.body as any;

        if (!username) return reply.status(400).send({ message: "Username required" });

        // 1. Find Guild and Verify Ownership
        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "Guild not found" });

        if (String(guild.owner_id) !== String(decoded.id)) {
            return reply.status(403).send({ message: "ACCESS_DENIED // ADMIN_ONLY" });
        }

        // 2. Find Target User
        const targetUser = await User.findOne({ username: username });
        if (!targetUser) return reply.status(404).send({ message: "User not found in system" });

        // 3. Add to members if not already present
        const isAlreadyMember = guild.members.some(m => String((m as any)._id) === String(targetUser._id));
        if (isAlreadyMember) return reply.status(400).send({ message: "User already in guild" });

        guild.members.push(targetUser);
        await guild.save();

        return { message: `ACCESS_GRANTED // ${targetUser.username.toUpperCase()}` };

    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
});

// 2.------------------------------------ KICK USER----------------------------------------
// KICK USER: POST /auth/guild/kick/:guild_id/:member_id
fastify.post('/auth/guild/kick/:guild_id/:member_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, member_id } = request.params as any;

        // 1. Ownership & Admin Check
        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "GUILD_NOT_FOUND" });

        if (String(guild.owner_id) !== String(decoded.id)) {
            return reply.status(403).send({ message: "ACCESS_DENIED // ADMIN_ONLY" });
        }

        // 2. Prevent Self-Kick
        if (String(member_id) === String(decoded.id)) {
            return reply.status(400).send({ message: "ERROR // CANNOT_KICK_OWNER" });
        }

        // 3. Perform the Pull
        // We use updateOne for efficiency since we don't need the document back
        const result = await Guild.updateOne(
            { _id: guild_id },
            { $pull: { members: { _id: member_id } } }
        );

        return {
            message: "USER KICKED SUCCESSFULLY",
            member_id
        };

    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized Session" });
    }
});

// ----------------------------------------REDIS MANAGEMENT-------------------------------------------------
// 1. START / HEARTBEAT
fastify.post('/auth/channels/:channel_id/typing/start', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { channel_id } = request.params as any;

        // Extracting directly from the verified token payload
        // Key is channel specific; value is the username (decoded.name)
        const key = `typing:channel:${channel_id}:user:${decoded.id}`;

        // 5-second TTL for high-frequency updates
        await fastify.redis.set(key, decoded.name, 'EX', 5);

        return reply.status(204).send();
    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
});

// 2. EXPLICIT STOP
fastify.post('/auth/channels/:channel_id/typing/stop', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { channel_id } = request.params as any;

        const key = `typing:channel:${channel_id}:user:${decoded.id}`;
        await fastify.redis.del(key);

        return reply.status(204).send();
    } catch (err) {
        return reply.status(401).send({ message: "Error Occured" });
    }
});

// 3. RETRIEVE ACTIVE TYPERS
fastify.get('/auth/channels/:channel_id/typing', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { channel_id } = request.params as any;

        const pattern = `typing:channel:${channel_id}:user:*`;
        const keys = await fastify.redis.keys(pattern);

        if (keys.length === 0) return { users: [] };

        // Pull all usernames at once via MGET
        const users = await fastify.redis.mget(...keys);

        // Filter nulls (safety for race conditions)
        return { users: users.filter(u => u !== null) };
    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
});

// ---------------------------- MODERATION OPERATIONS ---------------------------------

// 1. TIMEOUT USER (Mute via Redis)
fastify.post('/auth/guild/timeout/:guild_id/:member_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, member_id } = request.params as any;

        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "GUILD_NOT_FOUND" });

        // Security: Admin Only & No Self-Targeting
        if (String(guild.owner_id) !== String(decoded.id)) {
            return reply.status(403).send({ message: "ACCESS_DENIED // ADMIN_ONLY" });
        }
        if (String(member_id) === String(decoded.id)) {
            return reply.status(400).send({ message: "ERROR // CANNOT_TIMEOUT_OWNER" });
        }

        const DURATION_SECONDS = 5 * 60;

        // 1. REDIS: Set block
        const timeoutKey = `timeout:guild:${guild_id}:user:${member_id}`;
        await fastify.redis.set(timeoutKey, "true", 'EX', DURATION_SECONDS);

        // 2. MONGODB: Find member in array and update
        const member = guild.members.find((m: any) => String(m._id) === String(member_id));

        if (!member) {
            return reply.status(404).send({ message: "MEMBER_NOT_FOUND_IN_GUILD" });
        }

        member.timeout_until = true;

        // CRITICAL: Tell Mongoose the nested 'members' array was modified
        guild.markModified('members');
        await guild.save();

        return {
            message: "UNIT_SILENCED_FOR_5_MINUTES",
            member_id
        };
    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized Session" });
    }
});

// 2. REMOVE TIMEOUT (Unmute)
fastify.delete('/auth/guild/timeout/:guild_id/:member_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, member_id } = request.params as any;

        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "GUILD_NOT_FOUND" });

        if (String(guild.owner_id) !== String(decoded.id)) {
            return reply.status(403).send({ message: "UNAUTHORIZED_ACCESS // ADMIN_ONLY" });
        }

        // 1. REDIS: Remove the block
        await fastify.redis.del(`timeout:guild:${guild_id}:user:${member_id}`);

        // 2. MONGODB: Find member and clear timestamp
        const member = guild.members.find((m: any) => String(m._id) === String(member_id));

        if (member) {
            member.timeout_until = false;

            // CRITICAL: Tell Mongoose the nested 'members' array was modified
            guild.markModified('members');
            await guild.save();
        }

        return { message: "COMMUNICATIONS_RESTORED", member_id };
    } catch (err) {
        return reply.status(401).send({ message: "Error" });
    }
});

// 3. BAN USER (Permanent via MongoDB)
fastify.post('/auth/guild/ban/:guild_id/:member_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, member_id } = request.params as any;

        const guild = await Guild.findById(guild_id);
        if (!guild) return reply.status(404).send({ message: "GUILD_NOT_FOUND" });

        // Security: Admin Only & No Self-Ban
        if (String(guild.owner_id) !== String(decoded.id)) {
            return reply.status(403).send({ message: "ACCESS_DENIED // ADMIN_ONLY" });
        }
        if (String(member_id) === String(decoded.id)) {
            return reply.status(400).send({ message: "ERROR // CANNOT_BAN_OWNER" });
        }

        // We use $set to flag the member in the nested array if they exist, 
        // or we handle it via a dedicated ban field if you updated the schema.
        // For now, let's assume we update the 'is_banned' property on the member.
        await Guild.updateOne(
            {
                _id: new mongoose.Types.ObjectId(guild_id),
                "members._id": new mongoose.Types.ObjectId(member_id)
            },
            { $set: { "members.$.is_banned": true } }
        );
        // Optional: Also Kick them from the active members list if you prefer 
        // to keep banned users in a separate list.

        return { message: "UNIT_EXCLUDED_PERMANENTLY", member_id };
    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }
});

// 4. UNBAN USER
fastify.post('/auth/guild/unban/:guild_id/:member_id', async (request, reply) => {
    try {
        const decoded: any = await request.jwtVerify();
        const { guild_id, member_id } = request.params as any;

        const guild = await Guild.findById(guild_id);

        // 1. Check if the Guild exists at all
        if (!guild) {
            return reply.status(404).send({ message: "GUILD_NOT_FOUND" });
        }

        // 2. Check if the person asking is the actual Owner
        if (String(guild.owner_id) !== String(decoded.id)) {
            return reply.status(403).send({ message: "ACCESS_DENIED // ADMIN_ONLY" });
        }

        // 3. Perform the update
        await Guild.updateOne(
            {
                _id: new mongoose.Types.ObjectId(guild_id),
                "members._id": new mongoose.Types.ObjectId(member_id)
            },
            { $set: { "members.$.is_banned": false } }
        );

        return { message: "UNIT_REINSTATED", member_id };
    } catch (err) {
        return reply.status(401).send({ message: "SESSION_EXPIRED_OR_INVALID" });
    }
});

// --- SERVER START ---
const start = async () => {
    try {
        // Ensure DB is ready before we start listening
        await mongoose.connect(process.env.MONGO_URL || 'mongodb+srv://admin:Arijit1999@cluster0.w6n0fsr.mongodb.net/?appName=Cluster0');
        console.log("DATABASE CONNECTED");

        // host: '0.0.0.0' allows for local network testing (phone/tablet)
        await fastify.listen({ port: 5000, host: '0.0.0.0' });
        console.log(`SERVER RUNNING ON PORT: 5000`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();