"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [recentDownloads, setRecentDownloads] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const saved = localStorage.getItem("recent_downloads");
    if (saved) setRecentDownloads(JSON.parse(saved).slice(0, 5));

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Saves the extracted media item to local storage to show in 'Recent Downloads'.
   * @param {Object} item - The extracted media data containing title, thumbnail, and download URL.
   */
  const saveRecent = (item: any) => {
    setRecentDownloads(prev => {
      // Keep only the 5 most recent unique items
      const newRecent = [item, ...prev.filter(r => r.download_url !== item.download_url)].slice(0, 5);
      localStorage.setItem("recent_downloads", JSON.stringify(newRecent));
      return newRecent;
    });
  };

  /**
   * Handles the form submission to extract media from the provided URL.
   * Sends the URL to the backend API and handles quota limits and errors.
   */
  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResult(null);
    setError("");
    setLimitReached(false);

    try {
      // 1. Try Direct Public Extraction First (Bypasses all server issues)
      const publicApi = "https://api.cobalt.tools/api/json";
      try {
        const cobaltResponse = await fetch(publicApi, {
          method: "POST",
          headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url })
        });
        if (cobaltResponse.ok) {
          const cobaltData = await cobaltResponse.json();
          if (cobaltData.url) {
            const resultData = {
              success: true,
              title: "Downloaded Media",
              thumbnail: "",
              download_url: cobaltData.url,
              platform: url.includes("instagram") ? "instagram" : "youtube",
              ext: "mp4"
            };
            setResult(resultData);
            saveRecent(resultData);
            return;
          }
        }
      } catch (e) {
        console.log("Direct extraction failed, falling back to server...", e);
      }

      // 2. Fallback to your Render Server via Proxy
      const response = await fetch('/api/proxy/v1/media-query', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, userId: user?.id || null }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data);
        saveRecent(data);
      } else {
        setError(data.error || "Could not fetch media.");
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError("Extraction failed. Please try a different link or check your connection.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copies the download URL to the user's clipboard.
   * @param {string} text - The URL to copy.
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("URL copied to clipboard! 🚀");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '6rem' }} className="animate-fade-in">
          <h1 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            {user ? (
              <>Welcome Back, <span style={{ color: 'var(--primary)' }}>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span></>
            ) : (
              <>Save Content Like a <span style={{ color: 'var(--primary)' }}>PRO</span></>
            )}
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.6, maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            Download high-quality reels, photos, and videos from Instagram and YouTube in seconds. No ads, no hassle.
          </p>

          <form onSubmit={handleExtract} style={{
            maxWidth: '700px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'var(--card)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <input
              type="text"
              placeholder="Paste Instagram or YouTube link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '1rem 1.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="glow-effect"
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? "Extracting..." : "Download Now"}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ color: '#ff4b4b', padding: '1rem 2rem', backgroundColor: 'rgba(255, 75, 75, 0.1)', borderRadius: '1rem', border: '1px solid rgba(255, 75, 75, 0.2)', fontWeight: 600 }}>
                {error}
              </div>
              
              {limitReached && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Link href="/checkout?plan=single" style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9rem'
                  }}>
                    Pay PKR 10 for this download
                  </Link>
                  <Link href="/pricing" style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    boxShadow: '0 5px 15px var(--primary-glow)'
                  }}>
                    Upgrade to PRO (Unlimited)
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Result Preview */}
        {result && (
          <section className="animate-fade-in" style={{
            maxWidth: '800px',
            margin: '0 auto 4rem auto',
            backgroundColor: 'var(--card)',
            borderRadius: '2rem',
            border: '2px solid var(--primary)',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', padding: '2.5rem', gap: '2.5rem', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '280px', 
                height: '280px', 
                position: 'relative', 
                borderRadius: '1.5rem', 
                overflow: 'hidden', 
                backgroundColor: '#000',
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
              }}>
                {result.thumbnail && (
                  <img src={result.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                  <span style={{ 
                    padding: '0.4rem 0.8rem', 
                    backgroundColor: 'var(--primary)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>{result.platform}</span>
                  <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>High Quality Extraction</span>
                </div>
                <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', lineHeight: 1.3 }}>{result.title}</h3>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <a
                    href={result.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '1.2rem',
                      backgroundColor: 'var(--foreground)',
                      color: 'var(--background)',
                      borderRadius: '1rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: 'transform 0.2s'
                    }}
                    className="glow-effect"
                  >
                    Download Now
                  </a>
                  <button
                    onClick={() => copyToClipboard(result.download_url)}
                    style={{
                      padding: '1.2rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '1rem',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Downloads */}
        {recentDownloads.length > 0 && (
          <section style={{ marginTop: '4rem', marginBottom: '8rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>Recent <span style={{ color: 'var(--primary)' }}>Downloads</span></h3>
            <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
              {recentDownloads.map((item, i) => (
                <div key={i} style={{
                  minWidth: '200px',
                  backgroundColor: 'var(--card)',
                  borderRadius: '1.5rem',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <div style={{ width: '100%', height: '120px', backgroundColor: '#000' }}>
                    <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem' }}>{item.title}</p>
                    <a href={item.download_url} target="_blank" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Download Again →</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features Section */}
        <section id="features" style={{ marginTop: '8rem', padding: '4rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Premium Features</h2>
            <p style={{ opacity: 0.6 }}>Why thousands of creators trust SnapSave Pro.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { title: "Ultra High Quality", desc: "Download in 4K, 1080p, and high-bitrate audio formats automatically." },
              { title: "Lightning Fast", desc: "Our global server network ensures your downloads start in under a second." },
              { title: "Zero Ads", desc: "Enjoy a clean, professional experience without intrusive popups or banners." },
              { title: "All Devices", desc: "Works perfectly on iPhone, Android, Windows, and macOS browsers." },
              { title: "Batch Support", desc: "Coming soon: Download entire playlists or profiles with one click." },
              { title: "Secure API", desc: "Enterprise-grade security protecting your data and requests." }
            ].map((f, i) => (
              <div key={i} style={{
                padding: '2.5rem',
                backgroundColor: 'var(--card)',
                borderRadius: '1.5rem',
                border: '1px solid var(--border)',
                transition: 'transform 0.3s, border-color 0.3s',
                cursor: 'default'
              }} className="feature-card">
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'var(--primary-glow)', 
                  borderRadius: '10px', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: 'bold'
                }}>{i + 1}</div>
                <h4 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--foreground)' }}>{f.title}</h4>
                <p style={{ opacity: 0.6, fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ marginTop: '8rem', padding: '4rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { q: "Is it free to use?", a: "Yes! You get 5 free Instagram and 3 free YouTube downloads every day. For more, you can pay a small fee of PKR 10 per download." },
              { q: "Do I need to install any software?", a: "No, SnapSave Pro is a 100% web-based tool. You only need a modern browser." },
              { q: "Which platforms are supported?", a: "Currently we support Instagram (Reels, Photos, IGTV) and YouTube (Shorts, Videos). More platforms are coming soon!" }
            ].map((faq, i) => (
              <div key={i} style={{
                padding: '2rem',
                backgroundColor: 'var(--card)',
                borderRadius: '1rem',
                border: '1px solid var(--border)'
              }}>
                <h5 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>{faq.q}</h5>
                <p style={{ opacity: 0.7, fontSize: '0.95rem' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .feature-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary) !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
