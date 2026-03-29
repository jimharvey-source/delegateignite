import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fdiitxhgfytvlbtokbok.supabase.co",
  "sb_publishable_JQMFDaTz5g-2ZlitosUTeA_C9B48-Lc"
);

const COLORS = {
  navy: "#0F2A4A",
  navyMid: "#1A3D6B",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  teal: "#0D9488",
  tealLight: "#F0FDFA",
  slate: "#64748B",
  slateLight: "#F8FAFC",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  white: "#FFFFFF",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  red: "#DC2626",
  green: "#16A34A",
  greenLight: "#F0FDF4",
};

const LEVEL_DESCRIPTIONS = [
  { level: 1, label: "Follow precisely", desc: "Do exactly what I say" },
  { level: 2, label: "Report back", desc: "Look into this, I'll decide" },
  { level: 3, label: "Decide together", desc: "We'll assess the situation jointly" },
  { level: 4, label: "Tell me what help you need", desc: "Assess and we'll decide together" },
  { level: 5, label: "Recommend a course of action", desc: "Give me options, I'll approve" },
  { level: 6, label: "Decide and wait", desc: "Decide, tell me, wait for go-ahead" },
  { level: 7, label: "Decide and act unless told no", desc: "Proceed unless I intervene" },
  { level: 8, label: "Act and report", desc: "Do it, then tell me what happened" },
  { level: 9, label: "Act independently", desc: "Decide and act, no check-in needed" },
  { level: 10, label: "Full ownership", desc: "This is your area of responsibility" },
];

const FREE_LIMIT = 3;

