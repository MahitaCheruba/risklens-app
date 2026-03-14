"use client";

import { db } from "@/lib/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const { isLoading, user, error } = db.useAuth();
  const router = useRouter();
  const [sentEmail, setSentEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Redirecting...</div>
      </div>
    );
  }

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const email = emailRef.current?.value?.trim();
    if (!email) return;
    setSending(true);
    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "body" in err
          ? String((err as { body?: { message?: string } }).body?.message)
          : "Failed to send code. Please try again.";
      setAuthError(message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const code = codeRef.current?.value?.trim();
    if (!code || !sentEmail) return;
    setVerifying(true);
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "body" in err
          ? String((err as { body?: { message?: string } }).body?.message)
          : "Invalid or expired code. Please try again.";
      setAuthError(message);
      if (codeRef.current) codeRef.current.value = "";
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Sign in to RiskLens</h1>
          <p className="mt-1 text-slate-600">
            We&apos;ll send a 6-digit code to your email.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error.message}
          </div>
        )}
        {authError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {authError}
          </div>
        )}

        {!sentEmail ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-slate-600">
              Code sent to <strong>{sentEmail}</strong>. Enter the 6-digit code
              below.
            </p>
            <div>
              <label htmlFor="code" className="sr-only">
                Verification code
              </label>
              <input
                ref={codeRef}
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                placeholder="123456"
                maxLength={6}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center text-lg tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSentEmail("");
                setAuthError(null);
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
