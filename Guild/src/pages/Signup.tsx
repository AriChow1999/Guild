import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { User, Mail, Lock, FileText, ChevronRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios'; // Added AxiosError for typing
import { toast } from 'react-toastify';
import './Signup.css';

// Define the shape of your backend error response
interface BackendError {
  message: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', bio: '' });

  // 1. TACTICAL REGISTRATION LOGIC
  const { mutate, isPending } = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const response = await axios.post('http://localhost:5000/auth/signup', userData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("USER REGISTERED");
      navigate({ to: '/login' });
    },
    onError: (error: AxiosError<BackendError>) => {
      // Type-safe error message extraction
      const errorMessage = error.response?.data?.message || "COMMUNICATION_FAILURE";
      toast.error(`${errorMessage}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <div className="signup-fortress">
      <div className="tactical-grid"></div>
      
      <div className="signup-content-wrapper">
        <div className="signup-container">
          
          <div className="signup-visual">
            <div className="visual-image-wrapper">
               <img 
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                alt="Gaming Console" 
              />
            </div>
            <div className="visual-overlay"></div>
            <div className="visual-content">
              <h1 className="visual-title">SECURE YOUR <br/><span className="highlight">POSITION.</span></h1>
            </div>
          </div>

          <div className="signup-terminal">
            <div className="terminal-header">
              <h2>REGISTER</h2>
              <div className="header-underline"></div>
            </div>

            <form className="terminal-form" onSubmit={handleSubmit}>
              <div className="input-field">
                <label><User size={12} /> USERNAME</label>
                <input type="text" name="username" placeholder="Enter username" required onChange={handleChange} />
                <div className="input-bar"></div>
              </div>

              <div className="input-field">
                <label><Mail size={12} /> EMAIL</label>
                <input type="email" name="email" placeholder="Enter email" required onChange={handleChange} />
                <div className="input-bar"></div>
              </div>

              <div className="input-field">
                <label><Lock size={12} /> PASSWORD</label>
                <input type="password" name="password" placeholder="Create password" minLength={8} required onChange={handleChange} />
                <div className="input-bar"></div>
              </div>

              <div className="input-field">
                <label><FileText size={12} /> BIO (OPTIONAL)</label>
                <textarea name="bio" placeholder="Tell us about yourself..." rows={2} onChange={handleChange}></textarea>
                <div className="input-bar"></div>
              </div>

              <button 
                type="submit" 
                className="deploy-button" 
                disabled={isPending}
              >
                <span>{isPending ? 'ENCRYPTING...' : 'CREATE ACCOUNT'}</span>
                <ChevronRight size={18} />
              </button>
            </form>

            <div className="terminal-footer">
              <span className="footer-label">ALREADY HAVE AN ACCOUNT?</span>
              <Link to="/login" className="login-trigger">LOGIN</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;