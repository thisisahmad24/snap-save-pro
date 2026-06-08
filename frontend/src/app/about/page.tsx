import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main style={{ flex: 1, padding: '6rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem' }}>Our <span style={{ color: 'var(--primary)' }}>Story</span></h1>
          <p style={{ opacity: 0.6, fontSize: '1.2rem' }}>Empowering creators and users with the best content saving tools.</p>
        </header>

        <section style={{ lineHeight: 1.8, fontSize: '1.1rem', opacity: 0.8 }}>
          <p style={{ marginBottom: '2rem' }}>
            SnapSave Pro was born out of a simple need: a reliable, high-quality, and fast way to download content from the world's most popular social media platforms. We noticed that most existing tools were either filled with intrusive ads, slow, or compromised on video quality.
          </p>
          <p style={{ marginBottom: '2rem' }}>
            Our mission is to provide a premium "Pro" experience for everyone. Whether you're a content creator looking to archive your own work, or a user saving a memorable reel, we ensure you get the best resolution possible in seconds.
          </p>
          
          <div style={{
            marginTop: '4rem',
            padding: '3rem',
            backgroundColor: 'var(--card)',
            borderRadius: '2rem',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>The Tech Behind SnapSave</h2>
            <p style={{ fontSize: '1rem', opacity: 0.7 }}>
              Built with Next.js, FastAPI, and powered by yt-dlp, our engine is optimized for speed and reliability. We use MongoDB to manage user accounts, quotas, and download history fairly, ensuring a high-quality service for all.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
