
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="login-container">
      <div className="login-card">
        <p className="login-subtitle">WELCOME BACK, ADVENTURER</p>

        <h1 className="login-title">Log In</h1>

        <p className="login-description">
          Your next quest awaits.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entering...' : 'Begin Your Quest'}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <p className="login-signup">
          New to QuestMaster?{' '}
          <Link to="/signup">Create an Account</Link>
        </p>
      </div>
    </section>
  );
}
