import { useState, useEffect } from "react";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Load EmailJS script dynamically
const loadEmailJS = () => new Promise((resolve) => {
  if (window.emailjs) { resolve(); return; }
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  script.onload = () => { window.emailjs.init(EMAILJS_PUBLIC_KEY); resolve(); };
  document.head.appendChild(script);
});

// Supabase helpers
const sbFetch = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation", ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  return res.json();
};

const PALETTE = [
  "#E85D75","#F4A261","#2A9D8F","#264653","#E9C46A",
  "#7B2D8B","#457B9D","#F28482","#84A59D","#F7B267"
];

const SENIORITY_LEVELS = [
  {
    id: "junior",
    label: "Junior / Individual Contributor",
    description: "Early career, focused on building skills and delivering tasks",
    icon: "🌱",
  },
  {
    id: "management",
    label: "Management",
    description: "Leading a team, balancing people and delivery",
    icon: "🎯",
  },
  {
    id: "senior",
    label: "Senior Leadership",
    description: "Setting direction across functions or departments",
    icon: "🧭",
  },
  {
    id: "executive",
    label: "Executive / C-Suite",
    description: "Shaping organisational strategy and culture",
    icon: "⭐",
  },
];

const RATER_TYPES = [
  { id: "self", label: "Self", icon: "🪞", description: "Your own honest assessment" },
  { id: "line_manager", label: "Line Manager", icon: "👆", description: "Your direct manager" },
  { id: "peers", label: "Peers", icon: "🤝", description: "Colleagues at the same level" },
  { id: "direct_reports", label: "Direct Reports", icon: "👥", description: "People you manage" },
  { id: "stakeholders", label: "Stakeholders", icon: "🌐", description: "Key internal/external partners" },
];

const PILLARS = [
  {
    id: "delivery",
    name: "Delivery",
    fullName: "Delivery — Execution & Delivering Results",
    description: "The discipline of getting things done and consistently delivering high-quality outcomes. Setting ambitious goals, working in an organised and committed way, and overcoming obstacles with resilience.",
    color: "#E85D75",
    competencies: [
      { id: "d1", name: "Sound Decision Making", description: "Demonstrates the ability to make sound decisions quickly, even with incomplete information." },
      { id: "d2", name: "Track Record of Delivery", description: "Possesses track record of delivering to set plans and targets." },
      { id: "d3", name: "Perseverance", description: "Demonstrates perseverance in the face of challenges." },
      { id: "d4", name: "Composure & Learning", description: "Handles mistakes and setbacks with composure, learning from them as growth opportunities." },
      { id: "d5", name: "Change Implementation", description: "Implements change initiatives successfully." },
    ],
  },
  {
    id: "capacity",
    name: "Capacity",
    fullName: "Capacity — Thinking & Strategic Acumen",
    description: "The ability to think critically, solve complex problems, and provide clear strategic direction. Moving beyond day-to-day tasks to understand the bigger picture and make sound decisions that balance immediate needs with long-term vision.",
    color: "#F4A261",
    competencies: [
      { id: "c1", name: "Strategic Mindset", description: "Possesses a strategic mindset, with solid understanding of the company's vision and strategy." },
      { id: "c2", name: "Innovation & Challenge", description: "Thinks outside the box and challenges the status quo." },
      { id: "c3", name: "Broader Organisational Impact", description: "Considers the broader impacts on the organisation and others when making decisions; not just own department." },
      { id: "c4", name: "Curiosity & Stakeholder Engagement", description: "Demonstrates curiosity and actively engages stakeholders on topics that are strategic, complex and ambiguous." },
      { id: "c5", name: "Strategic Problem Solving", description: "Actively contributes to problem solving and strategic discussions, especially with senior stakeholders." },
    ],
  },
  {
    id: "people",
    name: "People",
    fullName: "People — Effective Communication & Relationships",
    description: "The ability to communicate effectively and build strong, productive relationships to achieve shared goals. Fostering trust, navigating disagreements constructively, and creating an environment where individuals feel valued and motivated.",
    color: "#2A9D8F",
    competencies: [
      { id: "p1", name: "Effective Delegation", description: "Delegates effectively." },
      { id: "p2", name: "Talent Development", description: "Actively seeks and develops talents." },
      { id: "p3", name: "Peer Collaboration", description: "Collaborates effectively with peers." },
      { id: "p4", name: "Senior Stakeholder Relationships", description: "Builds strong relationships with senior stakeholders." },
      { id: "p5", name: "Conflict Resolution", description: "Resolves conflicts effectively." },
    ],
  },
];

// Flat list for backward compatibility
const COMPETENCIES = PILLARS.flatMap(p => p.competencies);

const RATING_LABELS = {
  1: { label: "No evidence", color: "#E85D75" },
  2: { label: "Little evidence", color: "#F4A261" },
  3: { label: "Satisfactory", color: "#E9C46A" },
  4: { label: "Very Strong", color: "#84A59D" },
  5: { label: "Outstanding", color: "#2A9D8F" },
};

