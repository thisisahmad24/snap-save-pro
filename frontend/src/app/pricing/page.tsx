"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getExchangeRates,
  detectUserCurrency,
  convertFromINR,
  formatCurrency,
  isBaseCurrency,
} from "@/lib/currency";
// TODO: Replace with MongoDB custom auth API call
// import { getAuthUser, fetchUserUsage } from "@/lib/auth";

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState({ ig: 0 });
  const [userCurrency, setUserCurrency] = useState("INR");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    // TODO: Replace with JWT token check & usage fetch from MongoDB
    const storedUser = localStorage.getItem("snap_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
    }

    // Detect visitor's local currency and fetch live exchange rates in parallel
    Promise.all([detectUserCurrency(), getExchangeRates()]).then(
      ([currency, fetchedRates]) => {
        setUserCurrency(currency);
        setRates(fetchedRates);
        setRatesLoaded(true);
      }
    );
  }, []);

  /**
   * Returns the display price for a given PKR amount.
   * If the user is in Pakistan, returns the raw PKR string.
   * Otherwise returns the converted local-currency string plus a PKR note.
   */
  const displayPrice = (
    amountPKR: number
  ): { main: string; note: string } => {
    if (!ratesLoaded || isBaseCurrency(userCurrency)) {
      return { main: `Rs ${amountPKR}`, note: "" };
    }
    const converted = convertFromINR(amountPKR, userCurrency, rates);
    return {
      main: formatCurrency(converted, userCurrency),
      note: `≈ Rs ${amountPKR} PKR`,
    };
  };

  const singleDisplay = displayPrice(1);
  const proDisplay = displayPrice(100);

  const plans = [
    {
      id: "free",
      name: "Free Tier",
      priceMain: "Free",
      priceNote: "",
      period: "/day",
      features: [
        "3 Free Downloads / day",
        "Standard Quality",
        "No Registration Required",
      ],
      buttonText: "Get Started",
      href: "/",
      highlight: false,
    },
    {
      id: "single",
      name: "Pay Per Video",
      priceMain: singleDisplay.main,
      priceNote: singleDisplay.note,
      period: "/video",
      features: [
        "1 High-Speed Download",
        "Full Quality (4K/1080p)",
        "Instant Access",
        "No Subscription Needed",
      ],
      buttonText: "Buy a Single Download",
      href: "/checkout?plan=single",
      highlight: false,
    },
    {
      id: "pro",
      name: "Pro Monthly",
      priceMain: proDisplay.main,
      priceNote: proDisplay.note,
      period: "/month",
      features: [
        "Unlimited Downloads",
        "Highest Quality (4K / 8K)",
        "No Daily Limits",
        "Direct Support",
        "Priority Extraction",
      ],
      buttonText: "Get Pro Now",
      href: "/checkout?plan=pro",
      highlight: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceMain: "Custom",
      priceNote: "",
      period: "",
      features: [
        "API Access",
        "Bulk Downloads",
        "Whitelabel Support",
        "Dedicated Resources",
      ],
      buttonText: "Contact Sales",
      href: "/contact",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main
        style={{
          flex: 1,
          padding: "6rem 2rem",
          maxWidth: "1300px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "5rem" }}>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              marginBottom: "1rem",
            }}
          >
            Simple, Transparent{" "}
            <span style={{ color: "var(--primary)" }}>Pricing</span>
          </h1>
          <p
            style={{
              opacity: 0.6,
              fontSize: "1.2rem",
              marginBottom: "1.5rem",
            }}
          >
            Choose the plan that works best for your content needs.
          </p>

          {/* Currency conversion notice for international visitors */}
          {ratesLoaded && !isBaseCurrency(userCurrency) && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.5rem 1.25rem",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                borderRadius: "2rem",
                fontSize: "0.85rem",
                opacity: 0.7,
                marginBottom: "2rem",
              }}
            >
              <span>💱</span>
              <span>
                Prices shown in <strong>{userCurrency}</strong> · Base currency
                is PKR
              </span>
            </div>
          )}

          {/* Usage tracker for logged-in users */}
          {user && (
            <div
              style={{
                display: "inline-flex",
                gap: "2rem",
                padding: "1.5rem 3rem",
                backgroundColor: "var(--card)",
                borderRadius: "1.5rem",
                border: "1px solid var(--border)",
                marginBottom: "3rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.5,
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  INSTAGRAM
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {usage.ig} / 3{" "}
                  <span
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.5,
                      fontWeight: 400,
                    }}
                  >
                    used today
                  </span>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Pricing cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "2rem",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              id={`plan-${plan.id}`}
              style={{
                padding: "3rem 2rem",
                backgroundColor: "var(--card)",
                borderRadius: "2rem",
                border: plan.highlight
                  ? "2px solid var(--primary)"
                  : "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: plan.highlight
                  ? "0 0 30px var(--primary-glow)"
                  : "none",
                transition: "transform 0.3s",
              }}
              className="pricing-card"
            >
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: "-15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "var(--primary)",
                    padding: "0.4rem 1rem",
                    borderRadius: "1rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                {plan.name}
              </h3>

              {/* Price display */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.4rem",
                  marginBottom: "0.4rem",
                }}
              >
                <span
                  style={{
                    fontSize:
                      plan.priceMain === "Free" || plan.priceMain === "Custom"
                        ? "2.5rem"
                        : "3rem",
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {plan.priceMain}
                </span>
                {plan.period && (
                  <span style={{ fontSize: "1rem", opacity: 0.5 }}>
                    {plan.period}
                  </span>
                )}
              </div>

              {/* INR equivalent note for international users */}
              <div style={{ minHeight: "1.4rem", marginBottom: "1.5rem" }}>
                {plan.priceNote && (
                  <span style={{ fontSize: "0.78rem", opacity: 0.45 }}>
                    {plan.priceNote}
                  </span>
                )}
              </div>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "3rem",
                  flex: 1,
                }}
              >
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      opacity: 0.8,
                    }}
                  >
                    <span style={{ color: "var(--primary)", fontWeight: 800 }}>
                      ✓
                    </span>{" "}
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                id={`plan-${plan.id}-cta`}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  backgroundColor: plan.highlight
                    ? "var(--primary)"
                    : "var(--foreground)",
                  color: plan.highlight ? "white" : "var(--background)",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "none",
                  transition: "transform 0.2s",
                }}
                className="plan-button"
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>

        <style>{`
          .pricing-card:hover { transform: translateY(-10px); }
          .plan-button:hover  { filter: brightness(1.1); }
        `}</style>
      </main>

      <Footer />
    </div>
  );
}
