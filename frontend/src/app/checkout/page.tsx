"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// TODO: Replace with MongoDB custom auth API call
// import { getAuthUser, upgradeToPro } from "@/lib/auth";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [transactionId, setTransactionId] = useState("");
  const router = useRouter();

  const prices: any = {
    pro: { name: "Pro Monthly Subscription", price: "300", currency: "PKR" },
    single: { name: "Single High-Speed Download", price: "10", currency: "PKR" },
    custom: { name: "Custom Enterprise Plan", price: "Contact us", currency: "" }
  };

  const currentPlan = prices[plan] || prices.pro;

  useEffect(() => {
    // TODO: Replace with JWT token validation
    // const token = localStorage.getItem("snap_token");
    // if (!token) { router.push("/login?redirect=/checkout?plan=" + plan); return; }
    // fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
    //   .then(res => res.json())
    //   .then(data => setUser(data.user));

    const storedUser = localStorage.getItem("snap_user");
    if (!storedUser) {
      router.push("/login?redirect=/checkout?plan=" + plan);
    } else {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        router.push("/login");
      }
    }
  }, [router, plan]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");

    // Simulate payment delay
    setTimeout(async () => {
      try {
        // TODO: Replace with POST to /api/auth/upgrade (MongoDB)
        // const token = localStorage.getItem("snap_token");
        // const res = await fetch("/api/auth/upgrade", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        //   body: JSON.stringify({ transaction_id: transactionId, plan }),
        // });
        // if (!res.ok) throw new Error("Payment verification failed");

        // For now, update localStorage
        if (user) {
          const updatedUser = { ...user, is_pro: true };
          localStorage.setItem("snap_user", JSON.stringify(updatedUser));
        }

        setStatus("success");
        setTimeout(() => router.push("/"), 3000);
      } catch (err) {
        setStatus("error");
      }
    }, 2000);
  };

  return (
    <main style={{ flex: 1, padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
        
        {/* Left Side: Order Summary */}
        <section>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', lineHeight: 1.2 }}>Complete Your <span style={{ color: 'var(--primary)' }}>Upgrade</span></h1>
          <div style={{ backgroundColor: 'var(--card)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1.5px' }}>ORDER SUMMARY</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>{currentPlan.name}</span>
              <span>{currentPlan.currency} {currentPlan.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', opacity: 0.5, fontSize: '0.95rem' }}>
              <span>Platform Service Fee</span>
              <span>PKR 0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
              <span>Total Amount</span>
              <span>{currentPlan.currency} {currentPlan.price}</span>
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Secure SSL</div>
            </div>
            <div style={{ border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Instant Activation</div>
            </div>
          </div>
        </section>

        {/* Right Side: Payment Form */}
        <section style={{ backgroundColor: 'var(--card)', padding: '3rem', borderRadius: '2.5rem', border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          {status === "success" ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>✅</div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 900 }}>Payment Submitted!</h2>
              <p style={{ opacity: 0.6, fontSize: '1.1rem', lineHeight: 1.6 }}>Your transaction ID has been received. Your account has been upgraded to PRO. You now have unlimited downloads.</p>
              <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.4 }}>Redirecting to home page...</p>
            </div>
          ) : (
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Pay via SadaPay</h3>
              
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'rgba(255, 107, 107, 0.1)', 
                border: '1px solid var(--primary)', 
                borderRadius: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 1: Transfer Funds</div>
                <p style={{ fontSize: '1rem', lineHeight: 1.5 }}>
                  Please send exactly <strong>{currentPlan.currency} {currentPlan.price}</strong> to the following SadaPay account:
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: 'var(--background)', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '2px' }}>03114512268</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>SadaPay</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 2: Verify Payment</div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }}>Enter your 11-digit SadaPay Transaction ID</label>
                <input 
                  type="text" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 12345678901" 
                  required 
                  style={{ padding: '1rem 1.25rem', borderRadius: '1rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'white', fontSize: '1rem', outline: 'none' }} 
                />
              </div>

              <button type="submit" disabled={status === "processing" || !transactionId} style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 900,
                cursor: (status === "processing" || !transactionId) ? 'not-allowed' : 'pointer',
                opacity: (status === "processing" || !transactionId) ? 0.7 : 1,
                boxShadow: '0 15px 30px var(--primary-glow)',
                fontSize: '1.1rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => { if(status !== "processing" && transactionId) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {status === "processing" ? "Verifying Transaction..." : `Confirm Payment of ${currentPlan.currency} ${currentPlan.price}`}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.4, lineHeight: 1.5 }}>
                Your transaction will be processed securely. If you face any issues, please contact support via WhatsApp.
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default function Checkout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Initializing Secure Checkout...</div>}>
        <CheckoutContent />
      </Suspense>
      <Footer />
    </div>
  );
}