// ── Stakeholder View (accessed via unique link) ───────────────────────────────
function StakeholderView({ token }) {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [strengths, setStrengths] = useState("");
  const [development, setDevelopment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sbFetch(`/leadership_invitations?token=eq.${token}&select=*`);
        if (data && data.length > 0) {
          setInvitation(data[0]);
          if (data[0].completed) setDone(true);
        } else {
          setError("Invalid or expired link.");
        }
      } catch (e) {
        setError("Failed to load assessment.");
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const setRating = (compId, score) => setRatings(prev => ({ ...prev, [compId]: score }));
  const setComment = (compId, text) => setComments(prev => ({ ...prev, [compId]: text }));
  const totalRated = Object.keys(ratings).length;
  const allRated = totalRated === COMPETENCIES.length;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await sbFetch(`/leadership_invitations?token=eq.${token}`, {
        method: "PATCH",
        body: JSON.stringify({ ratings, comments, strengths, development, completed: true, completed_at: new Date().toISOString() }),
      });
      setDone(true);
    } catch (e) {
      console.error("Submit failed:", e);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#94a3b8" }}>Loading your assessment...</p>
    </div>
  );

  if (error) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#E85D75" }}>{error}</p>
    </div>
  );

  if (done) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#e2e8f0", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Thank you!</h2>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Your feedback has been submitted successfully. You can close this window.</p>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 16 }}>— Parity Coaching</p>
      </div>
    </div>
  );

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={styles.moduleTag}>Leadership Brand Assessment</div>
        <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 4 }}>
          {invitation?.rater_role} Feedback
        </h1>
        <p style={styles.subtitle}>
          You've been asked to provide feedback on <strong style={{ color: "#e2e8f0" }}>{invitation?.owner_email?.split("@")[0]}</strong>'s leadership. Rate each behaviour 1–5 and add comments where relevant.
        </p>

        {/* Legend */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {[1,2,3,4,5].map((val) => (
            <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: RATING_LABELS[val].color }}>{val}</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{RATING_LABELS[val].label}</span>
            </div>
          ))}
        </div>

        {/* Pillars */}
        {PILLARS.map((pillar) => (
          <div key={pillar.id} style={{ marginBottom: 32 }}>
            <div style={{ padding: "14px 18px", background: pillar.color + "15", border: `1px solid ${pillar.color}30`, borderRadius: 12, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: pillar.color }}>{pillar.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>{pillar.description}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pillar.competencies.map((comp, ci) => {
                const score = ratings[comp.id] || 0;
                return (
                  <div key={comp.id} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: pillar.color + "22", border: `1px solid ${pillar.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: pillar.color, flexShrink: 0 }}>{ci+1}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{comp.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{comp.description}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[1,2,3,4,5].map((val) => {
                        const selected = score === val;
                        const ri = RATING_LABELS[val];
                        return (
                          <button key={val} onClick={() => setRating(comp.id, val)}
                            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: selected ? `2px solid ${ri.color}` : "1.5px solid rgba(255,255,255,0.08)", background: selected ? ri.color + "22" : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: selected ? ri.color : "#475569" }}>{val}</span>
                            <span style={{ fontSize: 8, color: selected ? ri.color : "#334155", fontWeight: 600 }}>{ri.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <textarea value={comments[comp.id] || ""} onChange={(e) => setComment(comp.id, e.target.value)}
                      placeholder="Add examples or observations (optional)..." rows={2}
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Strengths & Development */}
        <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, marginBottom: 24 }}>
          <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>📝 Additional Feedback</p>
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>What are this person's greatest strengths?</p>
            <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)}
              placeholder="Describe key strengths with specific examples..." rows={3}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>What are this person's main areas for development?</p>
            <textarea value={development} onChange={(e) => setDevelopment(e.target.value)}
              placeholder="Describe areas for growth with specific suggestions..." rows={3}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>

        {!allRated && (
          <div style={{ padding: "12px 16px", background: "rgba(244,162,97,0.08)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 10, textAlign: "center", marginBottom: 12 }}>
            <p style={{ color: "#F4A261", fontSize: 13, margin: 0 }}>Rate all {COMPETENCIES.length} behaviours to submit ({totalRated}/{COMPETENCIES.length} rated)</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={!allRated || submitting}
          style={{ ...styles.btnPrimary, width: "100%", opacity: allRated && !submitting ? 1 : 0.4, cursor: allRated && !submitting ? "pointer" : "not-allowed", marginBottom: 32 }}>
          {submitting ? "Submitting..." : "Submit My Feedback →"}
        </button>
      </div>
    </div>
  );
}

export default function LeadershipAssessment({ onBack, currentUser, coreValues = [] }) {
  // Check if this is a stakeholder link
  const urlToken = new URLSearchParams(window.location.search).get("rate");
  if (urlToken) {
    return <StakeholderView token={urlToken} />;
  }

  const [screen, setScreen] = useState(1); // 1=seniority, 2=raters, 3=rate competencies, 4=report
  const [seniority, setSeniority] = useState(null);
  const [selectedRaters, setSelectedRaters] = useState(["self"]);
  const [currentRater, setCurrentRater] = useState("self");
  const [ratings, setRatings] = useState({}); // { raterId: { competencyId: score } }
  const [comments, setComments] = useState({}); // { raterId: { competencyId: comment } }
  const [strengths, setStrengths] = useState({}); // { raterId: text }
  const [development, setDevelopment] = useState({}); // { raterId: text }
  const [reportLoading, setReportLoading] = useState(false);
  const [consentToShare, setConsentToShare] = useState(false);
  const [inviteEmails, setInviteEmails] = useState({}); // { raterId: email }
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState({}); // { raterId: true }
  const [inviteTokens, setInviteTokens] = useState({}); // { raterId: token }
  const [showInviteScreen, setShowInviteScreen] = useState(false);
  const [report, setReport] = useState(null);

  const toggleRater = (id) => {
    if (id === "self") return; // self always required
    setSelectedRaters((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const setRating = (competencyId, score) => {
    setRatings((prev) => ({
      ...prev,
      [currentRater]: { ...(prev[currentRater] || {}), [competencyId]: score },
    }));
  };

  const setComment = (competencyId, text) => {
    setComments((prev) => ({
      ...prev,
      [currentRater]: { ...(prev[currentRater] || {}), [competencyId]: text },
    }));
  };

  const getComment = (competencyId) => comments[currentRater]?.[competencyId] || "";

  const getRating = (competencyId) => {
    return ratings[currentRater]?.[competencyId] || 0;
  };

  const ratersDone = selectedRaters.filter((r) => {
    const raterRatings = ratings[r] || {};
    return Object.keys(raterRatings).length === COMPETENCIES.length;
  });

  const allRatersDone = ratersDone.length === selectedRaters.length;
  const currentRaterDone = Object.keys(ratings[currentRater] || {}).length === COMPETENCIES.length;

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const selfRatings = ratings["self"] || {};
      const otherRatersData = selectedRaters
        .filter((r) => r !== "self")
        .map((r) => {
          const raterInfo = RATER_TYPES.find((rt) => rt.id === r);
          const raterRatings = ratings[r] || {};
          return { name: raterInfo?.label, ratings: raterRatings };
        });

      const competencyLines = COMPETENCIES.map((c) => {
        const selfScore = selfRatings[c.id] || 0;
        const otherScores = otherRatersData.map((r) => r.ratings[c.id] || 0).filter((s) => s > 0);
        const avgOthers = otherScores.length > 0 ? (otherScores.reduce((a, b) => a + b, 0) / otherScores.length).toFixed(1) : "N/A";
        const selfComment = comments["self"]?.[c.id] || "";
        return `- ${c.name}: Self=${selfScore}/5, Others avg=${avgOthers}/5${selfComment ? `, Comment: "${selfComment}"` : ""}`;
      }).join("\n");

      // Scores by pillar
      const pillarLines = PILLARS.map((p) => {
        const selfAvg = (p.competencies.reduce((sum, c) => sum + (selfRatings[c.id] || 0), 0) / p.competencies.length).toFixed(1);
        return `- ${p.name}: Self avg=${selfAvg}/5`;
      }).join("\n");

      // Strengths & development feedback
      const strengthsFeedback = Object.entries(strengths).map(([r, s]) => `${r}: ${s}`).join("\n");
      const developmentFeedback = Object.entries(development).map(([r, d]) => `${r}: ${d}`).join("\n");

      const valuesContext = coreValues.length > 0
        ? `Their core values are: ${coreValues.join(", ")}.`
        : "";

      // Calculate top 3 and bottom 3 behaviours
      const behaviourScores = COMPETENCIES.map((c) => {
        const selfScore = selfRatings[c.id] || 0;
        const otherScores = otherRatersData.map((r) => r.ratings[c.id] || 0).filter((s) => s > 0);
        const avgOthers = otherScores.length > 0 ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length : selfScore;
        const combinedAvg = otherScores.length > 0 ? (selfScore + avgOthers) / 2 : selfScore;
        return { name: c.name, selfScore, avgOthers: otherScores.length > 0 ? avgOthers : null, combinedAvg };
      }).sort((a, b) => b.combinedAvg - a.combinedAvg);

      const top3 = behaviourScores.slice(0, 3).map(b => b.name);
      const bottom3 = behaviourScores.slice(-3).map(b => b.name);

      const prompt = `You are an executive leadership coach analysing a 360-degree leadership assessment using the Parity Coaching Leadership Competency Framework.

Seniority level: ${SENIORITY_LEVELS.find(s => s.id === seniority)?.label}
${valuesContext}

Scores by Pillar:
${pillarLines}

Individual Behaviour Ratings (Self vs Others):
${competencyLines}

Top 3 highest-rated behaviours: ${top3.join(", ")}
Bottom 3 lowest-rated behaviours: ${bottom3.join(", ")}

${strengthsFeedback ? `Stated Strengths:\n${strengthsFeedback}` : ""}
${developmentFeedback ? `Stated Development Areas:\n${developmentFeedback}` : ""}

Generate a detailed leadership report. Respond ONLY in this exact JSON format with no other text:
{
  "headline": "A 1-sentence leadership brand statement",
  "top3": ["highest rated behaviour 1", "highest rated behaviour 2", "highest rated behaviour 3"],
  "bottom3": ["lowest rated behaviour 1", "lowest rated behaviour 2", "lowest rated behaviour 3"],
  "coaching_goals": [
    {
      "goal": "Coaching goal targeting the first bottom behaviour",
      "based_on": "name of the bottom behaviour",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    },
    {
      "goal": "Coaching goal targeting the second bottom behaviour",
      "based_on": "name of the bottom behaviour",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    },
    {
      "goal": "Coaching goal targeting the third bottom behaviour",
      "based_on": "name of the bottom behaviour",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    }
  ],
  "strengths": ["key strength 1", "key strength 2", "key strength 3"],
  "values_alignment": "2-3 sentences connecting leadership style to core values",
  "comments_summary": "2-3 sentences summarising the qualitative feedback from comments and stated strengths/development areas"
}`;

      const response = await fetch("/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${import.meta.env.VITE_OPENAI_API_KEY}",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.choices[0].message.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setReport(parsed);
      setScreen(4);

      // Send results to coach if user consented
      if (consentToShare) {
        try {
          const seniorityLabel = SENIORITY_LEVELS.find(s => s.id === seniority)?.label || seniority;
          const userEmail = currentUser?.email || "Anonymous";
          const top3text = (parsed.top3 || []).join(", ");
          const bottom3text = (parsed.bottom3 || []).join(", ");
          const goalsText = (parsed.coaching_goals || []).map((g, i) => `${i+1}. ${g.goal} (based on: ${g.based_on})`).join("\n");
          const subject = encodeURIComponent(`Leadership Assessment Results - ${userEmail}`);
          const body = encodeURIComponent(
            `Leadership Assessment Results\n` +
            `=====================================\n` +
            `User: ${userEmail}\n` +
            `Seniority: ${seniorityLabel}\n\n` +
            `Leadership Brand:\n${parsed.headline}\n\n` +
            `Top 3 Behaviours: ${top3text}\n` +
            `Bottom 3 Behaviours: ${bottom3text}\n\n` +
            `Coaching Goals:\n${goalsText}\n\n` +
            `Values Alignment:\n${parsed.values_alignment}\n\n` +
            `Comments Summary:\n${parsed.comments_summary || "N/A"}`
          );
          window.open(`mailto:sayhello@paritycoaching.org?subject=${subject}&body=${body}`, "_blank");
        } catch (e) {
          console.error("Failed to open email:", e);
        }
      }

      // Save leadership assessment to Supabase if user is logged in
      if (currentUser?.email && !currentUser?.localOnly) {
        try {
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
          const SUPABASE_KEY = "sb_publishable_pMMs0XKnoWNgbRtbdYDL7A_NnEI46Y5";
          const existing = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(currentUser.email)}&select=values_data`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
          });
          if (existing.ok) {
            const rows = await existing.json();
            const currentData = rows[0]?.values_data || {};
            const parsed2 = typeof currentData === "string" ? JSON.parse(currentData) : currentData;
            const updatedData = {
              ...parsed2,
              leadershipAssessment: {
                seniority,
                selectedRaters,
                ratings,
                report: parsed,
                completedAt: new Date().toISOString(),
              },
            };
            await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
              method: "POST",
              headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
              },
              body: JSON.stringify({ email: currentUser.email, values_data: updatedData }),
            });
          }
        } catch (e) {
          console.error("Failed to save leadership assessment:", e);
        }
      }
    } catch (err) {
      console.error("Report generation failed:", err);
      setReport({
        headline: "A results-driven leader who balances strategic vision with people-centred execution.",
        top3: ["Sound Decision Making", "Track Record of Delivery", "Peer Collaboration"],
        bottom3: ["Talent Development", "Conflict Resolution", "Strategic Problem Solving"],
        coaching_goals: [
          { goal: "Build a structured talent development practice", based_on: "Talent Development", actions: ["Schedule monthly 1:1 coaching conversations with each team member", "Create individual development plans for your top 3 team members", "Identify one stretch assignment per quarter for high-potential team members"] },
          { goal: "Develop a conflict resolution framework", based_on: "Conflict Resolution", actions: ["Practice the SBI (Situation-Behaviour-Impact) model in difficult conversations", "Seek mediation training or coaching", "Address conflicts within 48 hours rather than letting them escalate"] },
          { goal: "Strengthen strategic contribution with senior stakeholders", based_on: "Strategic Problem Solving", actions: ["Prepare one strategic insight to share at each senior leadership meeting", "Request to join cross-functional strategic working groups", "Read one business strategy book per quarter and share learnings"] },
        ],
        strengths: ["Strong accountability and delivery", "Collaborative relationship building", "Clear communication"],
        values_alignment: "Your leadership style reflects your core values through consistent delivery and authentic relationships.",
        comments_summary: "Feedback highlights strong delivery focus and reliable execution. Development areas centre on people investment and broader strategic influence.",
      });
      setScreen(4);
    } finally {
      setReportLoading(false);
    }
  };

  const sendInvitations = async () => {
    setInviteSending(true);
    await loadEmailJS();
    const nonSelfRaters = selectedRaters.filter(r => r !== "self");
    const newTokens = {};
    const newSent = {};

    for (const raterId of nonSelfRaters) {
      const email = inviteEmails[raterId]?.trim();
      if (!email) continue;
      try {
        // Create invitation in Supabase
        const raterInfo = RATER_TYPES.find(r => r.id === raterId);
        const result = await sbFetch("/leadership_invitations", {
          method: "POST",
          body: JSON.stringify({
            owner_email: currentUser?.email || "anonymous",
            rater_role: raterInfo?.label || raterId,
            rater_email: email,
          }),
        });
        const token = result?.[0]?.token;
        if (token) {
          newTokens[raterId] = token;
          // Send email via EmailJS
          const assessmentLink = `${window.location.origin}?rate=${token}`;
          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: currentUser?.email?.split("@")[0] || "Someone",
            rater_role: raterInfo?.label || raterId,
            assessment_link: assessmentLink,
            email: email,
          });
          newSent[raterId] = true;
        }
      } catch (e) {
        console.error("Failed to send invite to", email, e);
      }
    }
    setInviteTokens(prev => ({ ...prev, ...newTokens }));
    setInviteSent(prev => ({ ...prev, ...newSent }));
    setInviteSending(false);
  };

  const seniorityLevel = SENIORITY_LEVELS.find((s) => s.id === seniority);

  // ── Invite Screen (modal overlay) ────────────────────────────────────────────
  if (showInviteScreen) {
    const nonSelfRaters = selectedRaters.filter(r => r !== "self");
    const allSent = nonSelfRaters.every(r => inviteSent[r]);
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <button onClick={() => setShowInviteScreen(false)} style={styles.backBtn}>← Back</button>
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>
          <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 8 }}>Invite Your Stakeholders</h1>
          <p style={styles.subtitle}>Enter the email address for each rater. They'll receive a personalised link to complete their section privately.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {nonSelfRaters.map((raterId) => {
              const raterInfo = RATER_TYPES.find(r => r.id === raterId);
              const sent = inviteSent[raterId];
              return (
                <div key={raterId} style={{ padding: "16px 18px", background: sent ? "rgba(42,157,143,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${sent ? "rgba(42,157,143,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{raterInfo?.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{raterInfo?.label}</span>
                    {sent && <span style={{ fontSize: 11, color: "#2A9D8F", fontWeight: 600, marginLeft: "auto" }}>✓ Invite sent</span>}
                  </div>
                  {!sent && (
                    <input
                      type="email"
                      value={inviteEmails[raterId] || ""}
                      onChange={(e) => setInviteEmails(prev => ({ ...prev, [raterId]: e.target.value }))}
                      placeholder={`${raterInfo?.label}'s email address...`}
                      style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {!allSent && (
            <button onClick={sendInvitations} disabled={inviteSending}
              style={{ ...styles.btnPrimary, width: "100%", marginBottom: 12, opacity: inviteSending ? 0.7 : 1 }}>
              {inviteSending ? "Sending invitations..." : `Send ${nonSelfRaters.length} Invitation${nonSelfRaters.length !== 1 ? "s" : ""} →`}
            </button>
          )}

          <button onClick={() => { setShowInviteScreen(false); setCurrentRater("self"); setScreen(3); }}
            style={{ ...styles.btnPrimary, width: "100%", background: allSent ? "#2A9D8F" : "rgba(255,255,255,0.06)", color: allSent ? "#fff" : "#94a3b8", border: allSent ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
            {allSent ? "Continue to Rate Yourself →" : "Skip — Rate Yourself Now →"}
          </button>

          {allSent && (
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 12 }}>
              Stakeholders will complete their sections independently. You can generate the report once they're done.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Screen 1: Seniority ──────────────────────────────────────────────────────
  if (screen === 1) return (
    <div style={styles.root}>
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backBtn}>← Back to Core Values</button>
        <div style={styles.moduleTag}>Leadership Brand Assessment</div>
        <h1 style={styles.title}>What is your seniority level?</h1>
        <p style={styles.subtitle}>This helps us tailor the competency framework to your role.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {SENIORITY_LEVELS.map((level) => {
            const selected = seniority === level.id;
            return (
              <button key={level.id} onClick={() => setSeniority(level.id)}
                style={{ padding: "18px 20px", borderRadius: 14, border: selected ? "2px solid #2A9D8F" : "1.5px solid rgba(255,255,255,0.1)", background: selected ? "rgba(42,157,143,0.12)" : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{level.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: selected ? "#e2e8f0" : "#cbd5e1" }}>{level.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{level.description}</p>
                </div>
                {selected && <span style={{ marginLeft: "auto", color: "#2A9D8F", fontSize: 20 }}>✓</span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => setScreen(2)} disabled={!seniority}
          style={{ ...styles.btnPrimary, width: "100%", opacity: seniority ? 1 : 0.4, cursor: seniority ? "pointer" : "not-allowed" }}>
          Next: Select Raters →
        </button>
      </div>
    </div>
  );

  // ── Screen 2: Raters ─────────────────────────────────────────────────────────
  if (screen === 2) return (
    <div style={styles.root}>
      <div style={styles.container}>
        <button onClick={() => setScreen(1)} style={styles.backBtn}>← Back</button>
        <div style={styles.moduleTag}>Leadership Brand Assessment</div>
        <h1 style={styles.title}>Who is completing this assessment?</h1>
        <p style={styles.subtitle}>Select all that apply. You can complete each perspective separately. <strong style={{ color: "#2A9D8F" }}>Self</strong> is always included.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {RATER_TYPES.map((rater) => {
            const selected = selectedRaters.includes(rater.id);
            const isRequired = rater.id === "self";
            return (
              <button key={rater.id} onClick={() => toggleRater(rater.id)}
                style={{ padding: "14px 18px", borderRadius: 12, border: selected ? "2px solid #2A9D8F" : "1.5px solid rgba(255,255,255,0.1)", background: selected ? "rgba(42,157,143,0.1)" : "rgba(255,255,255,0.03)", cursor: isRequired ? "default" : "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{rater.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: selected ? "#e2e8f0" : "#94a3b8" }}>{rater.label} {isRequired && <span style={{ fontSize: 10, color: "#2A9D8F", fontWeight: 600 }}>(required)</span>}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{rater.description}</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: selected ? "2px solid #2A9D8F" : "2px solid #475569", background: selected ? "#2A9D8F" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, flexShrink: 0 }}>
                  {selected ? "✓" : ""}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={() => {
          const nonSelf = selectedRaters.filter(r => r !== "self");
          if (nonSelf.length > 0) { setShowInviteScreen(true); }
          else { setCurrentRater("self"); setScreen(3); }
        }}
          style={{ ...styles.btnPrimary, width: "100%" }}>
          Next: {selectedRaters.filter(r => r !== "self").length > 0 ? "Set Up Invitations →" : "Start Rating →"}
        </button>
      </div>
    </div>
  );

  // ── Screen 3: Rate Competencies ───────────────────────────────────────────────
  if (screen === 3) {
    const raterInfo = RATER_TYPES.find((r) => r.id === currentRater);
    const currentRaterIndex = selectedRaters.indexOf(currentRater);
    const nextRater = selectedRaters[currentRaterIndex + 1];

    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <button onClick={() => setScreen(2)} style={styles.backBtn}>← Back</button>
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>

          {/* Rater tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
            {selectedRaters.map((r) => {
              const rt = RATER_TYPES.find((x) => x.id === r);
              const done = Object.keys(ratings[r] || {}).length === COMPETENCIES.length;
              const active = currentRater === r;
              return (
                <button key={r} onClick={() => setCurrentRater(r)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: active ? "2px solid #2A9D8F" : "1.5px solid rgba(255,255,255,0.1)", background: active ? "rgba(42,157,143,0.15)" : "rgba(255,255,255,0.04)", color: active ? "#2A9D8F" : done ? "#64748b" : "#94a3b8", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                  {rt?.icon} {rt?.label} {done && "✓"}
                </button>
              );
            })}
          </div>

          <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 4 }}>
            {raterInfo?.icon} {currentRater === "self" ? "Rate Yourself" : `Rate as ${raterInfo?.label}`}
          </h1>
          <p style={styles.subtitle}>Rate each behaviour 1–5. Add comments or examples where relevant.</p>

          {/* Legend */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
            {[1,2,3,4,5].map((val) => (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: RATING_LABELS[val].color }}>{val}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{RATING_LABELS[val].label}</span>
              </div>
            ))}
          </div>

          {/* Pillars */}
          {PILLARS.map((pillar) => (
            <div key={pillar.id} style={{ marginBottom: 32 }}>
              <div style={{ padding: "14px 18px", background: pillar.color + "15", border: `1px solid ${pillar.color}30`, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: pillar.color }}>{pillar.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{pillar.description}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {pillar.competencies.map((comp, ci) => {
                  const score = getRating(comp.id);
                  const comment = getComment(comp.id);
                  return (
                    <div key={comp.id} style={{ padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: pillar.color + "22", border: `1px solid ${pillar.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: pillar.color, flexShrink: 0 }}>{ci + 1}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{comp.name}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>{comp.description}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map((val) => {
                          const selected = score === val;
                          const ratingInfo = RATING_LABELS[val];
                          return (
                            <button key={val} onClick={() => setRating(comp.id, val)}
                              style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: selected ? `2px solid ${ratingInfo.color}` : "1.5px solid rgba(255,255,255,0.08)", background: selected ? ratingInfo.color + "22" : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: selected ? ratingInfo.color : "#475569" }}>{val}</span>
                              <span style={{ fontSize: 9, color: selected ? ratingInfo.color : "#334155", fontWeight: 600 }}>{ratingInfo.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <textarea value={comment} onChange={(e) => setComment(comp.id, e.target.value)}
                        placeholder="Add specific examples or observations (optional)..." rows={2}
                        style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Strengths & Development questions */}
          <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, marginBottom: 24 }}>
            <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>📝 Additional Feedback</p>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {currentRater === "self" ? "What are your greatest strengths? Please describe." : "What are this person's greatest strengths? Please describe."}
              </p>
              <textarea value={strengths[currentRater] || ""} onChange={(e) => setStrengths(prev => ({ ...prev, [currentRater]: e.target.value }))}
                placeholder="Describe key strengths with specific examples..." rows={3}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {currentRater === "self" ? "What are your main areas for development? Please describe." : "What are this person's main areas for development? Please describe."}
              </p>
              <textarea value={development[currentRater] || ""} onChange={(e) => setDevelopment(prev => ({ ...prev, [currentRater]: e.target.value }))}
                placeholder="Describe areas for growth with specific suggestions..." rows={3}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>

          {currentRaterDone ? (
            nextRater ? (
              <button onClick={() => setCurrentRater(nextRater)} style={{ ...styles.btnPrimary, width: "100%" }}>
                Next: Rate as {RATER_TYPES.find(r => r.id === nextRater)?.label} →
              </button>
            ) : (
              <>
                {/* Consent checkbox */}
                <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <input type="checkbox" id="consent" checked={consentToShare} onChange={(e) => setConsentToShare(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, cursor: "pointer", flexShrink: 0, accentColor: "#2A9D8F" }} />
                  <label htmlFor="consent" style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, cursor: "pointer" }}>
                    I consent to send a copy of my results to <strong style={{ color: "#e2e8f0" }}>sayhello@paritycoaching.org</strong> so a Parity Coaching coach can review and follow up with me.
                  </label>
                </div>
                <button onClick={generateReport} disabled={reportLoading}
                  style={{ ...styles.btnPrimary, width: "100%", background: "linear-gradient(135deg, #E85D75, #264653)", opacity: reportLoading ? 0.7 : 1 }}>
                  {reportLoading ? "Generating your report..." : "Generate My Leadership Report →"}
                </button>
              </>
            )
          ) : (
            <div style={{ padding: "12px 16px", background: "rgba(244,162,97,0.08)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 10, textAlign: "center" }}>
              <p style={{ color: "#F4A261", fontSize: 13, margin: 0 }}>
                Rate all {COMPETENCIES.length} behaviours to continue ({Object.keys(ratings[currentRater] || {}).length}/{COMPETENCIES.length} rated)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Screen 4: Report ─────────────────────────────────────────────────────────
  if (screen === 4 && report) {
    const selfRatings = ratings["self"] || {};
    const otherRaters = selectedRaters.filter((r) => r !== "self");

    const getAvgOthers = (competencyId) => {
      const scores = otherRaters.map((r) => ratings[r]?.[competencyId] || 0).filter((s) => s > 0);
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    };

    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <button onClick={() => setScreen(3)} style={styles.backBtn}>← Back to Ratings</button>
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>

          {/* Headline */}
          <div style={{ padding: "24px", background: "linear-gradient(135deg, rgba(42,157,143,0.15), rgba(38,70,83,0.25))", border: "1px solid rgba(42,157,143,0.3)", borderRadius: 16, marginBottom: 24 }}>
            <p style={{ color: "#2A9D8F", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Your Leadership Brand</p>
            <p style={{ color: "#e2e8f0", fontSize: 16, fontStyle: "italic", lineHeight: 1.6, margin: 0, fontWeight: 600 }}>"{report.headline}"</p>
          </div>

          {/* Pillar summary scores */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {PILLARS.map((pillar) => {
              const selfAvg = (pillar.competencies.reduce((sum, c) => sum + (selfRatings[c.id] || 0), 0) / pillar.competencies.length).toFixed(1);
              const otherAvg = otherRaters.length > 0 ? (pillar.competencies.reduce((sum, c) => { const scores = otherRaters.map(r => ratings[r]?.[c.id] || 0).filter(s => s > 0); return sum + (scores.length > 0 ? scores.reduce((a,b)=>a+b,0)/scores.length : 0); }, 0) / pillar.competencies.length).toFixed(1) : null;
              return (
                <div key={pillar.id} style={{ flex: 1, minWidth: 120, padding: "14px", background: pillar.color + "12", border: `1px solid ${pillar.color}30`, borderRadius: 12, textAlign: "center" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: pillar.color }}>{pillar.name}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e2e8f0" }}>{selfAvg}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>Self / 5.0</p>
                  {otherAvg && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Others: {otherAvg}</p>}
                </div>
              );
            })}
          </div>

          {/* Behaviour breakdown by pillar */}
          <div style={{ marginBottom: 24 }}>
            {PILLARS.map((pillar) => (
              <div key={pillar.id} style={{ marginBottom: 24 }}>
                <p style={{ color: pillar.color, fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{pillar.name}</p>
            {pillar.competencies.map((comp, i) => {
              const selfScore = selfRatings[comp.id] || 0;
              const avgOthers = getAvgOthers(comp.id);
              const gap = avgOthers !== null ? (avgOthers - selfScore).toFixed(1) : null;
              return (
                <div key={comp.id} style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{comp.name}</span>
                    {gap !== null && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: Math.abs(gap) <= 0.5 ? "rgba(42,157,143,0.15)" : Math.abs(gap) <= 1 ? "rgba(244,162,97,0.15)" : "rgba(232,93,117,0.15)", color: Math.abs(gap) <= 0.5 ? "#2A9D8F" : Math.abs(gap) <= 1 ? "#F4A261" : "#E85D75" }}>
                        {gap > 0 ? "+" : ""}{gap} gap
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[["Self", selfScore, 0.6], avgOthers !== null ? ["Others avg", avgOthers, 1] : null].filter(Boolean).map(([label, val, opacity]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 70, fontSize: 10, color: "#64748b" }}>{label}</span>
                        <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: PALETTE[i % PALETTE.length], borderRadius: 4, opacity, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ width: 24, fontSize: 10, color: "#94a3b8", textAlign: "right" }}>{typeof val === "number" ? val.toFixed(1) : val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
              </div>
            ))}
          </div>

          {/* Top 3 / Bottom 3 */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, padding: "18px 20px", background: "rgba(42,157,143,0.08)", border: "1px solid rgba(42,157,143,0.2)", borderRadius: 12 }}>
              <p style={{ color: "#2A9D8F", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>🏆 Top 3 Behaviours</p>
              {(report.top3 || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#2A9D8F", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0" }}>{s}</p>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: "18px 20px", background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", borderRadius: 12 }}>
              <p style={{ color: "#E85D75", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>📈 Bottom 3 Behaviours</p>
              {(report.bottom3 || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#E85D75", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0" }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coaching Goals from Bottom 3 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>🎯 AI-Generated Coaching Goals</p>
            <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 14px" }}>Based on your bottom 3 behaviours, here are 3 suggested coaching goals with actions.</p>
            {(report.coaching_goals || []).map((goal, i) => (
              <div key={i} style={{ padding: "18px 20px", background: "rgba(244,162,97,0.06)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: "#F4A261", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{goal.goal}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>Based on: {goal.based_on}</p>
                  </div>
                </div>
                <div style={{ paddingLeft: 34 }}>
                  {(goal.actions || []).map((action, ai) => (
                    <div key={ai} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: "#F4A261", fontSize: 12, flexShrink: 0 }}>•</span>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Key Strengths */}
          <div style={{ padding: "18px 20px", background: "rgba(42,157,143,0.08)", border: "1px solid rgba(42,157,143,0.2)", borderRadius: 12, marginBottom: 16 }}>
            <p style={{ color: "#2A9D8F", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>✨ Key Strengths</p>
            {(report.strengths || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span style={{ color: "#2A9D8F", fontSize: 14, flexShrink: 0 }}>→</span>
                <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0" }}>{s}</p>
              </div>
            ))}
          </div>

          {/* Values alignment */}
          {coreValues.length > 0 && (
            <div style={{ padding: "18px 20px", background: "rgba(123,45,139,0.08)", border: "1px solid rgba(123,45,139,0.2)", borderRadius: 12, marginBottom: 16 }}>
              <p style={{ color: "#7B2D8B", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>💜 Values Alignment</p>
              <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>{report.values_alignment}</p>
            </div>
          )}

          {/* Comments summary */}
          {report.comments_summary && (
            <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, marginBottom: 16 }}>
              <p style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>💬 Qualitative Feedback Summary</p>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{report.comments_summary}</p>
            </div>
          )}

          {/* Book a session */}
          <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, rgba(42,157,143,0.12), rgba(38,70,83,0.2))", border: "1px solid rgba(42,157,143,0.25)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
            <div>
              <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Discuss your results with a coach</p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>Book a 1:1 session to debrief your leadership brand report.</p>
            </div>
            <a href="https://www.paritycoaching.org" target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 20px", background: "#2A9D8F", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
              Book a Session →
            </a>
          </div>

          <button onClick={onBack} style={{ ...styles.btnSecondary, width: "100%" }}>
            ← Back to Core Values Exercise
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  root: { minHeight: "100vh", background: "#0f172a", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#e2e8f0", padding: "20px 0" },
  container: { maxWidth: 600, margin: "0 auto", padding: "0 20px" },
  backBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16, padding: 0 },
  moduleTag: { display: "inline-block", padding: "4px 12px", background: "rgba(123,45,139,0.15)", border: "1px solid rgba(123,45,139,0.3)", borderRadius: 20, color: "#7B2D8B", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 800, color: "#e2e8f0", margin: "0 0 8px", lineHeight: 1.2 },
  subtitle: { fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 },
  btnPrimary: { padding: "13px 24px", background: "#2A9D8F", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  btnSecondary: { padding: "12px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#94a3b8", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
};
