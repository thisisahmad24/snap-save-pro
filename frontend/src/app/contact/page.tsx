"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main style={{ flex: 1, padding: '6rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem' }}>Get in <span style={{ color: 'var(--primary)' }}>Touch</span></h1>
          <p style={{ opacity: 0.6, fontSize: '1.2rem' }}>Have questions or found a bug? We're here to help.</p>
        </header>

        <section style={{
          backgroundColor: 'var(--card)',
          padding: '3rem',
          borderRadius: '2rem',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <form action="https://formspree.io/f/mrejqnde" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Full Name</label>
                <input type="text" name="name" placeholder="e.g. Ahmad Khan" required style={{
                  padding: '1rem',
                  borderRadius: '1rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Email Address</label>
                <input type="email" name="email" placeholder="ahmad@enterprise.com" required style={{
                  padding: '1rem',
                  borderRadius: '1rem',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Inquiry Type</label>
              <select name="subject" required style={{
                padding: '1rem',
                borderRadius: '1rem',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'white',
                outline: 'none',
                fontSize: '1rem',
                appearance: 'none'
              }}>
                <option value="" disabled selected>Select an option...</option>
                <option>General Support</option>
                <option>Billing & Payments</option>
                <option>Technical Issue</option>
                <option>Enterprise Quote</option>
                <option>Partnership</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Your Message</label>
              <textarea name="message" rows={6} placeholder="Please describe your request in detail so our team can provide the best assistance..." required style={{
                padding: '1rem',
                borderRadius: '1rem',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'white',
                outline: 'none',
                resize: 'none',
                fontSize: '1rem',
                lineHeight: 1.6
              }}></textarea>
            </div>
            <button type="submit" style={{
              marginTop: '1rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 800,
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 10px 20px var(--primary-glow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Submit Ticket
            </button>
          </form>
        </section>

        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '4rem', opacity: 0.5, fontSize: '0.9rem' }}>
          <div><a href="mailto:thisisahmad07@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>thisisahmad07@gmail.com</a></div>
          <div>Lahore, Pakistan</div>
          <div><a href="https://wa.me/923114512268" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>WhatsApp: +92 311 4512268</a></div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
