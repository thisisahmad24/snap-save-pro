"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { authHeaders, getStoredToken, getStoredUser, saveSession } from "@/lib/session";

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState({ ig: 0, yt: 0 });

  useEffect(() => {
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
      setUsage({
        ig: Number((cachedUser as any).download_count_ig || 0),
        yt: Number((cachedUser as any).download_count_yt || 0),
      });
    }

    const token = getStoredToken();
    if (token) {
      fetch("/api/auth/me", { headers: authHeaders() })
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setUsage({
              ig: Number(data.user.download_count_ig || 0),
              yt: Number(data.user.download_count_yt || 0),
            });
            saveSession(token, data.user);
          }
        })
        .catch(() => null);
    }
  }, []);

  const plans = [
    {
      name: "Starter Access",
      price: "100",
      currency: "PKR",
      features: ["1 Regional Download", "Localized Checkout", "Standard Quality", "Instant Activation"],
      buttonText: "Get Started",
      highlight: false
    },
    {
      name: "Pro Monthly",
      price: "300",
      currency: "PKR",
      features: ["Unlimited Downloads", "Highest Quality (4K/8K)", "No Daily Limits", "Direct Support", "Priority Extraction"],
      buttonText: "Get Pro Now",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["API Access", "Bulk Downloads", "Whitelabel Support", "Dedicated Resources"],
      buttonText: "Contact Sales",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main style={{ flex: 1, padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem' }}>Simple, Transparent <span style={{ color: 'var(--primary)' }}>Pricing</span></h1>
          <p style={{ opacity: 0.6, fontSize: '1.2rem', marginBottom: '2.5rem' }}>Choose the plan that works best for your content needs.</p>

          {user && (
            <div style={{ display: 'inline-flex', gap: '2rem', padding: '1.5rem 3rem', backgroundColor: 'var(--card)', borderRadius: '1.5rem', border: '1px solid var(--border)', marginBottom: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700, marginBottom: '0.5rem' }}>INSTAGRAM</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{usage.ig} / 5 <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 400 }}>used</span></div>
              </div>
              <div style={{ width: '1px', backgroundColor: 'var(--border)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700, marginBottom: '0.5rem' }}>YOUTUBE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{usage.yt} / 3 <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 400 }}>used</span></div>
              </div>
            </div>
          )}
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              padding: '3rem 2rem',
              backgroundColor: 'var(--card)',
              borderRadius: '2rem',
              border: plan.highlight ? '2px solid var(--primary)' : '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: plan.highlight ? '0 0 30px var(--primary-glow)' : 'none',
              transition: 'transform 0.3s'
            }} className="pricing-card">
              {plan.highlight && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--primary)',
                  padding: '0.4rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{plan.name}</h3>
              <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {plan.currency && <span style={{ fontSize: '1rem', opacity: 0.5 }}>{plan.currency}</span>}
                {plan.price}
                {plan.price !== "Custom" && (
                  <span style={{ fontSize: '1rem', opacity: 0.5 }}>
                    {plan.name === "Starter Access" ? "/download" : "/month"}
                  </span>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '3rem', flex: 1 }}>
                {plan.features.map((feature, j) => (
                  <li key={j} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', opacity: 0.8 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link 
                href={plan.name === "Enterprise" ? "/contact" : `/checkout?plan=${plan.name.toLowerCase().includes('pro') ? 'pro' : 'single'}`}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  backgroundColor: plan.highlight ? 'var(--primary)' : 'var(--foreground)',
                  color: plan.highlight ? 'white' : 'var(--background)',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'transform 0.2s'
                }}
                className="plan-button"
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
        <style>{`
          .pricing-card:hover {
            transform: translateY(-10px);
          }
          .plan-button:hover {
            filter: brightness(1.1);
          }
        `}</style>
      </main>

      <Footer />
    </div>
  );
}