// ── Cadence matrix ──────────────────────────────────────────────────────────
function getCadenceGuidance(complexity, importance, skillLevel, confidenceLevel) {
  const highTask = (complexity === "Complex" || importance === "High");
  const medTask = (complexity === "Moderate" || importance === "Medium");
  const lowSkill = skillLevel === "Low";
  const medSkill = skillLevel === "Medium";
  const highSkill = skillLevel === "High";
  const lowConf = confidenceLevel === "Low";
  const medConf = confidenceLevel === "Medium";
  const highConf = confidenceLevel === "High";

  if (highTask && highSkill && highConf) {
    return {
      frequency: "Weekly structured check-in",
      format: "Brief written update from the delegatee, followed by a 15-minute conversation",
      rationale: "Even highly capable people benefit from regular contact on high-stakes work. This isn't oversight — it's active interest. It protects them, keeps you informed, and signals that the task matters.",
      managerNote: "Schedule a weekly 15-minute check-in from the outset. Ask for a brief written update beforehand covering: progress, any blockers, and anything they'd like input on. Keep the conversation focused and forward-looking. Resist the urge to skip these when things seem to be going well — consistency is part of the signal.",
      delegateeNote: "I'd like us to have a brief weekly check-in — 15 minutes, with a short written update from you beforehand. This isn't about monitoring your progress. It's because this task matters and I want to stay close to it with you. Please cover: where you're up to, anything that's slowing you down, and anything you'd value my input on.",
    };
  }
  if (highTask && highSkill && medConf) {
    return {
      frequency: "Weekly check-in with mid-week availability",
      format: "Structured weekly conversation plus an open door for ad hoc contact",
      rationale: "Good skill but some confidence uncertainty on a high-stakes task. Regular contact keeps them anchored and gives you early sight of any hesitation before it becomes a problem.",
      managerNote: "Hold a weekly check-in and make it clear you're available between sessions if something comes up. Watch for signs of hesitation — not failure, just uncertainty. Your job here is as much encouragement as guidance. Don't wait for them to come to you; check in proactively if you sense they're stalling.",
      delegateeNote: "Let's keep a weekly check-in in the diary. I'm also available between sessions — if something comes up that you'd like to talk through, don't wait. This is important work and I'd rather hear about a concern early than late.",
    };
  }
  if (highTask && (medSkill || lowSkill) && highConf) {
    return {
      frequency: "Twice weekly",
      format: "Short structured conversation focused on decisions and blockers",
      rationale: "Confidence is good but skill gaps on a complex or important task create real risk. Frequent short check-ins catch errors before they compound and build the skill as the work progresses.",
      managerNote: "Two short check-ins per week — 20 minutes each. Focus on the decisions they're facing, not just what's been done. Ask: what options are you considering? What would you do and why? This builds judgement in real time, not just task completion. Keep notes — you're coaching as well as managing.",
      delegateeNote: "Given the complexity here, I'd like us to check in twice a week — short sessions, around 20 minutes. I want to hear about the decisions you're facing, not just the progress you've made. Come with options, not just questions, and we'll work through them together.",
    };
  }
  if (highTask && (medSkill || lowSkill) && (medConf || lowConf)) {
    return {
      frequency: "Every 2–3 days",
      format: "Structured coaching conversation with written notes or action log",
      rationale: "High task stakes combined with developing skill and lower confidence — this person needs active coaching, not just oversight. Frequent contact prevents drift and builds both capability and belief.",
      managerNote: "Check in every 2–3 days, minimum. Use a simple action log so you both have a shared record of what's been agreed. Each session: review what's been done, explore what's coming up, agree the next steps. Be specific. Vague encouragement doesn't help someone who's genuinely unsure — clear guidance does. This is your most active coaching scenario.",
      delegateeNote: "I'd like us to check in every couple of days on this one. It's a significant task and I want to make sure you have everything you need as it unfolds. Please keep a brief log of what you're working on and any questions as they arise — bring that to each session. I'm invested in you getting this right.",
    };
  }
  if (medTask && highSkill && highConf) {
    return {
      frequency: "Fortnightly review",
      format: "Brief written update at the halfway point, conversation at completion",
      rationale: "Capable, confident person on a moderate task. Light touch is appropriate. A midpoint update keeps you informed without suggesting you don't trust them.",
      managerNote: "Ask for a brief written update at the halfway point — three or four sentences is enough. Then a conversation when the work is done. Don't over-engineer the oversight on this one. If something significant changes, you'd expect them to flag it without being asked.",
      delegateeNote: "I'd like a brief written update halfway through — just to keep me in the picture. Then let's talk when it's done. I'm not hovering on this one; I trust your judgement. If anything significant shifts, just let me know.",
    };
  }
  if (medTask && (medSkill || highSkill) && (medConf || highConf)) {
    return {
      frequency: "Weekly light-touch check-in",
      format: "Informal conversation or brief written update — their choice",
      rationale: "Reasonably capable and confident on a moderate task. Weekly contact keeps you visible and available without implying a lack of trust.",
      managerNote: "A weekly check-in is enough here — keep it light. Let them choose the format: a quick message or a short conversation. Your job is availability and awareness, not close management. Ask one good question each time: what's the thing most likely to slow this down?",
      delegateeNote: "Let's keep a light weekly check-in — a short message or a quick conversation, whichever works better for you. I want to be available if you need me, but I'm not going to be watching over your shoulder. If you hit something you'd like to talk through, just come and find me.",
    };
  }
  if (medTask && (lowSkill || lowConf)) {
    return {
      frequency: "Weekly structured check-in",
      format: "Structured conversation with agreed action points",
      rationale: "Skill or confidence gaps on a moderate task. Regular structured contact builds competence and keeps the work on track. This isn't surveillance — it's investment.",
      managerNote: "A weekly structured check-in with agreed actions at the end of each session. Come prepared with a question or two — don't just ask 'how's it going?' Ask: what's the next decision you need to make? What would help? Keep the sessions short and purposeful. This person is developing, and how you show up in these conversations shapes how fast that happens.",
      delegateeNote: "Let's meet weekly to review progress and agree next steps. Come with an update and any questions — I'll come with support and any input you need. These sessions are there to help you, not to check up on you. The more honest you are about what you're finding difficult, the more useful I can be.",
    };
  }
  if (!highTask && !medTask) {
    return {
      frequency: "At completion",
      format: "Brief verbal or written update when the task is done",
      rationale: "Low complexity and importance. Checking in during the task would be disproportionate. A completion update is enough to close the loop and acknowledge the work.",
      managerNote: "No scheduled check-ins needed. Ask for a brief update when it's done — what happened, any issues worth noting. If they want to flag something in the meantime, the door is open. Don't manufacture oversight for a task that doesn't need it.",
      delegateeNote: "No need to check in while you're working on this — just let me know when it's done and give me a brief summary of what happened. If anything comes up that you think I should know about, feel free to flag it, but otherwise it's yours to get on with.",
    };
  }
  return {
    frequency: "Weekly check-in",
    format: "Short conversation or written update",
    rationale: "Regular light-touch contact keeps the work visible and the delegatee supported without implying close management.",
    managerNote: "A weekly check-in — short and purposeful. Ask what's going well and what's getting in the way. Stay available between sessions for anything time-sensitive.",
    delegateeNote: "Let's keep a weekly check-in in place. Keep it brief — progress, blockers, anything you need from me. I'm available between sessions if something comes up.",
  };
}

