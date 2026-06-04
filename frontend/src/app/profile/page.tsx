"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { authHeaders, getStoredToken, saveSession } from "@/lib/session";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    username: "",
    country: "",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/auth/me", {
      headers: authHeaders(),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.push("/login");
          return;
        }

        setUser(data.user);
        setProfile({
          full_name: data.user.full_name || "",
          username: data.user.username || "",
          country: data.user.country || "",
          avatar_url: data.user.avatar_url || "",
          is_pro: data.user.is_pro || false,
        });
        saveSession(token, data.user);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.is_pro) {
      setMessage("Error: Only Pro users can edit their profile details.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          username: profile.username,
          country: profile.country,
          avatar_url: profile.avatar_url,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      setUser(data.user);
      setProfile({
        full_name: data.user.full_name || "",
        username: data.user.username || "",
        country: data.user.country || "",
        avatar_url: data.user.avatar_url || "",
        is_pro: data.user.is_pro || false,
      });
      const token = getStoredToken();
      if (token) {
        saveSession(token, data.user);
      }
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Profile...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'var(--card)',
            border: '2px solid var(--primary)',
            margin: '0 auto 1.5rem auto',
            backgroundImage: `url(${profile.avatar_url || 'https://via.placeholder.com/150'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{profile.full_name || "Your Profile"}</h1>
          <p style={{ opacity: 0.6 }}>@{profile.username || "username"}</p>
          {profile.is_pro ? (
            <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, marginTop: '1rem', display: 'inline-block' }}>PRO MEMBER</span>
          ) : (
            <span style={{ backgroundColor: 'var(--card)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, marginTop: '1rem', display: 'inline-block', border: '1px solid var(--border)' }}>FREE TIER</span>
          )}
        </header>

        <section style={{ backgroundColor: 'var(--card)', padding: '3rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {message && <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: message.includes('Error') ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
              color: message.includes('Error') ? '#ff4b4b' : '#4caf50',
              fontSize: '0.9rem',
              textAlign: 'center',
              border: `1px solid ${message.includes('Error') ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)'}`
            }}>{message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Full Name</label>
                <input 
                  type="text" 
                  value={profile.full_name} 
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  placeholder="e.g. Ahmad Khan"
                  disabled={!profile.is_pro}
                  style={{ padding: '0.8rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', opacity: profile.is_pro ? 1 : 0.5 }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Username</label>
                <input 
                  type="text" 
                  value={profile.username} 
                  onChange={(e) => setProfile({...profile, username: e.target.value})}
                  placeholder="e.g. ahmad_dev"
                  disabled={!profile.is_pro}
                  style={{ padding: '0.8rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', opacity: profile.is_pro ? 1 : 0.5 }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Email (Private)</label>
              <input 
                type="email" 
                value={user?.email || ""} 
                disabled
                style={{ padding: '0.8rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', opacity: 0.5 }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Country</label>
                <input 
                  type="text" 
                  value={profile.country || ""} 
                  onChange={(e) => setProfile({...profile, country: e.target.value})}
                  placeholder="e.g. Pakistan"
                  disabled={!profile.is_pro}
                  style={{ padding: '0.8rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', opacity: profile.is_pro ? 1 : 0.5 }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}>Avatar URL</label>
                <input 
                  type="text" 
                  value={profile.avatar_url || ""} 
                  onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={!profile.is_pro}
                  style={{ padding: '0.8rem', borderRadius: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', outline: 'none', opacity: profile.is_pro ? 1 : 0.5 }} 
                />
              </div>
            </div>

            <button type="submit" disabled={saving || !profile.is_pro} style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              backgroundColor: profile.is_pro ? 'var(--primary)' : 'var(--border)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              cursor: profile.is_pro ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}>
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
            
            {!profile.is_pro && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.5 }}>
                Upgrade to <span style={{ color: 'var(--primary)', fontWeight: 700 }}>PRO</span> to edit your profile.
              </p>
            )}
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
