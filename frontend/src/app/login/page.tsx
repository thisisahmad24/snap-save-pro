"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// TODO: Replace with MongoDB custom auth API call
// import { loginUser } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // TODO: Replace with POST to /api/auth/login (MongoDB custom auth)
      // const res = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message || "Login failed");
      // localStorage.setItem("snap_token", data.token);
      // localStorage.setItem("snap_user", JSON.stringify(data.user));
      // router.push("/");

      setError("Login coming soon. MongoDB auth is being set up.");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
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
          maxWidth: '480px',
          backgroundColor: 'var(--card)',
          padding: '3rem',
          borderRadius: '2rem',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Welcome <span style={{ color: 'var(--primary)' }}>Back</span></h1>
          <p style={{ opacity: 0.5, marginBottom: '2.5rem', fontSize: '1rem' }}>Enter your credentials to access your Pro dashboard.</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {error && <div style={{ color: '#ff4b4b', fontSize: '0.9rem', textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(255, 75, 75, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(255, 75, 75, 0.2)' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Secure Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Minimum 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  style={{
                    width: '100%',
                    padding: '1rem 3.5rem 1rem 1.25rem',
                    borderRadius: '1rem',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }} 
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    opacity: 0.5,
                    padding: '0.5rem'
                  }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
            Don't have an account? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