// ── ICS calendar generator ──────────────────────────────────────────────────
function generateICS({ taskTitle, delegateeName, managerName, cadence }) {
  const freq = cadence.frequency.toLowerCase();
  let rrule = "";
  let durationMins = 30;
  if (freq.includes("every 2") || freq.includes("2–3 days") || freq.includes("2-3 days")) {
    rrule = "RRULE:FREQ=DAILY;INTERVAL=2"; durationMins = 20;
  } else if (freq.includes("twice")) {
    rrule = "RRULE:FREQ=WEEKLY;BYDAY=MO,TH"; durationMins = 20;
  } else if (freq.includes("fortnightly")) {
    rrule = "RRULE:FREQ=WEEKLY;INTERVAL=2"; durationMins = 30;
  } else if (freq.includes("weekly")) {
    rrule = "RRULE:FREQ=WEEKLY"; durationMins = 15;
  } else {
    rrule = "RRULE:FREQ=WEEKLY"; durationMins = 15;
  }
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + 1);
  const day = start.getDay();
  if (day === 0) start.setDate(start.getDate() + 1);
  if (day === 6) start.setDate(start.getDate() + 2);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const uid = `delegateignite-${Date.now()}@themessagebusiness.com`;
  const summary = `Check-in: ${taskTitle} with ${delegateeName}`;
  const description = cadence.managerNote.replace(/\n/g, "\\n").replace(/,/g, "\\,");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//The Message Business//DelegateIgnite//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${uid}`, `SUMMARY:${summary}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER;CN=${managerName}:mailto:organizer@delegateignite.app`,
    rrule ? rrule : null, "STATUS:CONFIRMED",
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delegateignite-checkins-${delegateeName.replace(/\s+/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── localStorage helpers (free users) ──────────────────────────────────────
function getUsageCount() { try { return parseInt(localStorage.getItem("di_usage") || "0"); } catch { return 0; } }
function incrementUsage() { try { localStorage.setItem("di_usage", String(getUsageCount() + 1)); } catch {} }
function getSavedDelegations() { try { return JSON.parse(localStorage.getItem("di_saved") || "[]"); } catch { return []; } }
function saveLocalDelegation(data) {
  try {
    const saved = getSavedDelegations();
    saved.unshift({ ...data, id: Date.now(), date: new Date().toLocaleDateString("en-GB") });
    localStorage.setItem("di_saved", JSON.stringify(saved.slice(0, 20)));
  } catch {}
}

// ── UI Components ───────────────────────────────────────────────────────────
function Badge({ color, children }) {
  const styles = { blue: { bg: COLORS.blueLight, text: COLORS.blue }, teal: { bg: COLORS.tealLight, text: COLORS.teal }, amber: { bg: COLORS.amberLight, text: COLORS.amber }, green: { bg: COLORS.greenLight, text: COLORS.green } };
  const s = styles[color] || styles.blue;
  return <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em", textTransform: "uppercase" }}>{children}</span>;
}

function CadenceCard({ cadence, taskTitle, delegateeName, managerName }) {
  if (!cadence) return null;
  const canSchedule = !cadence.frequency.toLowerCase().includes("completion");
  return (
    <div style={{ background: COLORS.tealLight, border: `1px solid ${COLORS.teal}`, borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: COLORS.teal, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔁</div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.teal, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Recommended cadence</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{cadence.frequency}</p>
          </div>
        </div>
        {canSchedule && (
          <button onClick={() => generateICS({ taskTitle, delegateeName, managerName, cadence })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: COLORS.teal, color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 14 }}>📅</span> Add to calendar
          </button>
        )}
      </div>
      <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, margin: "0 0 8px", fontFamily: "sans-serif" }}><strong>Format:</strong> {cadence.format}</p>
      <p style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6, margin: 0, fontStyle: "italic", fontFamily: "sans-serif" }}>{cadence.rationale}</p>
    </div>
  );
}

