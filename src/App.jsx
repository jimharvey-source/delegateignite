import { useState, useEffect, useRef } from "react";

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

const FREE_LIMIT = 999;

function getUsageCount() {
  try { return parseInt(localStorage.getItem("di_usage") || "0"); } catch { return 0; }
}
function incrementUsage() {
  try { localStorage.setItem("di_usage", String(getUsageCount() + 1)); } catch {}
}
function getSavedDelegations() {
  try { return JSON.parse(localStorage.getItem("di_saved") || "[]"); } catch { return []; }
}
function saveDelegation(data) {
  try {
    const saved = getSavedDelegations();
    saved.unshift({ ...data, id: Date.now(), date: new Date().toLocaleDateString("en-GB") });
    localStorage.setItem("di_saved", JSON.stringify(saved.slice(0, 20)));
  } catch {}
}

function Badge({ color, children }) {
  const styles = {
    blue: { bg: COLORS.blueLight, text: COLORS.blue },
    teal: { bg: COLORS.tealLight, text: COLORS.teal },
    amber: { bg: COLORS.amberLight, text: COLORS.amber },
    green: { bg: COLORS.greenLight, text: COLORS.green },
  };
  const s = styles[color] || styles.blue;
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {children}
    </span>
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

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const emailIt = () => {
  const subject = encodeURIComponent(`DelegateIgnite: ${title}`);
  const body = encodeURIComponent(text);
  const link = document.createElement("a");
  link.href = `mailto:?subject=${subject}&body=${body}`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const shareIt = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `DelegateIgnite: ${title}`,
        text: text,
      });
    } catch (e) {
      emailIt();
    }
  } else {
    emailIt();
  }
};

  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.slateLight }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{title}</span>
          {badge && <Badge color={badge.color}>{badge.label}</Badge>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={copy} style={{ fontSize: 12, padding: "5px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: copied ? COLORS.greenLight : COLORS.white, color: copied ? COLORS.green : COLORS.slate, cursor: "pointer", fontWeight: 500 }}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={shareIt} style={{ fontSize: 12, padding: "5px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.white, color: COLORS.slate, cursor: "pointer", fontWeight: 500 }}>
  Share
</button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ width: "100%", minHeight: 280, padding: "16px 20px", border: "none", outline: "none", resize: "vertical", fontSize: 13.5, lineHeight: 1.7, color: COLORS.text, fontFamily: "Georgia, serif", boxSizing: "border-box", background: COLORS.white }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>{label}{required && <span style={{ color: COLORS.red }}> *</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, color: COLORS.text, background: COLORS.white, outline: "none" }}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, required }) {
  const style = { width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, color: COLORS.text, background: COLORS.white, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>{label}{required && <span style={{ color: COLORS.red }}> *</span>}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...style, resize: "vertical" }} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}

function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{ padding: "7px 16px", border: `1.5px solid ${value === o.value ? COLORS.blue : COLORS.border}`, borderRadius: 8, background: value === o.value ? COLORS.blueLight : COLORS.white, color: value === o.value ? COLORS.blue : COLORS.slate, fontSize: 13, fontWeight: value === o.value ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,42,74,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: COLORS.white, borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: COLORS.amberLight, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>★</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: "0 0 10px" }}>Free limit reached</h2>
        <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.6, margin: "0 0 24px" }}>You've used your 3 free delegations. Upgrade to Pro for unlimited use, saved history, and full export options.</p>
        <div style={{ background: COLORS.slateLight, borderRadius: 10, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, margin: "0 0 8px" }}>Pro — £9/month or £79/year</p>
          <ul style={{ fontSize: 13, color: COLORS.muted, margin: 0, paddingLeft: 18, lineHeight: 2 }}>
            <li>Unlimited delegations</li>
            <li>Save and track history</li>
            <li>Email and export outputs</li>
            <li>Cancel anytime</li>
          </ul>
        </div>
        <button style={{ width: "100%", padding: "12px", background: COLORS.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>
          Upgrade to Pro
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 13, cursor: "pointer", padding: 4 }}>Maybe later</button>
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
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{item.taskTitle || "Untitled task"}</span>
              <span style={{ fontSize: 12, color: COLORS.muted }}>{item.date}</span>
            </div>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 6px" }}>{item.managerName} → {item.delegateeName}</p>
            {item.delegationLevel && <Badge color="teal">Level {item.delegationLevel}</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [showHistory, setShowHistory] = useState(false);
  const [usageCount, setUsageCount] = useState(getUsageCount());
  const [history, setHistory] = useState(getSavedDelegations());
  const resultsRef = useRef(null);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

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

  const buildPrompt = () => `
You are an expert delegation coach. Generate detailed, practical delegation guidance using the framework below.

INPUTS:
- Manager: ${form.managerName}
- Delegatee: ${form.delegateeName}
- Task: ${form.taskTitle}
- Description: ${form.taskDescription}
- Required outcomes: ${form.outcomes || "Not specified"}
- Deadline: ${form.deadline || "Not specified"}
- Task complexity: ${form.complexity}
- Task importance: ${form.importance}
- Delegatee skill level: ${form.skillLevel}
- Delegatee confidence level: ${form.confidenceLevel}

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
[Write detailed, practical guidance for ${form.managerName}. Use the 9-step delegation process as the structure. Include: why this delegation level is appropriate; communication tips specific to this delegatee; likely risks or watch-outs; suggested review checkpoints; coaching approach; how much freedom vs control to give. Be specific and concrete — this should be immediately usable in a real meeting. Minimum 400 words.]

BRIEFING_NOTE:
[Write a professional briefing note addressed directly to ${form.delegateeName}. Use first-person manager voice (e.g. "I'd like you to...", "Please come back to me by...", "You have freedom to..."). Include: clear task explanation; expected outcomes; timescales and review points; level of autonomy; available support; when to check back; success criteria. Make it warm, clear, and confidence-building. Minimum 300 words.]
`;

  const generate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (usageCount >= FREE_LIMIT) { setShowUpgrade(true); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: buildPrompt() }],
  }),
});

