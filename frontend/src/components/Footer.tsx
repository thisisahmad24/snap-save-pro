import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--border)', marginTop: '4rem', backgroundColor: 'var(--background)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>
              SNAP<span style={{ color: 'var(--foreground)' }}>SAVE</span> PRO
            </div>
            <p style={{ opacity: 0.5, fontSize: '0.9rem', lineHeight: 1.6 }}>
              The ultimate social media downloader platform. Save your favorite content from Instagram and YouTube in high quality, instantly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Platform</div>
              <Link href="/" style={{ opacity: 0.5, fontSize: '0.9rem' }}>Downloader</Link>
              <Link href="/#features" style={{ opacity: 0.5, fontSize: '0.9rem' }}>Features</Link>
              <Link href="/pricing" style={{ opacity: 0.5, fontSize: '0.9rem' }}>Pricing</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Company</div>
              <Link href="/about" style={{ opacity: 0.5, fontSize: '0.9rem' }}>About Us</Link>
              <Link href="/contact" style={{ opacity: 0.5, fontSize: '0.9rem' }}>Contact</Link>
              <Link href="/login" style={{ opacity: 0.5, fontSize: '0.9rem' }}>Sign In</Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', opacity: 0.5, fontSize: '0.8rem' }}>
          <div>© 2026 SnapSave Pro. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span>Made with ❤️ for Creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