function LevelMeter({ level }) {
  if (!level) return null;
  const lvl = parseInt(level);
  const info = LEVEL_DESCRIPTIONS[lvl - 1];
  const pct = (lvl / 10) * 100;
  const color = lvl <= 3 ? COLORS.blue : lvl <= 6 ? COLORS.teal : lvl <= 8 ? COLORS.amber : COLORS.green;
  return (
    <div style={{ background: COLORS.slateLight, borderRadius: 12, padding: "20px 24px", border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Delegation Level</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{lvl} — {info?.label}</p>
        </div>
        <div style={{ background: color, color: "#fff", fontSize: 28, fontWeight: 800, width: 52, height: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{lvl}</div>
      </div>
      <div style={{ background: COLORS.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ fontSize: 13, color: COLORS.muted, margin: "8px 0 0" }}>{info?.desc}</p>
    </div>
  );
}

function OutputBox({ title, content, badge }) {
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(content);
  useEffect(() => { setText(content); }, [content]);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const emailIt = () => {
    const subject = encodeURIComponent(`DelegateIgnite: ${title}`);
    const body = encodeURIComponent(text);
    const link = document.createElement("a");
    link.href = `mailto:?subject=${subject}&body=${body}`;
    link.target = "_blank";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const shareIt = async () => { if (navigator.share) { try { await navigator.share({ title: `DelegateIgnite: ${title}`, text }); } catch { emailIt(); } } else { emailIt(); } };
  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.slateLight }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{title}</span>
          {badge && <Badge color={badge.color}>{badge.label}</Badge>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copy} style={{ fontSize: 12, padding: "5px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: copied ? COLORS.greenLight : COLORS.white, color: copied ? COLORS.green : COLORS.slate, cursor: "pointer", fontWeight: 500 }}>{copied ? "Copied" : "Copy"}</button>
          <button onClick={shareIt} style={{ fontSize: 12, padding: "5px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.white, color: COLORS.slate, cursor: "pointer", fontWeight: 500 }}>Share</button>
        </div>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} style={{ width: "100%", minHeight: 280, padding: "16px 20px", border: "none", outline: "none", resize: "vertical", fontSize: 13.5, lineHeight: 1.7, color: COLORS.text, fontFamily: "Georgia, serif", boxSizing: "border-box", background: COLORS.white }} />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, required }) {
  const style = { width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, color: COLORS.text, background: COLORS.white, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>{label}{required && <span style={{ color: COLORS.red }}> *</span>}</label>
      {multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...style, resize: "vertical" }} /> : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}

function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{ padding: "7px 16px", border: `1.5px solid ${value === o.value ? COLORS.blue : COLORS.border}`, borderRadius: 8, background: value === o.value ? COLORS.blueLight : COLORS.white, color: value === o.value ? COLORS.blue : COLORS.slate, fontSize: 13, fontWeight: value === o.value ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function AuthModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMagicLink = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,42,74,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "100%" }}>
        {!sent ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, background: COLORS.tealLight, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>✉️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: "0 0 8px", fontFamily: "sans-serif" }}>Sign in to DelegateIgnite</h2>
              <p style={{ fontSize: 14, color: COLORS.muted, margin: 0, fontFamily: "sans-serif", lineHeight: 1.6 }}>Enter your email and we'll send you a magic link. No password needed.</p>
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMagicLink()}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, color: COLORS.text, outline: "none", boxSizing: "border-box", fontFamily: "sans-serif", marginBottom: 12 }}
            />
            {error && <p style={{ fontSize: 13, color: COLORS.red, margin: "0 0 10px", fontFamily: "sans-serif" }}>{error}</p>}
            <button onClick={sendMagicLink} disabled={loading} style={{ width: "100%", padding: "11px", background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "sans-serif", marginBottom: 10 }}>
              {loading ? "Sending..." : "Send magic link"}
            </button>
            <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", padding: 4, fontFamily: "sans-serif" }}>Cancel</button>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: "0 0 10px", fontFamily: "sans-serif" }}>Check your email</h2>
            <p style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.6, margin: "0 0 20px", fontFamily: "sans-serif" }}>We've sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
            <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", fontFamily: "sans-serif" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose, triggered }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const plans = [
    { id: "monthly", name: "Monthly", price: "£4.99", period: "/month", desc: "Full access, cancel anytime.", highlight: false },
    { id: "annual", name: "Annual", price: "£59.99", period: "/year", desc: "Best value — two months free.", highlight: true },
    { id: "lifetime", name: "Lifetime", price: "£49.99", period: "one-off", desc: "Pay once, use forever.", highlight: false },
  ];
  const handleCheckout = async (planId) => {
    setLoadingPlan(planId);
    setCheckoutError("");
    try {
      const response = await fetch("/api/stripe-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planId, origin: window.location.origin }) });
      const data = await response.json();
      if (data.url) { window.location.href = data.url; }
      else { setCheckoutError("Something went wrong. Please try again."); setLoadingPlan(null); }
    } catch { setCheckoutError("Something went wrong. Please try again."); setLoadingPlan(null); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,42,74,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: "36px 32px", maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: COLORS.amberLight, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>★</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: "0 0 8px", fontFamily: "sans-serif" }}>{triggered === "limit" ? "You've used your 3 free delegations" : "Unlock DelegateIgnite"}</h2>
          <p style={{ fontSize: 14, color: COLORS.muted, margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>Unlimited delegations, cadence guidance, calendar integration, and briefing notes.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ border: `${plan.highlight ? 2 : 1}px solid ${plan.highlight ? COLORS.teal : COLORS.border}`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: plan.highlight ? COLORS.tealLight : COLORS.white, gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, fontFamily: "sans-serif" }}>{plan.name}</span>
                  {plan.highlight && <Badge color="teal">Most popular</Badge>}
                </div>
                <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0, fontFamily: "sans-serif" }}>{plan.desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, fontFamily: "sans-serif" }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: COLORS.muted, fontFamily: "sans-serif" }}> {plan.period}</span>
                </div>
                <button onClick={() => handleCheckout(plan.id)} disabled={!!loadingPlan} style={{ padding: "8px 18px", background: plan.highlight ? COLORS.teal : COLORS.navy, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loadingPlan ? "not-allowed" : "pointer", fontFamily: "sans-serif", opacity: loadingPlan && loadingPlan !== plan.id ? 0.5 : 1, minWidth: 80 }}>
                  {loadingPlan === plan.id ? "..." : "Select"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {checkoutError && <p style={{ fontSize: 13, color: COLORS.red, textAlign: "center", margin: "0 0 12px", fontFamily: "sans-serif" }}>{checkoutError}</p>}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: 0, fontFamily: "sans-serif" }}>Secure payment by Stripe. Cancel subscriptions anytime.</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", padding: 4, fontFamily: "sans-serif" }}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ items, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,42,74,0.7)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", zIndex: 1000, padding: 0 }}>
      <div style={{ background: COLORS.white, width: "100%", maxWidth: 460, height: "100vh", overflowY: "auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: 0 }}>Saved delegations</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.slate }}>×</button>
        </div>
        {items.length === 0 ? (
          <p style={{ color: COLORS.muted, fontSize: 14 }}>No saved delegations yet.</p>
        ) : items.map(item => (
          <div key={item.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{item.task_title || item.taskTitle || "Untitled task"}</span>
              <span style={{ fontSize: 12, color: COLORS.muted }}>{item.date || new Date(item.created_at).toLocaleDateString("en-GB")}</span>
            </div>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 6px" }}>{item.managerName} → {item.delegatee_name || item.delegateeName}</p>
            {item.delegation_level || item.delegationLevel ? <Badge color="teal">Level {item.delegation_level || item.delegationLevel}</Badge> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function DelegateIgnite() {
  const [form, setForm] = useState({
    managerName: "", delegateeName: "", taskTitle: "", taskDescription: "",
    outcomes: "", deadline: "", complexity: "", importance: "",
    skillLevel: "", confidenceLevel: "", saveLocally: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState("manual");
  const [showHistory, setShowHistory] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [usageCount, setUsageCount] = useState(getUsageCount());
  const [history, setHistory] = useState(getSavedDelegations());
  const [isPro, setIsPro] = useState(() => { try { return localStorage.getItem("di_pro") === "true"; } catch { return false; } });
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [user, setUser] = useState(null);
  const [goalCheck, setGoalCheck] = useState(null);
  const [sharpenedGoal, setSharpenedGoal] = useState("");
  const [goalAccepted, setGoalAccepted] = useState(false);
  const [cadence, setCadence] = useState(null);
  const resultsRef = useRef(null);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const res = await fetch("/api/supabase-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_user", userId }) });
      const data = await res.json();
      if (data.user?.plan && data.user.plan !== "free") {
        setIsPro(true);
        try { localStorage.setItem("di_pro", "true"); } catch {}
      }
      const histRes = await fetch("/api/supabase-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_delegations", userId }) });
      const histData = await histRes.json();
      if (histData.delegations) setHistory(histData.delegations);
    } catch {}
  };

  // Stripe return URL handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      try { localStorage.setItem("di_pro", "true"); } catch {}
      setIsPro(true);
      setShowSuccessBanner(true);
      window.history.replaceState({}, "", "/");
      setTimeout(() => setShowSuccessBanner(false), 6000);
    }
    if (params.get("cancelled")) window.history.replaceState({}, "", "/");
  }, []);

  // Cadence
  useEffect(() => {
    if (form.complexity && form.importance && form.skillLevel && form.confidenceLevel) {
      setCadence(getCadenceGuidance(form.complexity, form.importance, form.skillLevel, form.confidenceLevel));
    } else { setCadence(null); }
  }, [form.complexity, form.importance, form.skillLevel, form.confidenceLevel]);

  const validate = () => {
    if (!form.managerName.trim()) return "Manager name is required.";
    if (!form.delegateeName.trim()) return "Delegatee name is required.";
    if (!form.taskTitle.trim()) return "Task title is required.";
    if (!form.taskDescription.trim()) return "Task description is required.";
    if (!form.complexity) return "Please select task complexity.";
    if (!form.importance) return "Please select task importance.";
    if (!form.skillLevel) return "Please select delegatee skill level.";
    if (!form.confidenceLevel) return "Please select delegatee confidence level.";
    return null;
  };

  const buildCheckPrompt = () => `
You are reviewing a manager's task description before they generate a delegation guide.

TASK TITLE: ${form.taskTitle}
TASK DESCRIPTION: ${form.taskDescription}
REQUIRED OUTCOMES: ${form.outcomes || "Not specified"}

Your job is to decide whether the goal is specific enough to produce useful delegation guidance.

A goal is TOO VAGUE if:
- It describes activity rather than outcome ("manage the project" / "handle the client")
- It has no measurable success criteria
- It could apply to almost any task or person
- It leaves the delegatee unclear on what "done" looks like

A goal is SPECIFIC ENOUGH if:
- It describes a clear outcome or deliverable
- It has at least some indication of what success looks like
- It is scoped enough to act on

Respond in EXACTLY this format — no other text:

STATUS: [PASS or FAIL]
REASON: [One plain sentence explaining why it passes or fails. If PASS, say so briefly.]
SHARPENED: [If FAIL, rewrite the task description as a specific, outcome-focused version. If PASS, repeat the original description unchanged.]
`;

  const buildPrompt = (descriptionToUse) => {
    const c = getCadenceGuidance(form.complexity, form.importance, form.skillLevel, form.confidenceLevel);
    return `
You are an expert delegation coach. Generate detailed, practical delegation guidance using the framework below.

INPUTS:
- Manager: ${form.managerName}
- Delegatee: ${form.delegateeName}
- Task: ${form.taskTitle}
- Description: ${descriptionToUse}
- Required outcomes: ${form.outcomes || "Not specified"}
- Deadline: ${form.deadline || "Not specified"}
- Task complexity: ${form.complexity}
- Task importance: ${form.importance}
- Delegatee skill level: ${form.skillLevel}
- Delegatee confidence level: ${form.confidenceLevel}

CADENCE GUIDANCE (already calculated — use this exactly):
- Recommended frequency: ${c.frequency}
- Format: ${c.format}
- Rationale: ${c.rationale}
- Manager check-in note: ${c.managerNote}
- Delegatee check-in note: ${c.delegateeNote}

DELEGATION LEVELS (1-10):
1: "Wait to be told / Follow these instructions precisely"
2: "Look into this and tell me the situation. I'll decide."
3: "Look into this and tell me the situation. We'll decide together."
4: "Tell me the situation and what help you need. Then we'll decide."
5: "Give me your analysis and recommendation. I'll let you know whether you can go ahead."
6: "Decide and let me know your decision, and wait for my go-ahead before proceeding."
7: "Decide and let me know your decision, then go ahead unless I say not to."
8: "Decide and take action — let me know what you did and what happened."
9: "Decide and take action. You need not check back with me."
10: "Decide where action needs to be taken and manage the situation accordingly. It's your area now."

RULES FOR LEVEL SELECTION:
- High complexity + high importance = lower level (more oversight) unless skill and confidence are both high
- Low skill or low confidence = lower level (more structure and support)
- High skill + high confidence = higher level (more autonomy)
- Balance task risk with development opportunity

9-STEP DELEGATION PROCESS:
1. Define the task
2. Select the individual or team
3. Assess ability and training needs
4. Explain the reasons
5. State required results and how success will be measured
6. Consider resources required
7. Agree deadlines, review points and controls
8. Support and communicate
9. Give feedback on results

YOUR RESPONSE MUST USE EXACTLY THIS FORMAT — NO DEVIATIONS:

DELEGATION_LEVEL: [number only, e.g. 4]

DELEGATION_ADVICE:
[Write detailed, practical guidance for ${form.managerName}. Use the 9-step delegation process as the structure. Include: why this delegation level is appropriate; communication tips specific to this delegatee; likely risks or watch-outs; the check-in cadence from the CADENCE GUIDANCE above woven naturally into the advice. Be specific and concrete. Minimum 400 words.]

BRIEFING_NOTE:
[Write a professional briefing note addressed directly to ${form.delegateeName}. Use first-person manager voice. Include: clear task explanation; expected outcomes; timescales and review points; level of autonomy; available support; the check-in arrangement from the CADENCE GUIDANCE above. Make it warm, clear, and confidence-building. Minimum 300 words.]
`;
  };

  const generate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!isPro && usageCount >= FREE_LIMIT) { setUpgradeTrigger("limit"); setShowUpgrade(true); return; }
    setError("");

    if (!goalAccepted) {
      setLoading(true);
      setGoalCheck(null);
      try {
        const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: buildCheckPrompt() }] }) });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        const statusMatch = text.match(/STATUS:\s*(PASS|FAIL)/i);
        const reasonMatch = text.match(/REASON:\s*(.+)/i);
        const sharpenedMatch = text.match(/SHARPENED:\s*([\s\S]+)/i);
        const status = statusMatch?.[1]?.toUpperCase() || "PASS";
        const reason = reasonMatch?.[1]?.trim() || "";
        const sharpened = sharpenedMatch?.[1]?.trim() || form.taskDescription;
        if (status === "PASS") {
          setSharpenedGoal(form.taskDescription);
          setGoalAccepted(true);
          await runGenerate(form.taskDescription);
        } else {
          setGoalCheck({ status: "fail", reason, sharpened });
          setSharpenedGoal(sharpened);
          setLoading(false);
        }
      } catch { setError("Something went wrong. Please try again."); setLoading(false); }
      return;
    }
    await runGenerate(sharpenedGoal || form.taskDescription);
  };

  const runGenerate = async (descriptionToUse) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: buildPrompt(descriptionToUse) }] }) });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const levelMatch = text.match(/DELEGATION_LEVEL:\s*(\d+)/i);
      const adviceStart = text.search(/DELEGATION_ADVICE:/i);
      const briefingStart = text.search(/BRIEFING_NOTE:/i);
      const adviceTagLen = "DELEGATION_ADVICE:".length;
      const briefingTagLen = "BRIEFING_NOTE:".length;
      let delegationAdvice = "";
      let briefingNote = "";
      if (adviceStart !== -1 && briefingStart !== -1 && briefingStart > adviceStart) {
        delegationAdvice = text.slice(adviceStart + adviceTagLen, briefingStart).trim();
        briefingNote = text.slice(briefingStart + briefingTagLen).trim();
      } else if (adviceStart !== -1) {
        delegationAdvice = text.slice(adviceStart + adviceTagLen).trim();
      } else { delegationAdvice = text.trim(); }

      const parsed = {
        delegationLevel: levelMatch?.[1] || "5",
        delegationAdvice: delegationAdvice || text,
        briefingNote,
        taskTitle: form.taskTitle,
        managerName: form.managerName,
        delegateeName: form.delegateeName,
        cadence: getCadenceGuidance(form.complexity, form.importance, form.skillLevel, form.confidenceLevel),
      };

      setResult(parsed);

      if (!isPro) { incrementUsage(); setUsageCount(getUsageCount()); }

      if (form.saveLocally) {
        if (user && isPro) {
          // Save to Supabase
          await fetch("/api/supabase-auth", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save_delegation", userId: user.id,
              delegation: { task_title: parsed.taskTitle, delegatee_name: parsed.delegateeName, delegation_level: parsed.delegationLevel, delegation_advice: parsed.delegationAdvice, briefing_note: parsed.briefingNote, cadence: parsed.cadence }
            })
          });
          await loadUserData(user.id);
        } else {
          saveLocalDelegation(parsed);
          setHistory(getSavedDelegations());
        }
      }

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const resetAll = () => { setGoalCheck(null); setSharpenedGoal(""); setGoalAccepted(false); setResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setIsPro(false); try { localStorage.removeItem("di_pro"); } catch {} };
  const remaining = isPro ? null : Math.max(0, FREE_LIMIT - usageCount);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} triggered={upgradeTrigger} />}
      {showHistory && <HistoryPanel items={history} onClose={() => setShowHistory(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}

      {showSuccessBanner && (
        <div style={{ background: COLORS.green, padding: "12px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0, fontFamily: "sans-serif" }}>Payment successful — you now have unlimited access. Welcome to DelegateIgnite Pro.</p>
        </div>
      )}

      {/* Header */}
      {/* Header */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e8e8f0", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 68 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "#0077B6", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
                <path d="M12 2C12 2 7 7 7 13a5 5 0 0010 0C17 7 12 2 12 2z" fill="white" opacity="0.9"/>
                <path d="M12 8c0 0-3 3-3 5a3 3 0 006 0C15 11 12 8 12 8z" fill="white" opacity="0.45"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.25rem", fontWeight: 600, color: "#1a1a2e", letterSpacing: "-0.02em", lineHeight: 1.1 }}>Delegate <span style={{ color: "#0077B6" }}>Ignite</span></span>
              <span style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 400, color: "#9b9bb0", letterSpacing: "0.08em", textTransform: "uppercase" }}>Part of the Management Ignition Suite</span>
            </div>
            <Badge color={isPro ? "green" : "amber"}>{isPro ? "Pro" : "Beta"}</Badge>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => setShowHistory(true)} style={{ background: "none", border: "none", color: "#6b6b85", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "'Outfit', sans-serif" }}>History</button>
            {user ? (
              <>
                <span style={{ fontSize: 12, color: "#9b9bb0", fontFamily: "'Outfit', sans-serif" }}>{user.email}</span>
                <button onClick={signOut} style={{ background: "none", border: "1px solid #d0d0e0", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#6b6b85", fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Sign out</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "none", border: "1px solid #d0d0e0", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#6b6b85", fontFamily: "'Outfit', sans-serif", cursor: "pointer" }}>Sign in</button>
            )}
            {!isPro && (
              <>
                <div style={{ background: "#f0f8ff", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#3d3d56", fontFamily: "'Outfit', sans-serif" }}>{remaining} free {remaining === 1 ? "use" : "uses"} left</div>
                <button onClick={() => { setUpgradeTrigger("manual"); setShowUpgrade(true); }} style={{ background: "#0077B6", border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 600, cursor: "pointer" }}>Upgrade</button>
              </>
            )}
          </div>
        </div>
        </div>

      {/* Hero */}
      <div style={{ background: COLORS.navy, borderBottom: `3px solid ${COLORS.teal}`, paddingBottom: 32 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 0" }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>Delegate better.<br />Every time.</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>Match the task to the person. Get a practical delegation guide and a ready-to-use briefing note in seconds.</p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Form card */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "28px 28px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 22px", fontFamily: "sans-serif", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14 }}>The delegation</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <TextField label="Manager name" value={form.managerName} onChange={f("managerName")} placeholder="Your name" required />
            <TextField label="Delegatee name" value={form.delegateeName} onChange={f("delegateeName")} placeholder="Their name" required />
          </div>
          <TextField label="Task title" value={form.taskTitle} onChange={f("taskTitle")} placeholder="e.g. Lead the Q3 client review" required />
          <TextField label="Task description" value={form.taskDescription} onChange={f("taskDescription")} placeholder="What does this task involve? What context is relevant?" multiline required />
          <TextField label="Specific outcomes required" value={form.outcomes} onChange={f("outcomes")} placeholder="What does success look like?" multiline />
          <TextField label="Deadline" value={form.deadline} onChange={f("deadline")} placeholder="e.g. Friday 4pm / end of month" />

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20, marginTop: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: "0 0 16px", fontFamily: "sans-serif" }}>Task profile</h3>
            <ToggleGroup label="Complexity" value={form.complexity} onChange={f("complexity")} options={[{ value: "Simple", label: "Simple" }, { value: "Moderate", label: "Moderate" }, { value: "Complex", label: "Complex" }]} />
            <ToggleGroup label="Importance" value={form.importance} onChange={f("importance")} options={[{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]} />
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20, marginTop: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: "0 0 16px", fontFamily: "sans-serif" }}>About {form.delegateeName || "the delegatee"}</h3>
            <ToggleGroup label="Skill level for this type of task" value={form.skillLevel} onChange={f("skillLevel")} options={[{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]} />
            <ToggleGroup label="Confidence level" value={form.confidenceLevel} onChange={f("confidenceLevel")} options={[{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]} />
          </div>

          {cadence && (
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20, marginTop: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: "0 0 12px", fontFamily: "sans-serif" }}>Suggested check-in cadence</h3>
              <div style={{ background: COLORS.tealLight, border: `1px solid ${COLORS.teal}`, borderRadius: 10, padding: "14px 18px" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.teal, margin: "0 0 4px", fontFamily: "sans-serif" }}>{cadence.frequency}</p>
                <p style={{ fontSize: 13, color: COLORS.text, margin: "0 0 6px", fontFamily: "sans-serif" }}>{cadence.format}</p>
                <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0, fontStyle: "italic", fontFamily: "sans-serif", lineHeight: 1.5 }}>{cadence.rationale}</p>
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: COLORS.muted, fontFamily: "sans-serif" }}>
              <input type="checkbox" checked={form.saveLocally} onChange={e => setForm(p => ({ ...p, saveLocally: e.target.checked }))} style={{ width: 15, height: 15 }} />
              Save this delegation to history
            </label>
            {error && <p style={{ fontSize: 13, color: COLORS.red, margin: 0, fontFamily: "sans-serif" }}>{error}</p>}
          </div>

          <button onClick={generate} disabled={loading} style={{ width: "100%", marginTop: 16, padding: "14px", background: loading ? COLORS.slate : COLORS.navy, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "sans-serif", letterSpacing: "0.01em", transition: "background 0.2s" }}>
            {loading ? "Generating your delegation guide..." : "Generate delegation guide"}
          </button>

          {!isPro && remaining <= 1 && !loading && (
            <p style={{ textAlign: "center", fontSize: 12, color: COLORS.amber, marginTop: 10, fontFamily: "sans-serif" }}>
              {remaining === 0 ? "You've used all free delegations." : "Last free delegation."}{" "}
              <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => { setUpgradeTrigger("limit"); setShowUpgrade(true); }}>Upgrade for unlimited access.</span>
            </p>
          )}
        </div>

        {/* Goal sharpening */}
        {goalCheck && !goalAccepted && (
          <div style={{ background: COLORS.amberLight, border: `1px solid ${COLORS.amber}`, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠️</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: "0 0 4px", fontFamily: "sans-serif" }}>Your goal needs sharpening</p>
                <p style={{ fontSize: 13, color: COLORS.text, margin: 0, fontFamily: "sans-serif", lineHeight: 1.6 }}>{goalCheck.reason}</p>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6, fontFamily: "sans-serif" }}>Suggested rewrite — edit if needed:</label>
              <textarea value={sharpenedGoal} onChange={e => setSharpenedGoal(e.target.value)} rows={4} style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${COLORS.amber}`, borderRadius: 8, fontSize: 13.5, lineHeight: 1.6, color: COLORS.text, fontFamily: "Georgia, serif", boxSizing: "border-box", background: COLORS.white, outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => { setGoalAccepted(true); runGenerate(sharpenedGoal); }} style={{ padding: "10px 20px", background: COLORS.navy, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>Use this — generate guide</button>
              <button onClick={() => { setGoalCheck(null); setGoalAccepted(true); setSharpenedGoal(form.taskDescription); runGenerate(form.taskDescription); }} style={{ padding: "10px 20px", background: COLORS.white, color: COLORS.navy, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "sans-serif" }}>Keep my original wording</button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: 0, fontFamily: "sans-serif" }}>Your delegation guide</h2>
              <Badge color="green">Ready to use</Badge>
            </div>
            <LevelMeter level={result.delegationLevel} />
            {result.cadence && <CadenceCard cadence={result.cadence} taskTitle={result.taskTitle} delegateeName={result.delegateeName} managerName={result.managerName} />}
            <OutputBox title="Advice for the delegator" content={result.delegationAdvice} badge={{ color: "blue", label: "Manager only" }} />
            <OutputBox title={`Briefing note for ${result.delegateeName}`} content={result.briefingNote} badge={{ color: "teal", label: "Share with delegatee" }} />
            <div style={{ background: COLORS.slateLight, borderRadius: 10, padding: "14px 18px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, fontFamily: "sans-serif" }}>Both outputs are editable. Adjust to fit your voice before sharing.</p>
              <button onClick={resetAll} style={{ fontSize: 13, padding: "7px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.navy, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 500 }}>New delegation</button>
            </div>
          </div>
        )}

        {/* How it works */}
        {!result && !loading && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px", fontFamily: "sans-serif" }}>How it works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[{ n: "1", title: "Describe the task", desc: "Tell us what you're delegating and to whom." }, { n: "2", title: "Profile the person", desc: "Skill level and confidence shape the right approach." }, { n: "3", title: "Get your guide", desc: "Receive a delegation plan and a ready briefing note." }].map(s => (
                <div key={s.n} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ width: 28, height: 28, background: COLORS.navy, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10, fontFamily: "sans-serif" }}>{s.n}</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, margin: "0 0 4px", fontFamily: "sans-serif" }}>{s.title}</p>
                  <p style={{ fontSize: 12.5, color: COLORS.muted, margin: 0, lineHeight: 1.5, fontFamily: "sans-serif" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 40, paddingTop: 20, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: 0, fontFamily: "sans-serif" }}>
            DelegateIgnite by <a href="#" style={{ color: COLORS.blue, textDecoration: "none" }}>The Message Business</a>
            {!isPro && <> · {remaining} free {remaining === 1 ? "use" : "uses"} remaining · <span style={{ textDecoration: "underline", cursor: "pointer", color: COLORS.blue }} onClick={() => { setUpgradeTrigger("manual"); setShowUpgrade(true); }}>Upgrade to Pro</span></>}
            {isPro && <> · <span style={{ color: COLORS.green, fontWeight: 600 }}>Pro — unlimited access</span></>}
          </p>
        </div>
      </div>
    </div>
  );
}
