"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/apiFetch";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setStatus({ loading: false, success: false, error: "Please fill out all fields." });
      return;
    }

    setStatus({ loading: true, success: false, error: null });

    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ loading: false, success: true, error: null });
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus({ loading: false, success: false, error: data.message || "Failed to submit inquiry." });
      }
    } catch (err) {
      setStatus({ loading: false, success: false, error: "A network error occurred. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-black/95 text-white pt-32 pb-24 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background glow */}
      <div className="-translate-x-1/2 blur-[120px] pointer-events-none -z-10 bg-green-900/15 w-[800px] h-[300px] rounded-full absolute top-10 left-1/2"></div>
      
      <div className="w-full max-w-2xl px-6 relative z-10">
        
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex gap-2 text-xs font-semibold text-green-300 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 backdrop-blur-sm items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Inquiry Desk
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white font-geist">
            Get in <span className="text-green-400">Touch</span>
          </h1>
          <div className="w-16 h-0.5 bg-green-500 mx-auto mt-4"></div>
          <p className="mt-4 text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Have questions about our automated trading platform or White Label solutions? Submit an inquiry and our team will respond shortly.
          </p>
        </div>

        {/* Contact Form Container */}
        <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_-10px_rgba(34,197,94,0.05)] backdrop-blur-md">
          {status.success ? (
            <div className="text-center py-10 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Inquiry Submitted!</h3>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                Thank you for reaching out. A representative has received your request and will contact you via email soon.
              </p>
              <button
                onClick={() => setStatus({ loading: false, success: false, error: null })}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:border-green-500/30 bg-white/5 hover:bg-green-500/10 text-white hover:text-green-300 font-semibold px-6 py-2.5 transition-all text-xs active:scale-95"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    disabled={status.loading}
                    className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all w-full font-geist text-sm placeholder:text-neutral-700"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    disabled={status.loading}
                    className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all w-full font-geist text-sm placeholder:text-neutral-700"
                    required
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="White Label Customization / General Query"
                  disabled={status.loading}
                  className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all w-full font-geist text-sm placeholder:text-neutral-700"
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Message Details
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe your requirements or questions here..."
                  disabled={status.loading}
                  className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all w-full font-geist text-sm placeholder:text-neutral-700 resize-none leading-relaxed"
                  required
                ></textarea>
              </div>

              {/* Error Alert */}
              {status.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{status.error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status.loading}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl py-3.5 transition-all w-full flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                {status.loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting inquiry...
                  </>
                ) : (
                  <>
                    Send Inquiry
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
