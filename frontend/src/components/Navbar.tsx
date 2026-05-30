"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// TODO: Replace with JWT-based auth check once MongoDB auth is implemented
// import { getAuthUser, logout } from "@/lib/auth";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // TODO: Replace with real auth token check (JWT from localStorage or cookie)
    // Example: const user = getAuthUser(); setUser(user);
    const storedUser = localStorage.getItem("snap_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    // TODO: Replace with JWT logout (clear token from localStorage/cookie)
    localStorage.removeItem("snap_user");
    localStorage.removeItem("snap_token");
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav style={{
      padding: '1.2rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(15px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(9, 9, 11, 0.85)'
    }}>
      <Link href="/" style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: 'var(--primary)', 
        letterSpacing: '-1px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>S</div>
        SNAP<span style={{ color: 'var(--foreground)' }}>SAVE</span> PRO
      </Link>

      <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.95rem', fontWeight: 500 }} className="desktop-menu">
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            href={link.href} 
            style={{ 
              opacity: isActive(link.href) ? 1 : 0.6,
              color: isActive(link.href) ? 'var(--primary)' : 'var(--foreground)',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            className="nav-link"
          >
            {link.name}
            {isActive(link.href) && (
              <span style={{
                position: 'absolute',
                bottom: '-4px',
                left: 0,
                width: '100%',
                height: '2px',
                backgroundColor: 'var(--primary)',
                borderRadius: '2px'
              }} />
            )}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/profile" style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: 'var(--primary)',
              textDecoration: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(255, 62, 62, 0.1)'
            }}>
              @{user.username || user.full_name || user.email?.split('@')[0]}
            </Link>
            <button onClick={handleLogout} style={{
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" style={{
            padding: '0.7rem 1.5rem',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--primary)',
            color: 'white',
            fontWeight: 700,
            transition: 'transform 0.2s, box-shadow 0.2s',
            fontSize: '0.9rem'
          }} className="glow-on-hover">
            Sign In
          </Link>
        )}
      </div>

      <style jsx>{`
        .nav-link:hover {
          opacity: 1 !important;
          color: var(--primary) !important;
        }
        .glow-on-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px var(--primary-glow);
        }
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