const data = await response.json();
const text = data.choices?.[0]?.message?.content || "";
console.log("API response text:", text);

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
      } else {
        delegationAdvice = text.trim();
      }

      const parsed = {
        delegationLevel: levelMatch?.[1] || "5",
        delegationAdvice: delegationAdvice || text,
        briefingNote: briefingNote,
        taskTitle: form.taskTitle,
        managerName: form.managerName,
        delegateeName: form.delegateeName,
      };

      setResult(parsed);
      incrementUsage();
      setUsageCount(getUsageCount());

      if (form.saveLocally) {
        saveDelegation(parsed);
        setHistory(getSavedDelegations());
      }

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, FREE_LIMIT - usageCount);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showHistory && <HistoryPanel items={history} onClose={() => setShowHistory(false)} />}

      {/* Header */}
      <div style={{ background: COLORS.navy, padding: "0 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>DelegateIgnite</span>
            <Badge color="amber">Beta</Badge>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button onClick={() => setShowHistory(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", padding: 0 }}>
              History
            </button>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "sans-serif" }}>
              {remaining} free {remaining === 1 ? "use" : "uses"} left
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: COLORS.navy, borderBottom: `3px solid ${COLORS.teal}`, paddingBottom: 32 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 0" }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
            Delegate better.<br />Every time.
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>
            Match the task to the person. Get a practical delegation guide and a ready-to-use briefing note in seconds.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* Form card */}
        <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: "28px 28px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 22px", fontFamily: "sans-serif", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14 }}>
            The delegation
          </h2>

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

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: COLORS.muted, fontFamily: "sans-serif" }}>
              <input type="checkbox" checked={form.saveLocally} onChange={e => setForm(p => ({ ...p, saveLocally: e.target.checked }))} style={{ width: 15, height: 15 }} />
              Save this delegation to history
            </label>
            {error && <p style={{ fontSize: 13, color: COLORS.red, margin: 0, fontFamily: "sans-serif" }}>{error}</p>}
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{ width: "100%", marginTop: 16, padding: "14px", background: loading ? COLORS.slate : COLORS.navy, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "sans-serif", letterSpacing: "0.01em", transition: "background 0.2s" }}
          >
            {loading ? "Generating your delegation guide..." : "Generate delegation guide"}
          </button>

          {remaining <= 1 && !loading && (
            <p style={{ textAlign: "center", fontSize: 12, color: COLORS.amber, marginTop: 10, fontFamily: "sans-serif" }}>
              {remaining === 0 ? "You've used all free delegations." : "Last free delegation."} <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => setShowUpgrade(true)}>Upgrade for unlimited access.</span>
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: 0, fontFamily: "sans-serif" }}>Your delegation guide</h2>
              <Badge color="green">Ready to use</Badge>
            </div>

            <LevelMeter level={result.delegationLevel} />

            <OutputBox
              title="Advice for the delegator"
              content={result.delegationAdvice}
              badge={{ color: "blue", label: "Manager only" }}
            />
            <OutputBox
              title={`Briefing note for ${result.delegateeName}`}
              content={result.briefingNote}
              badge={{ color: "teal", label: "Share with delegatee" }}
            />

            <div style={{ background: COLORS.slateLight, borderRadius: 10, padding: "14px 18px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, fontFamily: "sans-serif" }}>Both outputs are editable. Adjust to fit your voice before sharing.</p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ fontSize: 13, padding: "7px 16px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.navy, cursor: "pointer", fontFamily: "sans-serif", fontWeight: 500 }}>
                New delegation
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        {!result && !loading && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px", fontFamily: "sans-serif" }}>How it works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { n: "1", title: "Describe the task", desc: "Tell us what you're delegating and to whom." },
                { n: "2", title: "Profile the person", desc: "Skill level and confidence shape the right approach." },
                { n: "3", title: "Get your guide", desc: "Receive a delegation plan and a ready briefing note." },
              ].map(s => (
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
            DelegateIgnite by <a href="#" style={{ color: COLORS.blue, textDecoration: "none" }}>The Message Business</a> · {remaining} free {remaining === 1 ? "use" : "uses"} remaining ·{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer", color: COLORS.blue }} onClick={() => setShowUpgrade(true)}>Upgrade to Pro</span>
          </p>
        </div>
      </div>
    </div>
  );
}
