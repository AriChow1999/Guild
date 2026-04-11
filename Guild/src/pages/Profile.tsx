/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, FileText, ChevronRight, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from '../store/authStore';
import './Profile.css';

const Profile: React.FC = () => {
  // 1. TACTICAL SELECTORS
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const [isEditing, setIsEditing] = useState(false);

  // 2. FORM STATE (Local volatile memory)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    bio: ''
  });

  // 3. HYDRATION: Fill form when user data arrives or changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Password stays empty in state for security
        bio: user.bio || ''
      });
    }
  }, [user]);

  // 4. UPDATE MUTATION
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: any) => {
      const response = await axios.put('http://localhost:5000/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update global identity state
      setUser(updatedUser);
      toast.success("Profile Updated");
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' })); // Clear local password
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Update Failed");
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Build the secure payload
    const payload: any = {
      username: formData.username,
      bio: formData.bio
    };

    // Only include password if the user actually typed a new one
    if (formData.password.trim().length > 0) {
      if (formData.password.length < 8) {
        return toast.warn("Min 8 characters");
      }
      payload.password = formData.password;
    }

    mutate(payload);
  };

  if (!user) return <div className="loading-overlay">AUTHENTICATING...</div>;

  return (
    <div className="profile-fortress">
      <ToastContainer position="top-right" theme="dark" />
      <div className="tactical-grid"></div>

      <div className="profile-content-wrapper">
        <div className="profile-container">

          {/* VISUAL IDENTITY PANEL */}
          <div className="profile-visual">
            <div className="visual-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop"
                alt="Operator Visual"
              />
            </div>
            <div className="visual-overlay"></div>
            <div className="visual-content">
              <div className="id-badge">
                <ShieldCheck size={14} color="#ff0000" />
                <span>OPERATOR_VERIFIED</span>
              </div>
              <h1 className="visual-title">OPERATOR <br /><span className="highlight">PROFILE.</span></h1>
            </div>
          </div>

          {/* DATA TERMINAL PANEL */}
          <div className="profile-terminal">
            <div className="terminal-header">
              <h2>IDENTITY_SETTINGS</h2>
              <div className="header-underline"></div>
            </div>

            <form className="terminal-form" onSubmit={handleSubmit}>
              {/* USERNAME FIELD */}
              <div className={`input-field ${!isEditing ? 'locked' : ''}`}>
                <label><User size={12} /> USERNAME</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
                <div className="input-bar"></div>
              </div>

              {/* EMAIL FIELD (READ-ONLY) */}
              <div className="input-field readonly">
                <label><Mail size={12} /> EMAIL (STATIC_ID)</label>
                <input type="email" value={formData.email} readOnly />
                <div className="input-bar static"></div>
              </div>

              {/* PASSWORD FIELD (MASKED) */}
              <div className={`input-field ${!isEditing ? 'locked' : ''}`}>
                <label><Lock size={12} /> PASSWORD</label>
                <input
                  type={isEditing ? "password" : "text"}
                  name="password"
                  // If not editing, show gibberish mask
                  value={isEditing ? formData.password : "••••••••••••"}
                  placeholder={isEditing ? "Enter new password" : ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  autoComplete="new-password"
                />
                <div className="input-bar"></div>
              </div>

              {/* BIO FIELD */}
              <div className={`input-field ${!isEditing ? 'locked' : ''}`}>
                <label><FileText size={12} /> MISSION_BIO</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  disabled={!isEditing}
                ></textarea>
                <div className="input-bar"></div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="submit"
                className={`action-btn ${isEditing ? 'save-mode' : 'edit-mode'}`}
                disabled={isPending}
              >
                <span>
                  {isPending ? 'SYNCING...' : isEditing ? 'DEPLOY_CHANGES' : 'MODIFY_IDENTITY'}
                </span>
                <ChevronRight size={18} />
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  ABORT_CHANGES
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;