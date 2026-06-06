"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { authHeaders, getStoredToken, saveSession } from "@/lib/session";

type Quote = {
  plan: string;
  title: string;
  country: string;
  region: string;
  currency: string;
  amount_major: number;
  amount_minor: number;
  display_price: string;
};

const countryOptions = [
  { code: "PK", label: "Pakistan" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "EU", label: "Europe (EU)" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "IN", label: "India" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "SG", label: "Singapore" },
];

const regionOptions = [
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "north_america", label: "North America" },
  { value: "south_america", label: "South America" },
  { value: "africa", label: "Africa" },
  { value: "middle_east", label: "Middle East" },
  { value: "oceania", label: "Oceania" },
  { value: "global", label: "Global" },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const effectivePlan = plan === "free" ? "single" : plan;
  const [loading, setLoading] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("PK");
  const [region, setRegion] = useState("asia");
  const [quote, setQuote] = useState<Quote | null>(null);
  const router = useRouter();

  const planCopy = useMemo(() => {
    const labels: Record<string, { title: string; description: string }> = {
      single: {
        title: "Single Download Access",
        description: "One-time purchase for a single regional download.",
      },
      pro: {
        title: "Pro Monthly Subscription",
        description: "Unlimited downloads, priority extraction, and faster support.",
      },
      custom: {
        title: "Enterprise",
        description: "Tailored pricing for teams and high-volume usage.",
      },
    };
    return labels[effectivePlan] || labels.pro;
  }, [effectivePlan]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login?redirect=/checkout?plan=" + plan);
      return;
    }

    fetch("/api/auth/me", { headers: authHeaders() })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.push("/login?redirect=/checkout?plan=" + plan);
          return;
        }
        setUser(data.user);
        saveSession(token, data.user);
        if (data.user.country) {
          setCountry(String(data.user.country).toUpperCase().slice(0, 2));
        }
      })
      .catch(() => router.push("/login"));
  }, [effectivePlan, router, plan]);

  useEffect(() => {
    if (effectivePlan === "custom") {
      setQuote(null);
      return;
    }

    const controller = new AbortController();
    setLoadingQuote(true);
    setError("");

    fetch("/api/payments/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: effectivePlan, country, region }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || "Could not load regional pricing.");
        }
        setQuote(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load regional pricing.");
        }
      })
      .finally(() => setLoadingQuote(false));

    return () => controller.abort();
  }, [country, effectivePlan, region]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectivePlan === "custom") {
      router.push("/contact");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          plan: effectivePlan,
          country,
          region,
          redirect_base_url: window.location.origin,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not start payment.");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe checkout URL was not returned.");
    } catch (err: any) {
      setError(err.message || "Could not start payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ flex: 1, padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "4rem" }}>
        <section>
          <h1 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.2 }}>
            Secure <span style={{ color: "var(--primary)" }}>Stripe</span> Checkout
          </h1>
          <p style={{ opacity: 0.65, fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Choose your country and region to see localized pricing before you pay.
          </p>

          <div style={{ backgroundColor: "var(--card)", padding: "2.5rem", borderRadius: "2rem", border: "1px solid var(--border)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginBottom: "1.5rem", opacity: 0.7, fontSize: "0.85rem", fontWeight: 800, letterSpacing: "1.5px" }}>ORDER SUMMARY</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.2rem", fontWeight: 700, fontSize: "1.1rem", gap: "1rem" }}>
              <span>{planCopy.title}</span>
            <span>{loadingQuote ? "Loading..." : quote?.display_price || "—"}</span>
            </div>
            <p style={{ opacity: 0.65, lineHeight: 1.6, marginBottom: "1rem" }}>{planCopy.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem", opacity: 0.5, fontSize: "0.95rem" }}>
              <span>Platform Service Fee</span>
              <span>Included</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: 900, color: "var(--primary)" }}>
              <span>Total Amount</span>
              <span>{loadingQuote ? "Loading..." : quote?.display_price || "—"}</span>
            </div>
          </div>

          <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "1.5rem", textAlign: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔒</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Secure Stripe Checkout</div>
            </div>
            <div style={{ border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "1.5rem", textAlign: "center", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚡</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Localized Pricing</div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--card)", padding: "3rem", borderRadius: "2.5rem", border: "1px solid var(--border)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
          {effectivePlan === "custom" ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <h2 style={{ fontSize: "2rem", marginBottom: "1rem", fontWeight: 900 }}>Enterprise Pricing</h2>
              <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: "2rem" }}>
                Contact us and we’ll tailor a regional payment setup for your team.
              </p>
              <Link href="/contact" style={{ display: "inline-block", padding: "1rem 1.5rem", borderRadius: "1rem", backgroundColor: "var(--primary)", color: "white", fontWeight: 800, textDecoration: "none" }}>
                Contact Sales
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem" }}>Pay with Stripe</h3>
              <p style={{ opacity: 0.65, lineHeight: 1.6 }}>
                Select your country and region. The checkout amount updates automatically in the local currency we’ve configured for that market.
              </p>

              {error && (
                <div style={{ color: "#ff4b4b", fontSize: "0.9rem", textAlign: "center", padding: "0.8rem", backgroundColor: "rgba(255, 75, 75, 0.1)", borderRadius: "0.75rem", border: "1px solid rgba(255, 75, 75, 0.2)" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, opacity: 0.8 }}>Country</span>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ padding: "1rem 1.25rem", borderRadius: "1rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "white", fontSize: "1rem", outline: "none" }}
                  >
                    {countryOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, opacity: 0.8 }}>Region</span>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    style={{ padding: "1rem 1.25rem", borderRadius: "1rem", backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "white", fontSize: "1rem", outline: "none" }}
                  >
                    {regionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ padding: "1.25rem", borderRadius: "1rem", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)", marginBottom: "0.5rem" }}>Localized Quote</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ opacity: 0.7 }}>Currency</span>
                  <span style={{ fontWeight: 800 }}>{quote?.currency || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  <span style={{ opacity: 0.7 }}>Amount</span>
                  <span style={{ fontWeight: 800 }}>{quote?.display_price || (loadingQuote ? "Loading..." : "—")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || loadingQuote}
                style={{
                  marginTop: "1rem",
                  padding: "1.25rem",
                  borderRadius: "var(--radius)",
                  backgroundColor: "var(--primary)",
                  color: "white",
                  border: "none",
                  fontWeight: 900,
                  cursor: loading || loadingQuote ? "not-allowed" : "pointer",
                  opacity: loading || loadingQuote ? 0.75 : 1,
                  boxShadow: "0 15px 30px var(--primary-glow)",
                  fontSize: "1.05rem",
                  transition: "transform 0.2s",
                }}
              >
                {loading ? "Opening Stripe Checkout..." : `Pay ${quote?.display_price || "—"} with Stripe`}
              </button>
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
      <Suspense fallback={<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Initializing secure checkout...</div>}>
        <CheckoutContent />
      </Suspense>
      <Footer />
    </div>
  );
}
