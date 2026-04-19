import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Hash, Send, User, Trash2, Edit2, ShieldAlert,
    X, Settings, ShieldCheck, UserMinus, Unlock, ZapOff, Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosConfig';
import './Dashboard.css';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

// --- INTERFACES ---
interface BackendError {
    message: string;
}

interface Member {
    _id: string;
    username?: string;
    password: string;
    bio?: string;
    created_at: string;
    is_banned: boolean;
    timeout_until: boolean
}

interface Message {
    _id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: string;
    is_deleted?: boolean;
}

interface Channel {
    _id: string;
    name: string;
    topic: string;
}

interface Guild {
    _id: string;
    name: string;
    description: string;
    owner_id: string;
    members: Member[];
    channels: Channel[];
}

type AdminTab = 'members' | 'grant' | 'kick' | 'timeout' | 'ban' | 'unban';

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();


    // Local UI State
    const [activeGuildId, setActiveGuildId] = useState<string | null>(null);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<AdminTab>('members');

    // --- DATA FETCHING ---
    const { data: guilds = [] } = useQuery<Guild[]>({
        queryKey: ['guilds'],
        queryFn: async () => (await api.get('/auth/guilds')).data
    });

    const { data: messages = [] } = useQuery<Message[]>({
        queryKey: ['messages', activeChannelId],
        queryFn: async () => (await api.get(`/auth/messages/${activeGuildId}/${activeChannelId}`)).data,
        enabled: !!activeChannelId && !!activeGuildId,
        refetchInterval: 3000,
    });

    // 1. Fetching logic: Who is typing in this channel?
    const { data: typingUsers = [] } = useQuery({
        queryKey: ['typing', activeChannelId],
        queryFn: async () => {
            const res = await api.get(`/auth/channels/${activeChannelId}/typing`);
            return (res.data.users || []).filter((name: string) => name !== user?.username);
        },
        enabled: !!activeChannelId,
        refetchInterval: 1500,
    });

    // 2. Typing Trigger logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMessageInput(val);

        // HIGH-FREQUENCY: No throttle, fire every time
        if (val.length > 0) {
            api.post(`/auth/channels/${activeChannelId}/typing/start`).catch(() => { });
        } else {
            api.post(`/auth/channels/${activeChannelId}/typing/stop`).catch(() => { });
        }
    };


    // Derived Logic
    const activeGuild = guilds.find((g) => g._id === activeGuildId);
    const isAdmin = activeGuild?.owner_id === user?.id;
    const isMember = activeGuild?.members.some(m => m._id === user?.id) || isAdmin;
    const activeChannel = activeGuild?.channels.find(c => c._id === activeChannelId);

    // 1. Find the current user in the guild's member list
    const currentUserMember = activeGuild?.members.find(m => m._id === user?.id);

    // 2. Check if banned
    const isBanned = !!currentUserMember?.is_banned;


    // 4. Combined block status
    const isRestricted = isBanned;


    // --- 1. NEW: SCROLL REFERENCE & LOGIC ---
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = (behavior: "smooth" | "auto") => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    };

    // Automatically scroll when messages change or channel changes
    useEffect(() => {
        // If it's a new channel, jump ('auto'), if it's a new message, slide ('smooth')
        const behavior = messages.length <= 1 ? "auto" : "smooth";
        scrollToBottom(behavior);
    }, [messages, activeChannelId]);


    // --- MUTATIONS ---
    const createGuildMutation = useMutation({
        mutationFn: (payload: { name: string; description: string }) =>
            api.post('/auth/guild', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
            toast.success("GUILD CREATED");
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "GUILD CREATION FAILED");
        }
    });

    // NEW: Create Channel Mutation
    const createChannelMutation = useMutation({
        mutationFn: (payload: { name: string; topic: string }) =>
            api.post('/auth/channel', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
            toast.success("CHANNEL CREATION SUCCESS");
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "CHANNEL CREATION FAILED");
        }
    });

    const messageMutation = useMutation({
        mutationFn: (payload: { content: string, msgId?: string }) => {
            if (payload.msgId) return api.patch(`/auth/message/edit/${activeGuildId}/${payload.msgId}`, { content: payload.content });
            return api.post(`/auth/message/${activeGuildId}/${activeChannelId}`, { content: payload.content });
        },
        onSuccess: () => {
            setMessageInput('');
            setEditingId(null);
            queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "MESSAGE CREATION FAILED");
        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: ({ msgId, hard }: { msgId: string, hard: boolean }) => {
            if (hard) {
                return api.delete(`/auth/message/hard-delete/${activeGuildId}/${msgId}`);
            }
            return api.patch(`/auth/message/soft-delete/${activeGuildId}/${msgId}`);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
            toast.info(response.data.message);
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "DELETION_FAILED");
        }
    });

    const deleteGuildMutation = useMutation({
        mutationFn: () => api.delete(`/auth/guild/${activeGuildId}`),
        onSuccess: () => {
            setActiveGuildId(null);
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
            toast.success("GUILD DELETED");
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "DELETION_FAILED");
        }
    });

    // NEW: Delete Channel Mutation
    const deleteChannelMutation = useMutation({
        mutationFn: (chId: string) => api.delete(`/auth/channel/${chId}`),
        onSuccess: () => {
            setActiveChannelId(null);
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
            toast.success("CHANNEL DELETED");
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "DELETION FAILED");
        }
    });

    // --- HANDLERS ---
    const handleCreateGuild = () => {
        const name = prompt("ENTER GUILD NAME:");
        if (!name) return;
        const description = prompt("ENTER GUILD DESCRIPTION:") || "";
        createGuildMutation.mutate({ name, description });
    };

    // NEW: Create Channel Handler
    const handleCreateChannel = () => {
        if (!isAdmin) return;
        const name = prompt("ENTER_CHANNEL_NAME:");
        if (!name) return;
        const topic = prompt("ENTER_CHANNEL_TOPIC (OPTIONAL):") || "";
        createChannelMutation.mutate({ name, topic });
    };


    const grantAccessMutation = useMutation({
        mutationFn: (payload: { username: string }) =>
            api.post(`/auth/guild/grant/${activeGuildId}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
            toast.success("ACCESS_GRANTED");
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "GRANT_FAILED");
        }
    });

    const kickMutation = useMutation({
        mutationFn: (payload: { memberId: string }) =>
            api.post(`/auth/guild/kick/${activeGuildId}/${payload.memberId}`),
        onSuccess: () => {
            // Refresh the guild data so the member list updates immediately
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
            toast.warn("USER EXPELLED");
        },
        onError: (error: AxiosError<BackendError>) => {
            toast.error(error.response?.data?.message || "KICK_FAILED");
        }
    });

    // Apply a 5-minute timeout
    const timeoutMutation = useMutation({
        mutationFn: ({ memberId }: { memberId: string }) =>
            api.post(`/auth/guild/timeout/${activeGuildId}/${memberId}`),
        onSuccess: (_, { memberId }) => {
            // Refresh the guild data so the 'timeout_until' timestamp flows into the UI
            toast.success("USER TIMED OUT, ")
            queryClient.invalidateQueries({ queryKey: ['guilds'] });

            setTimeout(async () => {
                try {
    
                    await api.delete(`/auth/guild/timeout/${activeGuildId}/${memberId}`);

                    queryClient.invalidateQueries({ queryKey: ['guilds'] });

                } catch (error) {
                    // Step 1: Cast the error so you can access Axios properties
                    const err = error as AxiosError<BackendError>;

                    // Step 2: Now you can use it just like you did in onError
                    const message = err.response?.data?.message || "CLEANUP_FAILED";

                    toast.error(`Auto-restore failed: ${message}`);
                }
            }, 300000);
        },
        onError: (err: AxiosError<BackendError>) => {
            toast.error(err.response?.data?.message || "TIMEOUT FAILED")
        }
    });

    // Remove a timeout (Set timeout_until to null)
    const removeTimeoutMutation = useMutation({
        mutationFn: ({ memberId }: { memberId: string }) =>
            api.delete(`/auth/guild/timeout/${activeGuildId}/${memberId}`),
        onSuccess: () => {
            toast.success("USER REMOVED FROM TIMEOUT")
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
        },
        onError: (err: AxiosError<BackendError>) => {
            toast.error(err.response?.data?.message || "ERROR OCCURED")
        }
    });

    // BAN: Sending 'action' as the second argument (Body)
    // Ban the user
    const banMutation = useMutation({
        mutationFn: ({ memberId }: { memberId: string }) =>
            api.post(`/auth/guild/ban/${activeGuildId}/${memberId}`),
        onSuccess: () => {
            toast.warn("USER BANNED")
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
        },
        onError: (err: AxiosError<BackendError>) => {
            toast.error(err.response?.data?.message || "USER BAN FAILED")
        }
    });

    // Unban the user
    const unbanMutation = useMutation({
        mutationFn: ({ memberId }: { memberId: string }) =>
            api.post(`/auth/guild/unban/${activeGuildId}/${memberId}`),
        onSuccess: () => {
            toast.success("USER REMOVED FROM BAN")
            queryClient.invalidateQueries({ queryKey: ['guilds'] });
        },
        onError: (err: AxiosError<BackendError>) => {
            toast.error(err.response?.data?.message || "ERROR OCCURED")
        }
    });



    return (
        <div className="dash-fortress">
            <div className="tactical-grid"></div>
            <div className="fortress-viewport-scroll">

                {/* LEFT RAIL: GUILD SELECTION */}
                <aside className="guild-rail">
                    <div className="helmet-frame"><span className="lambda">Λ</span></div>
                    {guilds.map((g) => (
                        <div key={g._id}
                            className={`guild-hex ${activeGuildId === g._id ? 'active' : ''}`}
                            onClick={() => { setActiveGuildId(g._id); setActiveChannelId(null); }}>
                            {g.name[0].toUpperCase()}
                        </div>
                    ))}
                    <button className="add-guild-btn" onClick={handleCreateGuild}>
                        <Plus size={20} />
                    </button>
                </aside>

                {/* SIDEBAR: CHANNEL NAVIGATION */}
                <aside className="channel-sidebar">
                    <div className="sidebar-header">
                        <h3 className="guild-title">{activeGuild?.name || "SYS_IDLE"}</h3>
                        {isAdmin && (
                            <div className="admin-quick-actions">
                                <Settings size={16} className="manage-trigger" onClick={() => setIsAdminModalOpen(true)} />
                                <Trash2 size={16} className="danger-trigger" onClick={() => { if (window.confirm("PURGE_GUILD?")) deleteGuildMutation.mutate(); }} />
                            </div>
                        )}
                    </div>

                    <div className="sidebar-content">
                        <div className="section-header">
                            <span>CHANNELS ({activeGuild?.channels.length || 0}/3)</span>
                            {isAdmin && <Plus size={14} className="add-icon" onClick={handleCreateChannel} style={{ cursor: 'pointer' }} />}
                        </div>
                        {activeGuild?.channels.map(ch => (
                            <div key={ch._id}
                                className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`}
                                onClick={() => setActiveChannelId(ch._id)}>
                                <div className="ch-label"><Hash size={14} /> <span>{ch.name}</span></div>
                                {isAdmin && <X size={12} className="delete-ch" onClick={(e) => { e.stopPropagation(); deleteChannelMutation.mutate(ch._id); }} />}
                            </div>
                        ))}
                    </div>

                    <div className="operator-footer">
                        <div className="avatar-box"><User size={18} color="#ff0000" /></div>
                        <div className="op-meta">
                            <span className="name">{user?.username}</span>
                            <span className="status">{isAdmin ? 'ADMIN' : isMember ? 'MEMBER' : 'GUEST'}</span>
                        </div>
                    </div>
                </aside>

                {/* MAIN TERMINAL: MESSAGE FLOW */}
                <main className="chat-terminal">
                    <div className="terminal-header">
                        {activeChannel ? `#${activeChannel.name}` : "AWAITING_UPLINK..."}
                    </div>

                    <div className="messages-flow">
                        {/* LOCK: Only map messages if the user is a verified member */}
                        {isMember && !isRestricted ? (
                            <>
                                {messages.map((m) => (
                                    <div key={m._id} className={`msg-block ${m.is_deleted ? 'soft-deleted' : ''}`}>
                                        <div className="msg-info">
                                            <div className="msg-top">
                                                <span className="user">{m.sender_name}</span>
                                                <span className="msg-date">
                                                    <span className="d-log">
                                                        {new Date(m.created_at).toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                                                    </span>
                                                    <span className="t-log">
                                                        [{new Date(m.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}]
                                                    </span>
                                                </span>
                                                <div className="msg-actions">
                                                    {!m.is_deleted && (m.sender_id === user?.id || isAdmin) && (
                                                        <>
                                                            <Trash2 size={12} className="action-icon" onClick={() => deleteMessageMutation.mutate({ msgId: m._id, hard: false })} />
                                                            {m.sender_id === user?.id && <Edit2 size={12} className="action-icon" onClick={() => { setMessageInput(m.content); setEditingId(m._id); }} />}
                                                        </>
                                                    )}
                                                    {isAdmin && <ShieldAlert size={12} className="action-icon admin-hard" onClick={() => deleteMessageMutation.mutate({ msgId: m._id, hard: true })} />}
                                                </div>
                                            </div>
                                            <p className="body">{m.is_deleted ? "MESSAGE DELETED BY USER" : m.content}</p>
                                            <div ref={messagesEndRef}></div>
                                        </div>
                                    </div>
                                ))}

                                {/* --- TYPING INDICATOR SLOT --- */}
                                <div style={{ minHeight: '20px', padding: '10px 0', opacity: 0.8 }}>
                                    {typingUsers.length > 0 && (
                                        <div style={{ color: '#ff0000', fontSize: '0.65rem', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                            <span className="blink-terminal">_</span>
                                            {typingUsers.join(', ').toUpperCase()} {typingUsers.length > 1 ? 'ARE' : 'IS'} TYPING...
                                        </div>
                                    )}
                                </div>

                            </>
                        ) : (
                            <div className="access-denied-prompt">
                                {/* Centered Area with radial gradient as per your code */}
                            </div>
                        )}
                    </div>

                    {/* MEMBER-ONLY INPUT */}
                    {isMember && !isRestricted ? (
                        <form className="input-area" onSubmit={(e) => { e.preventDefault(); if (messageInput.trim()) messageMutation.mutate({ content: messageInput, msgId: editingId || undefined }); }}>
                            <div className="input-box">
                                <input
                                    value={messageInput}
                                    onChange={handleInputChange} // USE THE NEW HANDLER
                                    placeholder={editingId ? "REVISING_DATA..." : "TRANSMIT_DATA..."}
                                    disabled={!activeChannelId}
                                />
                                <button type="submit" className="send-btn" disabled={!activeChannelId}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* The Restricted Access View */
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'radial-gradient(circle, rgba(255,0,0,0.05) 0%, rgba(0,0,0,0) 70%)',
                            paddingBottom: '250px'
                        }}>
                            <div style={{ textAlign: 'center', transform: 'translateY(-30px)' }}>
                                <ShieldAlert size={48} color="#ff0000" style={{ opacity: 0.5, marginBottom: '20px' }} />
                                <div style={{
                                    color: '#ff0000',
                                    fontFamily: 'monospace',
                                    fontSize: '1.2rem',
                                    letterSpacing: '4px',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 10px rgba(255, 0, 0, 0.3)'
                                }}>
                                    -- ACCESS_RESTRICTED --
                                    <br />
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '1px', marginTop: '10px', display: 'block' }}>
                                        MEMBERSHIP_REQUIRED_FOR_DATA_DECRYPTION
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ADMIN MODAL */}
            {isAdminModalOpen && activeGuild && (
                <div className="modal-backdrop" onClick={() => setIsAdminModalOpen(false)}>
                    <div className="tactical-modal" onClick={e => e.stopPropagation()}>

                        <div className="modal-header">
                            <span>{activeGuild.name}</span>
                            <X size={18} className="close-modal" onClick={() => setIsAdminModalOpen(false)} />
                        </div>

                        <div className="modal-tabs">
                            {(['members', 'grant', 'kick', 'timeout', 'ban', 'unban'] as AdminTab[]).map(t => (
                                <button key={t} className={activeTab === t ? 'active' : ''} onClick={() => setActiveTab(t)}>
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="modal-body">
                            {activeTab === 'grant' ? (
                                <form className="grant-form" onSubmit={(e) => {
                                    e.preventDefault();
                                    const user = new FormData(e.currentTarget).get('username') as string;
                                    if (user) grantAccessMutation.mutate({ username: user });
                                    e.currentTarget.reset();
                                }}>
                                    <input name="username" placeholder="IDENTIFY_USER_BY_NAME..." required className="tactical-input" />
                                    <button type="submit" className="grant-btn">GRANT_PERMISSIONS</button>
                                </form>
                            ) : (
                                activeGuild.members.map(member => {
                                    // FIX: Use MongoDB properties directly from the member object
                                    const isBanned = !!member.is_banned;

                                    // Check if timeout_until exists and is in the future
                                    const isMuted = !!member.timeout_until;

                                    const isOwner = activeGuild?.owner_id === member._id;

                                    return (
                                        <div key={member._id} className={`member-card ${isBanned ? 'unit-offline' : ''}`}>
                                            <div className="unit-id">
                                                <div className="status-indicator">
                                                    <ShieldCheck size={14} className={isBanned ? "dimmed" : "active-glow"} />
                                                    {/* <div className={`status-line ${isBanned ? 'offline' : 'online'}`} /> */}
                                                </div>

                                                <div className="identity-meta">
                                                    <span className={`username ${isBanned ? "strikethrough" : ""}`}>
                                                        {member.username || member._id}
                                                    </span>
                                                    <div className="status-cluster">
                                                        {isOwner && <span className="tactical-badge admin">ADMIN</span>}
                                                        {isBanned && <span className="tactical-badge banned">BANNED</span>}
                                                        {isMuted && <span className="tactical-badge muted">TIMEOUT</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="action-row">
                                                {/* --- TIMEOUT TAB --- */}
                                                {activeTab === 'timeout' && (
                                                    <button className={`op-button ${isMuted ? 'restore' : 'timeout'}`}
                                                        onClick={() => isMuted ? removeTimeoutMutation.mutate({ memberId: member._id }) : timeoutMutation.mutate({ memberId: member._id })}>
                                                        {isMuted ? <Zap size={16} /> : <ZapOff size={16} />}
                                                        <span className="btn-label">{isMuted ? 'RESTORE' : 'TIMEOUT'}</span>
                                                    </button>
                                                )}

                                                {/* --- BAN/UNBAN TAB --- */}
                                                {(activeTab === 'ban' || activeTab === 'unban') && (
                                                    <button className={`op-button ${isBanned ? 'restore' : 'ban'}`}
                                                        onClick={() => isBanned ? unbanMutation.mutate({ memberId: member._id }) : banMutation.mutate({ memberId: member._id })}>
                                                        {isBanned ? <Unlock size={16} /> : <ShieldAlert size={16} />}
                                                        <span className="btn-label">{isBanned ? 'GRANT_ACCESS' : 'TERMINATE'}</span>
                                                    </button>
                                                )}

                                                {/* --- KICK TAB --- */}
                                                {activeTab === 'kick' && !isBanned && (
                                                    <button className="op-button kick" onClick={() => {
                                                        if (window.confirm("CONFIRM_EXPULSION?")) kickMutation.mutate({ memberId: member._id });
                                                    }}>
                                                        <UserMinus size={16} />
                                                        <span className="btn-label">EXPEL USER</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;