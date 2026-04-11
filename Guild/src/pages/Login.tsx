import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Mail, Lock, ChevronRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import './Login.css';

interface BackendError {
  message: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // TACTICAL AUTH MUTATION
  const { mutate, isPending } = useMutation({
    mutationFn: async (loginData: typeof formData) => {
      const response = await axios.post('http://localhost:5000/auth/login', loginData);
      return response.data;
    },
    onSuccess: (data) => {

      setAuth(data.user, data.token);

      toast.success(data.message || "ACCESS_GRANTED");

      navigate({ to: '/' });
    },
    onError: (error: AxiosError<BackendError>) => {
      const errorMessage = error.response?.data?.message || "AUTHENTICATION_FAILED";
      toast.error(`${errorMessage}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <div className="login-fortress">
      <div className="tactical-grid"></div>
      <div className="login-content-wrapper">
        <div className="login-container">
          <div className="login-visual">
            <div className="visual-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=2070&auto=format&fit=crop"
                alt="RGB Gaming Keyboard"
              />
            </div>
            <div className="visual-overlay"></div>
            <div className="visual-content">
              <h1 className="visual-title">READY TO <br /><span className="highlight">ENGAGE?</span></h1>
            </div>
          </div>

          <div className="login-terminal">
            <div className="terminal-header">
              <h2>LOGIN</h2>
              <div className="header-underline"></div>
            </div>

            <form className="terminal-form" onSubmit={handleSubmit}>
              <div className="input-field">
                <label><Mail size={12} /> EMAIL</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  onChange={handleChange}
                />
                <div className="input-bar"></div>
              </div>

              <div className="input-field">
                <label><Lock size={12} /> PASSWORD</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  onChange={handleChange}
                />
                <div className="input-bar"></div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={isPending}
              >
                <span>{isPending ? 'VERIFYING...' : 'LOGIN'}</span>
                <ChevronRight size={18} />
              </button>
            </form>

            <div className="terminal-footer">
              <span className="footer-label">DON'T HAVE AN ACCOUNT?</span>
              <Link to="/signup" className="register-link">REGISTER</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;