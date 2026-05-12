"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters for security.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
            plan: plan
          }
        }
      });

      if (signupError) throw signupError;

      setMessage("Success! Please check your email for a confirmation link.");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <section style={{
          width: '100%',
          maxWidth: '550px',
          backgroundColor: 'var(--card)',
          padding: '3rem',
          borderRadius: '2.5rem',
          border: '1px solid var(--border)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Join <span style={{ color: 'var(--primary)' }}>SnapSave Pro</span></h1>
          <p style={{ opacity: 0.5, marginBottom: '2.5rem', fontSize: '1rem' }}>Create your account to start saving content effortlessly.</p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {error && <div style={{ color: '#ff4b4b', fontSize: '0.9rem', textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(255, 75, 75, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(255, 75, 75, 0.2)' }}>{error}</div>}
            {message && <div style={{ color: '#4caf50', fontSize: '0.9rem', textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(76, 175, 80, 0.2)' }}>{message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Full Name</label>
                <input
                  type="text"
                  placeholder="your name here"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ padding: '1rem 1.25rem', borderRadius: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Username</label>
                <input
                  type="text"
                  placeholder="username@xx"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ padding: '1rem 1.25rem', borderRadius: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Email Address</label>
              <input
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '1rem 1.25rem', borderRadius: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Secure Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '1rem 3.5rem 1rem 1.25rem', borderRadius: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', fontSize: '1rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5, padding: '0.5rem' }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Select Subscription</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
                {[
                  { id: 'free', label: 'Free' },
                  { id: 'pro', label: 'Pro (300/mo)' },
                  { id: 'custom', label: 'Enterprise' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    style={{
                      padding: '0.8rem',
                      borderRadius: '0.75rem',
                      border: plan === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: plan === p.id ? 'rgba(255, 62, 62, 0.1)' : 'transparent',
                      color: plan === p.id ? 'var(--primary)' : 'white',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {plan === 'pro' && (
              <div style={{ padding: '2rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>PAYMENT DETAILS (PKR 300/MONTH)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input type="text" placeholder="Card Number (0000 0000 0000 0000)" style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <input type="text" placeholder="Expiry (MM/YY)" style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                    <input type="password" placeholder="CVC" style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: '1rem',
              padding: '1.2rem',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 10px 20px var(--primary-glow)'
            }}>
              {loading ? "Initializing Account..." : "Start Downloading Now"}
            </button>
          </form>

          <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log In</Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
