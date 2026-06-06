"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { authHeaders, getStoredToken, saveSession } from "@/lib/session";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const plan = searchParams.get("plan") || "single";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const token = getStoredToken();
    if (!sessionId || !token) {
      setStatus("error");
      setMessage("Missing payment session or login token.");
      return;
    }

    fetch("/api/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || "Payment confirmation failed");
        }

        if (data.user) {
          saveSession(token, data.user);
        }

        setStatus("success");
        setMessage(
          plan === "pro"
            ? "Your Pro subscription is now active."
            : "Your purchase was completed successfully."
        );
        setTimeout(() => router.push("/"), 2500);
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(error.message || "Payment confirmation failed.");
      });
  }, [plan, router, sessionId]);

  return (
    <main style={{ flex: 1, padding: "6rem 2rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      <section style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "2rem", padding: "3rem", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{status === "success" ? "✅" : status === "error" ? "⚠️" : "⏳"}</div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "1rem" }}>
          {status === "success" ? "Payment Successful" : status === "error" ? "Payment Check Failed" : "Confirming Payment"}
        </h1>
        <p style={{ opacity: 0.75, fontSize: "1.05rem", lineHeight: 1.7 }}>{message}</p>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading payment result...</div>}>
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}
