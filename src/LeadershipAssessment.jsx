import { useState, useEffect } from "react";

const EMAILJS_SERVICE_ID = "service_zcfpyep";
const EMAILJS_TEMPLATE_ID = "template_18vkz3q";
const EMAILJS_PUBLIC_KEY = "BGbyIb-UT_3yGOjVY";
const SUPABASE_URL = "https://spowxgwxglvljpatdtzi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwb3d4Z3d4Z2x2bGpwYXRkdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDY3MjMsImV4cCI6MjA5NDk4MjcyM30.-J4VichpUy_jdfmSJYJ0PqYA54mMzW1eOBBj08ZZ88c";

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
  "#5B2D8E","#E0A84A","#C9843A","#2D1B4E","#C9843A",
  "#4A2D6E","#457B9D","#F28482","#C9843A","#F7B267"
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
  { id: "self", label: "Self", icon: "", description: "Your own honest assessment" },
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
    color: "#5B2D8E",
    competencies: [
      { id: "d2", name: "Track Record of Delivery", description: "Possesses track record of delivering to set plans and targets." },
      { id: "d1", name: "Sound Decision Making", description: "Demonstrates the ability to make sound decisions quickly, even with incomplete information." },
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
    color: "#E0A84A",
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
    color: "#5B2D8E",
    competencies: [
      { id: "p1", name: "Effective Delegation", description: "Delegates effectively (e.g. delegates overall responsibilities rather than just individual tasks, adopts a coaching approach rather than just provide answers)." },
      { id: "p2", name: "Talent Development", description: "Attracts and develops talents, to build the overall team capabilities." },
      { id: "p3", name: "Peer Collaboration", description: "Collaborates effectively with peers." },
      { id: "p4", name: "Senior Stakeholder Relationships", description: "Builds strong relationships with senior stakeholders." },
      { id: "p5", name: "Conflict Resolution", description: "Resolves conflicts effectively (with peers and within own team)." },
    ],
  },
];

// Flat list for backward compatibility
const COMPETENCIES = PILLARS.flatMap(p => p.competencies);

const RATING_LABELS = {
  1: { label: "No evidence", color: "#5B2D8E" },
  2: { label: "Little evidence", color: "#E0A84A" },
  3: { label: "Satisfactory", color: "#C9843A" },
  4: { label: "Very Strong", color: "#C9843A" },
  5: { label: "Outstanding", color: "#C9843A" },
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
      <p style={{ color: "#8B5A1E" }}>Loading your assessment...</p>
    </div>
  );

  if (error) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#5B2D8E" }}>{error}</p>
    </div>
  );

  if (done) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#1a0a2e", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Thank you!</h2>
        <p style={{ color: "#8B5A1E", fontSize: 14 }}>Your feedback has been submitted successfully. You can close this window.</p>
        <p style={{ color: "#8B7B9B", fontSize: 12, marginTop: 16 }}>— Parity Coaching</p>
      </div>
    </div>
  );

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #C9843A" }}>
          <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 44, objectFit: "contain" }} />
        </div>
        <div style={styles.moduleTag}>Leadership Brand Assessment</div>
        <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 4 }}>
          {invitation?.rater_role} Feedback
        </h1>
        <p style={styles.subtitle}>
          You've been asked to provide feedback on <strong style={{ color: "#1a0a2e" }}>{invitation?.owner_email?.split("@")[0]}</strong>'s leadership. Rate each behaviour 1–5 and add comments where relevant.
        </p>

        {/* Legend */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {[1,2,3,4,5].map((val) => (
            <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(201,132,58,0.1)", borderRadius: 6, border: "1px solid rgba(201,132,58,0.3)" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#C9843A" }}>{val}</span>
              <span style={{ fontSize: 11, color: "#C9843A" }}>{RATING_LABELS[val].label}</span>
            </div>
          ))}
        </div>

        {/* Pillars */}
        {PILLARS.map((pillar) => (
          <div key={pillar.id} style={{ marginBottom: 32 }}>
            <div style={{ padding: "14px 18px", background: pillar.color + "15", border: `1px solid ${pillar.color}30`, borderRadius: 12, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: pillar.color }}>{pillar.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: pillar.id === "capacity" ? "#8B5A1E" : pillar.color + "cc" }}>{pillar.description}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pillar.competencies.map((comp, ci) => {
                const score = ratings[comp.id] || 0;
                return (
                  <div key={comp.id} style={{ padding: "14px 16px", background: pillar.color + "0d", border: "1px solid " + pillar.color + "30", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: pillar.color + "22", border: `1px solid ${pillar.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: pillar.color, flexShrink: 0 }}>{ci+1}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: pillar.color }}>{comp.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: pillar.id === "capacity" ? "#8B5A1E" : pillar.color + "cc" }}>{comp.description}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[1,2,3,4,5].map((val) => {
                        const selected = score === val;
                        const ri = RATING_LABELS[val];
                        return (
                          <button key={val} onClick={() => setRating(comp.id, val)}
                            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: selected ? `2px solid ${ri.color}` : `1px solid ${pillar.color}44`, background: selected ? ri.color + "22" : pillar.color + "08", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: pillar.id === "capacity" ? "#C9843A" : pillar.color }}>{val}</span>
                            <span style={{ fontSize: 8, color: pillar.id === "capacity" ? "#8B5A1E" : pillar.color + "aa", fontWeight: 600 }}>{ri.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <textarea value={comments[comp.id] || ""} onChange={(e) => setComment(comp.id, e.target.value)}
                      placeholder="Add examples or observations (optional)..." rows={2}
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(45,27,78,0.05)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 8, color: "#8B5A1E", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Strengths & Development */}
        <div style={{ padding: "20px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 14, marginBottom: 24 }}>
          <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>📝 Additional Feedback</p>
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: "#8B5A1E", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>What are this person's greatest strengths?</p>
            <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)}
              placeholder="Describe key strengths with specific examples..." rows={3}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <p style={{ color: "#8B5A1E", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>What are this person's main areas for development?</p>
            <textarea value={development} onChange={(e) => setDevelopment(e.target.value)}
              placeholder="Describe areas for growth with specific suggestions..." rows={3}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>

        {!allRated && (
          <div style={{ padding: "12px 16px", background: "rgba(244,162,97,0.08)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 10, textAlign: "center", marginBottom: 12 }}>
            <p style={{ color: "#E0A84A", fontSize: 13, margin: 0 }}>Rate all {COMPETENCIES.length} behaviours to submit ({totalRated}/{COMPETENCIES.length} rated)</p>
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
  const [inviteTokens, setInviteTokens] = useState({}); // reset each session
  const [stakeholderData, setStakeholderData] = useState({}); // { raterId: { ratings, comments, strengths, development } }
  const [loadingStakeholders, setLoadingStakeholders] = useState(false);

  const loadStakeholderResponses = async () => {
    setLoadingStakeholders(true);
    try {
      // Query by owner email if logged in, otherwise query by rater emails we invited
      let data = [];
      if (currentUser?.email) {
        data = await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(currentUser.email)}&completed=eq.true&select=*`) || [];
      }
      // Also check by individual tokens we have stored (catches anonymous invitations)
      const tokens = Object.values(inviteTokens);
      if (tokens.length > 0) {
        const tokenResults = await Promise.all(tokens.map(t => sbFetch(`/leadership_invitations?token=eq.${t}&completed=eq.true&select=*`).catch(() => [])));
        const tokenData = tokenResults.flat().filter(Boolean);
        // Merge, avoiding duplicates
        const existingIds = new Set(data.map(d => d.id));
        tokenData.forEach(d => { if (!existingIds.has(d.id)) data.push(d); });
      }
      if (data && data.length > 0) {
        const newData = {};
        data.forEach((inv) => {
          const roleKey = inv.rater_role.toLowerCase().replace(/\s+/g, '_');
          newData[roleKey] = {
            role: inv.rater_role,
            ratings: inv.ratings || {},
            comments: inv.comments || {},
            strengths: inv.strengths || "",
            development: inv.development || "",
          };
        });
        setStakeholderData(newData);
      }
    } catch (e) {
      console.error("Failed to load stakeholder responses:", e);
    }
    setLoadingStakeholders(false);
  };
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
  const selfExcluded = ["p1", "p2"];
  const requiredForSelf = COMPETENCIES.filter(c => !selfExcluded.includes(c.id)).length;
  const currentRaterDone = currentRater === "self" 
    ? Object.keys(ratings["self"] || {}).filter(k => !selfExcluded.includes(k)).length >= requiredForSelf
    : Object.keys(ratings[currentRater] || {}).length === COMPETENCIES.length;

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const selfRatings = ratings["self"] || {};

      // Combine local ratings with loaded stakeholder data from Supabase
      const allRaterData = [
        { name: "Self", ratings: selfRatings, comments: comments["self"] || {}, strengths: strengths["self"] || "", development: development["self"] || "" },
        // Local raters (if rated on same device)
        ...selectedRaters.filter(r => r !== "self").map(r => {
          const raterInfo = RATER_TYPES.find(rt => rt.id === r);
          return { name: raterInfo?.label || r, ratings: ratings[r] || {}, comments: comments[r] || {}, strengths: strengths[r] || "", development: development[r] || "" };
        }).filter(r => Object.keys(r.ratings).length > 0),
        // Stakeholders who completed via email link
        ...Object.values(stakeholderData),
      ];

      const otherRaters = allRaterData.filter(r => r.name !== "Self");

      // Detailed competency lines including each stakeholder group
      const competencyLines = COMPETENCIES.map((c) => {
        const selfScore = selfRatings[c.id] || 0;
        const otherScores = otherRaters.map(r => ({ name: r.name, score: r.ratings[c.id] || 0, comment: r.comments?.[c.id] || "" })).filter(r => r.score > 0);
        const avgOthers = otherScores.length > 0 ? (otherScores.reduce((a, b) => a + b.score, 0) / otherScores.length).toFixed(1) : "N/A";
        const gap = avgOthers !== "N/A" ? (parseFloat(avgOthers) - selfScore).toFixed(1) : "N/A";
        const scoreBreakdown = otherScores.map(r => `${r.name}=${r.score}`).join(", ");
        const allComments = otherScores.filter(r => r.comment).map(r => `${r.name}: "${r.comment}"`).join("; ");
        const selfComment = comments["self"]?.[c.id] || "";
        return `- ${c.name}: Self=${selfScore}/5${scoreBreakdown ? `, [${scoreBreakdown}]` : ""}, Others avg=${avgOthers}/5, Gap=${gap}${selfComment ? `\n  Self comment: "${selfComment}"` : ""}${allComments ? `\n  Stakeholder comments: ${allComments}` : ""}`;
      }).join("\n");

      // Pillar scores with stakeholder breakdown
      const pillarLines = PILLARS.map((p) => {
        const selfAvg = (p.competencies.reduce((sum, c) => sum + (selfRatings[c.id] || 0), 0) / p.competencies.length).toFixed(1);
        const stakeholderBreakdown = otherRaters.map(r => {
          const scores = p.competencies.map(c => r.ratings[c.id] || 0).filter(s => s > 0);
          if (scores.length === 0) return null;
          return `${r.name}=${(scores.reduce((a,b) => a+b, 0)/scores.length).toFixed(1)}`;
        }).filter(Boolean).join(", ");
        return `- ${p.name}: Self=${selfAvg}/5${stakeholderBreakdown ? ` [${stakeholderBreakdown}]` : ""}`;
      }).join("\n");

      // All strengths and development feedback from all raters
      const strengthsFeedback = allRaterData.filter(r => r.strengths?.trim()).map(r => `${r.name}: ${r.strengths}`).join("\n");
      const developmentFeedback = allRaterData.filter(r => r.development?.trim()).map(r => `${r.name}: ${r.development}`).join("\n");

      const valuesContext = coreValues.length > 0
        ? `Their core values are: ${coreValues.join(", ")}.`
        : "";

      // Calculate top 3 and bottom 3 using ALL rater scores (self + stakeholders)
      const behaviourScores = COMPETENCIES.map((c) => {
        const selfScore = selfRatings[c.id] || 0;
        const otherScores = otherRaters.map(r => r.ratings[c.id] || 0).filter(s => s > 0);
        const avgOthers = otherScores.length > 0 ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length : selfScore;
        const combinedAvg = otherScores.length > 0 ? (selfScore + avgOthers) / 2 : selfScore;
        return { name: c.name, selfScore, avgOthers: otherScores.length > 0 ? avgOthers : null, combinedAvg };
      }).sort((a, b) => b.combinedAvg - a.combinedAvg);

      const top3 = behaviourScores.slice(0, 3).map(b => b.name);
      const bottom3 = behaviourScores.slice(-3).map(b => b.name);

      const stakeholderCount = otherRaters.length;
      const prompt = `You are an executive leadership coach analysing a 360-degree leadership assessment using the Parity Coaching Leadership Competency Framework.

Seniority level: ${SENIORITY_LEVELS.find(s => s.id === seniority)?.label}
${valuesContext}
Number of stakeholders who provided feedback: ${stakeholderCount} (${otherRaters.map(r => r.name).join(", ") || "Self only"})

Pillar Scores (Self vs each stakeholder group):
${pillarLines}

Individual Behaviour Ratings with Stakeholder Breakdown and Comments:
${competencyLines}

Top 3 highest-rated behaviours (combined Self + Stakeholder avg): ${top3.join(", ")}
Bottom 3 lowest-rated behaviours (combined Self + Stakeholder avg): ${bottom3.join(", ")}

${strengthsFeedback ? `Qualitative Strengths Feedback:\n${strengthsFeedback}` : ""}
${developmentFeedback ? `Qualitative Development Feedback:\n${developmentFeedback}` : ""}

IMPORTANT: Base your coaching goals primarily on the STAKEHOLDER feedback and comments, not just self-assessment. Note any significant gaps between self-perception and stakeholder scores. Reference specific stakeholder comments in your suggestions where possible.

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
          "Authorization": "Bearer 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",
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
          const SUPABASE_URL = "https://spowxgwxglvljpatdtzi.supabase.co";
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
            owner_email: currentUser?.email || "",
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
    const merged = { ...inviteTokens, ...newTokens };
    setInviteTokens(merged);
    try { localStorage.setItem('cv_invite_tokens', JSON.stringify(merged)); } catch (e) {}
    setInviteSent(prev => ({ ...prev, ...newSent }));
    setInviteSending(false);
  };

  const generatePDFReport = () => {
    const selfRatings = ratings["self"] || {};
    const allRaters = [
      { key: "self", label: "Self", ratings: selfRatings, comments: comments["self"] || {}, strengths: strengths["self"] || "", development: development["self"] || "" },
      ...Object.values(stakeholderData),
    ];

    const getRaterAvg = (raterRatings, pillarComps) => {
      const scores = pillarComps.map(c => raterRatings[c.id] || 0).filter(s => s > 0);
      return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "N/A";
    };

    const ratingLabel = (score) => {
      if (!score || score === "N/A") return "";
      const n = parseFloat(score);
      if (n >= 4.5) return "Outstanding";
      if (n >= 3.5) return "Very Strong";
      if (n >= 2.5) return "Satisfactory";
      if (n >= 1.5) return "Little evidence";
      return "No evidence";
    };

    const pillarColors = { delivery: "#5B2D8E", capacity: "#E0A84A", people: "#C9843A" };

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Leadership Brand Assessment Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Raleway', 'Lato', 'Arial', sans-serif; color: #2D1B4E; background: white; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  @media print { .page { padding: 20px; } .no-print { display: none; } }
  
  .header { background: #EDE8F5; color: #2D1B4E; padding: 40px; margin: -40px -40px 40px; text-align: center; }
  .header img { height: 50px; object-fit: contain; margin-bottom: 16px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #C9843A; }
  .header p { font-size: 13px; color: #4A2D6E; }
  .header .user { font-size: 18px; font-weight: 600; margin: 16px 0 4px; opacity: 0.9; }
  
  .section { margin-bottom: 32px; }
  .section-title { font-size: 16px; font-weight: 800; color: #1a1a2e; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
  
  .headline-box { background: #FDF8F3; border-left: 4px solid #C9843A; padding: 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0; }
  .headline-box p { font-size: 16px; font-style: italic; color: #1a1a2e; line-height: 1.6; font-weight: 600; }
  
  .pillar-cards { display: flex; gap: 16px; margin-bottom: 24px; }
  .pillar-card { flex: 1; padding: 16px; border-radius: 8px; text-align: center; }
  .pillar-card h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .pillar-card .score { font-size: 32px; font-weight: 800; }
  .pillar-card .label { font-size: 10px; margin-top: 4px; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th { background: #2D1B4E; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .pillar-row td { background: #f1f5f9; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .score-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; }
  .score-1 { background: #fee2e2; color: #5B2D8E; }
  .score-2 { background: rgba(201,132,58,0.12); color: #8B4A1E; }
  .score-3 { background: rgba(201,132,58,0.18); color: #C9843A; }
  .score-4 { background: #d1fae5; color: #C9843A; }
  .score-5 { background: rgba(91,45,142,0.2); color: #2D1B4E; }
  
  .top-bottom { display: flex; gap: 16px; margin-bottom: 24px; }
  .top-box { flex: 1; padding: 16px; border-radius: 8px; }
  .top-box h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
  .top-box .item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .top-box .num { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; flex-shrink: 0; }
  
  .coaching-goal { padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 12px; }
  .coaching-goal h4 { font-size: 13px; font-weight: 700; margin-bottom: 4px; color: #92400e; }
  .coaching-goal .based-on { font-size: 11px; color: #b45309; margin-bottom: 10px; }
  .coaching-goal ul { padding-left: 16px; }
  .coaching-goal li { font-size: 12px; color: #1a1a2e; margin-bottom: 4px; line-height: 1.5; }
  
  .comments-grid { }
  .comment-item { padding: 10px 14px; background: #f8fafc; border-left: 3px solid #e2e8f0; margin-bottom: 8px; border-radius: 0 6px 6px 0; }
  .comment-item .rater { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
  .comment-item .text { font-size: 12px; color: #1a1a2e; line-height: 1.5; }
  
  .footer { text-align: center; padding: 24px; border-top: 1px solid #e2e8f0; margin-top: 32px; color: #94a3b8; font-size: 11px; }
  
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #2A9D8F; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; z-index: 1000; }
  .email-btn { position: fixed; top: 20px; right: 160px; padding: 12px 24px; background: #E85D75; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; z-index: 1000; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="${window.location.origin}/parity-logo.png" alt="Parity Coaching" onerror="this.style.display='none'" />
    <h1>Leadership Brand Assessment Report</h1>
    <div class="user">${currentUser?.email || "Assessment Participant"}</div>
    <p>${SENIORITY_LEVELS.find(s => s.id === seniority)?.label || ""} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
  </div>

  ${report?.headline ? `
  <div class="section">
    <div class="section-title">Your Leadership Brand</div>
    <div class="headline-box"><p>"${report.headline}"</p></div>
  </div>` : ""}

  <!-- Pillar Summary -->
  <div class="section">
    <div class="section-title">Pillar Summary Scores</div>
    <div class="pillar-cards">
      ${PILLARS.map(p => {
        const selfAvg = getRaterAvg(selfRatings, p.competencies);
        const otherAvgs = allRaters.filter(r => r.key !== "self").map(r => parseFloat(getRaterAvg(r.ratings, p.competencies))).filter(s => !isNaN(s));
        const othersAvg = otherAvgs.length > 0 ? (otherAvgs.reduce((a,b) => a+b, 0) / otherAvgs.length).toFixed(1) : null;
        return `<div class="pillar-card" style="background:${pillarColors[p.id]}15; border: 2px solid ${pillarColors[p.id]}40;">
          <h3 style="color:${pillarColors[p.id]}">${p.name}</h3>
          ${othersAvg ? `
            <div class="score" style="color:${pillarColors[p.id]}">${othersAvg}</div>
            <div class="label" style="color:#64748b;margin-bottom:6px">Others Avg / 5.0</div>
            <div style="font-size:13px;font-weight:700;color:#475569">${selfAvg} <span style="font-size:10px;font-weight:400">Self</span></div>
          ` : `
            <div class="score" style="color:${pillarColors[p.id]}">${selfAvg}</div>
            <div class="label" style="color:#64748b">Self / 5.0</div>
          `}
        </div>`;
      }).join("")}
    </div>

    <!-- Full scores table -->
    <table>
      <tr>
        <th style="width:35%">Behaviour</th>
        ${allRaters.length > 1 ? "<th>Others Avg</th>" : ""}
        <th>Self</th>
        ${allRaters.length > 1 ? "<th>Difference</th>" : ""}
      </tr>
      ${PILLARS.map(p => `
        <tr class="pillar-row">
          <td colspan="${1 + (allRaters.length > 1 ? 3 : 1)}" style="border-left: 4px solid ${pillarColors[p.id]};">${p.name.toUpperCase()} — ${p.fullName.split("—")[1]?.trim() || ""}</td>
        </tr>
        ${p.competencies.map(c => {
          const selfScore = selfRatings[c.id] || 0;
          const otherScores = allRaters.filter(r => r.key !== "self").map(r => r.ratings[c.id] || 0);
          const validOthers = otherScores.filter(s => s > 0);
          const avgOthers = validOthers.length > 0 ? (validOthers.reduce((a,b) => a+b, 0) / validOthers.length).toFixed(1) : "N/A";
          const scoreClass = (s) => s ? `score-${Math.round(parseFloat(s))}` : "";
          const diff = avgOthers !== "N/A" && selfScore ? (parseFloat(avgOthers) - selfScore).toFixed(1) : "N/A";
          const diffColor = diff !== "N/A" ? (parseFloat(diff) > 0.5 ? "#C9843A" : parseFloat(diff) < -0.5 ? "#5B2D8E" : "#6B5B7B") : "#6B5B7B";
          return `<tr>
            <td>${c.name}<br><span style="font-size:10px;color:#64748b">${c.description}</span></td>
            ${allRaters.length > 1 ? `<td><strong>${avgOthers}</strong></td>` : ""}
            <td><span class="score-badge ${scoreClass(selfScore)}">${selfScore || "-"}</span></td>
            ${allRaters.length > 1 ? `<td style="color:${diffColor};font-weight:700">${diff !== "N/A" ? (parseFloat(diff) > 0 ? "+" : "") + diff : "-"}</td>` : ""}
          </tr>`;
        }).join("")}
      `).join("")}
    </table>
  </div>

  <!-- Top 3 / Bottom 3 -->
  <div class="section">
    <div class="section-title">Key Findings</div>
    <div class="top-bottom">
      <div class="top-box" style="background:rgba(201,132,58,0.06); border: 1px solid rgba(201,132,58,0.3);">
        <h3 style="color:#C9843A">Top 3 Behaviours</h3>
        ${(report?.top3 || []).map((b, i) => `<div class="item"><div class="num" style="background:#C9843A">${i+1}</div><span style="font-size:12px">${b}</span></div>`).join("")}
      </div>
      <div class="top-box" style="background:rgba(91,45,142,0.06); border: 1px solid rgba(91,45,142,0.3);">
        <h3 style="color:#5B2D8E">Bottom 3 Behaviours</h3>
        ${(report?.bottom3 || []).map((b, i) => `<div class="item"><div class="num" style="background:#5B2D8E">${i+1}</div><span style="font-size:12px">${b}</span></div>`).join("")}
      </div>
    </div>
  </div>

  <!-- Coaching Goals -->
  ${report?.coaching_goals?.length ? `
  <div class="section">
    <div class="section-title">AI-Generated Coaching Goals</div>
    <p style="font-size:12px;color:#64748b;margin-bottom:16px">Based on bottom 3 behaviours and stakeholder feedback</p>
    ${report.coaching_goals.map((g, i) => `
      <div class="coaching-goal">
        <h4>${i+1}. ${g.goal}</h4>
        <div class="based-on">Based on: ${g.based_on}</div>
        <ul>${(g.actions || []).map(a => `<li>${a}</li>`).join("")}</ul>
      </div>
    `).join("")}
  </div>` : ""}

  <!-- Comments Grid -->
  ${(() => {
    const allComments = [];
    COMPETENCIES.forEach(c => {
      allRaters.forEach(r => {
        const comment = r.comments?.[c.id];
        if (comment?.trim()) allComments.push({ behaviour: c.name, rater: r.role || r.key, comment });
      });
    });
    const allStrengths = allRaters.filter(r => r.strengths?.trim()).map(r => ({ rater: r.role || r.key, text: r.strengths }));
    const allDevelopment = allRaters.filter(r => r.development?.trim()).map(r => ({ rater: r.role || r.key, text: r.development }));
    
    if (allComments.length === 0 && allStrengths.length === 0 && allDevelopment.length === 0) return "";
    return `
    <div class="section">
      <div class="section-title">Qualitative Feedback</div>
      ${allStrengths.length > 0 ? `
        <p style="font-size:13px;font-weight:700;margin-bottom:8px;color:#C9843A">Greatest Strengths</p>
        ${allStrengths.map(s => `<div class="comment-item"><div class="rater">${s.rater}</div><div class="text">${s.text}</div></div>`).join("")}
      ` : ""}
      ${allDevelopment.length > 0 ? `
        <p style="font-size:13px;font-weight:700;margin-bottom:8px;margin-top:16px;color:#5B2D8E">Areas for Development</p>
        ${allDevelopment.map(s => `<div class="comment-item"><div class="rater">${s.rater}</div><div class="text">${s.text}</div></div>`).join("")}
      ` : ""}
      ${allComments.length > 0 ? `
        <p style="font-size:13px;font-weight:700;margin-bottom:8px;margin-top:16px;color:#64748b">Behaviour Comments</p>
        ${allComments.map(c => `<div class="comment-item"><div class="rater">${c.rater} — ${c.behaviour}</div><div class="text">${c.comment}</div></div>`).join("")}
      ` : ""}
    </div>`;
  })()}

  <!-- Values Alignment -->
  ${report?.values_alignment ? `
  <div class="section">
    <div class="section-title">Values Alignment</div>
    <p style="font-size:13px;line-height:1.6;color:#334155">${report.values_alignment}</p>
  </div>` : ""}

  <div class="footer">
    <p><strong>Parity Coaching</strong> · sayhello@paritycoaching.org · www.paritycoaching.org</p>
    <p style="margin-top:4px">This report was generated using the Parity Coaching Leadership Competency Framework</p>
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
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
          <div style={{ marginTop: 16 }} />
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>
          <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 8 }}>Invite Your Stakeholders</h1>
          <p style={styles.subtitle}>Enter the email address for each rater. They'll receive a personalised link to complete their section privately.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {nonSelfRaters.map((raterId) => {
              const raterInfo = RATER_TYPES.find(r => r.id === raterId);
              const sent = inviteSent[raterId];
              return (
                <div key={raterId} style={{ padding: "16px 18px", background: sent ? "rgba(201,132,58,0.08)" : "rgba(45,27,78,0.04)", border: `1px solid ${sent ? "rgba(201,132,58,0.3)" : "rgba(45,27,78,0.09)"}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>{raterInfo?.label}</span>
                    {sent && <span style={{ fontSize: 11, color: "#C9843A", fontWeight: 600, marginLeft: "auto" }}>✓ Invite sent</span>}
                  </div>
                  {!sent && (
                    <input
                      type="email"
                      value={inviteEmails[raterId] || ""}
                      onChange={(e) => setInviteEmails(prev => ({ ...prev, [raterId]: e.target.value }))}
                      placeholder={`${raterInfo?.label}'s email address...`}
                      style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.07)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
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
            style={{ ...styles.btnPrimary, width: "100%", background: allSent ? "#C9843A" : "rgba(45,27,78,0.07)", color: allSent ? "#fff" : "#6B5B7B", border: allSent ? "none" : "1px solid rgba(45,27,78,0.12)" }}>
            {allSent ? "Continue to Rate Yourself →" : "Skip — Rate Yourself Now →"}
          </button>

          {allSent && (
            <p style={{ textAlign: "center", color: "#8B7B9B", fontSize: 12, marginTop: 12 }}>
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
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={styles.moduleTag}>Leadership Brand Assessment</div>
        <h1 style={styles.title}>What is your seniority level?</h1>
        <p style={styles.subtitle}>This helps us tailor the competency framework to your role.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {SENIORITY_LEVELS.map((level) => {
            const selected = seniority === level.id;
            return (
              <button key={level.id} onClick={() => setSeniority(level.id)}
                style={{ padding: "18px 20px", borderRadius: 14, border: selected ? "2px solid #2A9D8F" : "1.5px solid rgba(45,27,78,0.12)", background: selected ? "rgba(201,132,58,0.12)" : "rgba(45,27,78,0.04)", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16 }}>
                
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: selected ? "#1a0a2e" : "#4A2D6E" }}>{level.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8B7B9B" }}>{level.description}</p>
                </div>
                {selected && <span style={{ marginLeft: "auto", color: "#C9843A", fontSize: 20 }}>✓</span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => { setSelectedRaters(["self"]); setCurrentRater("self"); setScreen(3); }} disabled={!seniority}
          style={{ ...styles.btnPrimary, width: "100%", opacity: seniority ? 1 : 0.4, cursor: seniority ? "pointer" : "not-allowed" }}>
          Start Self Assessment →
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
        <p style={styles.subtitle}>Select all that apply. You can complete each perspective separately. <strong style={{ color: "#C9843A" }}>Self</strong> is always included.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {RATER_TYPES.map((rater) => {
            const selected = selectedRaters.includes(rater.id);
            const isRequired = rater.id === "self";
            return (
              <button key={rater.id} onClick={() => toggleRater(rater.id)}
                style={{ padding: "14px 18px", borderRadius: 12, border: selected ? "2px solid #2A9D8F" : "1.5px solid rgba(45,27,78,0.12)", background: selected ? "rgba(201,132,58,0.1)" : "rgba(45,27,78,0.04)", cursor: isRequired ? "default" : "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{rater.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: selected ? "#1a0a2e" : "#6B5B7B" }}>{rater.label} {isRequired && <span style={{ fontSize: 10, color: "#C9843A", fontWeight: 600 }}>(required)</span>}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7B9B" }}>{rater.description}</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: selected ? "2px solid #2A9D8F" : "2px solid #475569", background: selected ? "#C9843A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, flexShrink: 0 }}>
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
          <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 40, objectFit: "contain" }} />
          </div>
          <button onClick={() => setScreen(1)} style={styles.backBtn}>← Back</button>
          <div style={{ marginTop: 16 }} />
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>

          {/* Self-only indicator */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            <div style={{ padding: "6px 14px", borderRadius: 20, border: "2px solid #C9843A", background: "rgba(201,132,58,0.15)", color: "#C9843A", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              Self Assessment
            </div>
            {selectedRaters.filter(r => r !== "self").length > 0 && (
              <div style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid rgba(45,27,78,0.12)", background: "rgba(45,27,78,0.05)", color: "#8B7B9B", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                {selectedRaters.filter(r => r !== "self").length} stakeholder{selectedRaters.filter(r => r !== "self").length !== 1 ? "s" : ""} invited — completing via email
              </div>
            )}
          </div>

          <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 4 }}>
            {raterInfo?.icon} {currentRater === "self" ? "Rate Yourself" : `Rate as ${raterInfo?.label}`}
          </h1>
          <p style={styles.subtitle}>Rate each behaviour 1–5. Add comments or examples where relevant.</p>

          {/* Legend */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
            {[1,2,3,4,5].map((val) => (
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(201,132,58,0.1)", borderRadius: 6, border: "1px solid rgba(201,132,58,0.3)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#C9843A" }}>{val}</span>
                <span style={{ fontSize: 11, color: "#C9843A" }}>{RATING_LABELS[val].label}</span>
              </div>
            ))}
          </div>

          {/* Pillars */}
          {PILLARS.map((pillar) => (
            <div key={pillar.id} style={{ marginBottom: 32 }}>
              <div style={{ padding: "14px 18px", background: pillar.color + "15", border: `1px solid ${pillar.color}30`, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: pillar.color }}>{pillar.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: pillar.id === "capacity" ? "#8B5A1E" : pillar.color + "cc", lineHeight: 1.5 }}>{pillar.description}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {pillar.competencies.filter(comp => currentRater === "self" ? !["p1", "p2"].includes(comp.id) : true).map((comp, ci) => {
                  const score = getRating(comp.id);
                  const comment = getComment(comp.id);
                  return (
                    <div key={comp.id} style={{ padding: "16px 18px", background: pillar.color + "0d", border: "1px solid " + pillar.color + "30", borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: pillar.color + "22", border: `1px solid ${pillar.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: pillar.color, flexShrink: 0 }}>{ci + 1}</div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>{comp.name}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: pillar.id === "capacity" ? "#8B5A1E" : pillar.color + "cc", lineHeight: 1.4 }}>{comp.description}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map((val) => {
                          const selected = score === val;
                          const ratingInfo = RATING_LABELS[val];
                          return (
                            <button key={val} onClick={() => setRating(comp.id, val)}
                              style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: selected ? `2px solid ${pillar.color}` : `1px solid ${pillar.color}44`, background: selected ? pillar.color + "22" : pillar.color + "08", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: pillar.id === "capacity" ? "#C9843A" : pillar.color }}>{val}</span>
                              <span style={{ fontSize: 9, color: pillar.id === "capacity" ? "#8B5A1E" : pillar.color + "aa", fontWeight: 600 }}>{ratingInfo.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <textarea value={comment} onChange={(e) => setComment(comp.id, e.target.value)}
                        placeholder="Add specific examples or observations (optional)..." rows={2}
                        style={{ width: "100%", padding: "8px 12px", background: pillar.color + "08", border: `1px solid ${pillar.color}33`, borderRadius: 8, color: "#2D1B4E", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Strengths & Development questions - only for stakeholders */}
          {currentRater !== "self" && <div style={{ padding: "20px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 14, marginBottom: 24 }}>
            <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>📝 Additional Feedback</p>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: "#8B5A1E", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {currentRater === "self" ? "What are your greatest strengths? Please describe." : "What are this person's greatest strengths? Please describe."}
              </p>
              <textarea value={strengths[currentRater] || ""} onChange={(e) => setStrengths(prev => ({ ...prev, [currentRater]: e.target.value }))}
                placeholder="Describe key strengths with specific examples..." rows={3}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div>
              <p style={{ color: "#8B5A1E", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {currentRater === "self" ? "What are your main areas for development? Please describe." : "What are this person's main areas for development? Please describe."}
              </p>
              <textarea value={development[currentRater] || ""} onChange={(e) => setDevelopment(prev => ({ ...prev, [currentRater]: e.target.value }))}
                placeholder="Describe areas for growth with specific suggestions..." rows={3}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>}

          {currentRaterDone ? (
            <button onClick={() => setScreen(3.5)}
              style={{ ...styles.btnPrimary, width: "100%" }}>
              Self Assessment Complete — View Status →
            </button>
          ) : (
            <div style={{ padding: "12px 16px", background: "rgba(244,162,97,0.08)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 10, textAlign: "center" }}>
              <p style={{ color: "#E0A84A", fontSize: 13, margin: 0 }}>
                Rate all {requiredForSelf} behaviours to continue ({Object.keys(ratings["self"] || {}).filter(k => !selfExcluded.includes(k)).length}/{requiredForSelf} rated)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Screen 3.5: Invite Stakeholders & Generate ───────────────────────────────
  if (screen === 3.5) {
    const completedCount = Object.keys(stakeholderData).length;
    const totalInvited = Object.keys(inviteTokens).length;
    const selfExcluded2 = ["p1", "p2"];
    const requiredForSelf2 = COMPETENCIES.filter(c => !selfExcluded2.includes(c.id)).length;
    const canGenerate = Object.keys(ratings["self"] || {}).filter(k => !selfExcluded2.includes(k)).length >= requiredForSelf2;
    const nonSelfRaterTypes = RATER_TYPES.filter(r => r.id !== "self");

    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 40, objectFit: "contain" }} />
          </div>
          <button onClick={() => setScreen(3)} style={styles.backBtn}>← Back to Self Assessment</button>
          <div style={{ marginTop: 16 }} />
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>

          {/* Self complete badge */}
          <div style={{ padding: "14px 18px", background: "rgba(201,132,58,0.08)", border: "1px solid rgba(201,132,58,0.25)", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>Self Assessment Complete</p>
              <p style={{ margin: 0, fontSize: 12, color: "#C9843A" }}>You can generate your report now or invite stakeholders first</p>
            </div>
          </div>

          {/* Invite Stakeholders section */}
          <p style={{ color: "#1a0a2e", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📧 Invite Stakeholders (Optional)</p>
          <p style={{ color: "#8B7B9B", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Select who you want to invite and enter their email. They'll receive a private link to rate you.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {nonSelfRaterTypes.map((rater) => {
              const isSelected = selectedRaters.includes(rater.id);
              const hasToken = inviteTokens[rater.id];
              const isCompleted = Object.values(stakeholderData).some(s => s.role === rater.label);
              return (
                <div key={rater.id} style={{ padding: "14px 16px", background: isCompleted ? "rgba(201,132,58,0.08)" : isSelected ? "rgba(45,27,78,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${isCompleted ? "rgba(201,132,58,0.3)" : isSelected ? "rgba(45,27,78,0.18)" : "rgba(45,27,78,0.07)"}`, borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isSelected && !hasToken ? 10 : 0 }}>
                    {isCompleted ? (
                      <span style={{ fontSize: 18 }}>✅</span>
                    ) : (
                      <input type="checkbox" checked={isSelected} onChange={() => {
                        setSelectedRaters(prev => isSelected ? prev.filter(r => r !== rater.id) : [...prev, rater.id]);
                      }} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#C9843A", flexShrink: 0 }} />
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>{rater.label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: isCompleted ? "#C9843A" : hasToken ? "#E0A84A" : "#8B7B9B" }}>
                        {isCompleted ? "Completed ✓" : hasToken ? "Invited — awaiting response" : rater.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && !hasToken && !isCompleted && (
                    <input type="email" value={inviteEmails[rater.id] || ""}
                      onChange={(e) => setInviteEmails(prev => ({ ...prev, [rater.id]: e.target.value }))}
                      placeholder={`${rater.label}'s email address...`}
                      style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.07)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Send invitations button */}
          {selectedRaters.filter(r => r !== "self" && !inviteTokens[r]).length > 0 && (
            <button onClick={sendInvitations} disabled={inviteSending}
              style={{ ...styles.btnSecondary, width: "100%", marginBottom: 16, opacity: inviteSending ? 0.7 : 1 }}>
              {inviteSending ? "Sending..." : `Send ${selectedRaters.filter(r => r !== "self" && !inviteTokens[r]).length} Invitation${selectedRaters.filter(r => r !== "self" && !inviteTokens[r]).length !== 1 ? "s" : ""}`}
            </button>
          )}

          {/* Check responses */}
          {totalInvited > 0 && (
            <>
              <button onClick={loadStakeholderResponses} disabled={loadingStakeholders}
                style={{ ...styles.btnSecondary, width: "100%", marginBottom: 12, opacity: loadingStakeholders ? 0.7 : 1 }}>
                {loadingStakeholders ? "Checking..." : "Check for New Responses"}
              </button>
              {completedCount > 0 && (
                <div style={{ padding: "10px 14px", background: "rgba(201,132,58,0.08)", border: "1px solid rgba(201,132,58,0.2)", borderRadius: 10, marginBottom: 12, textAlign: "center" }}>
                  <p style={{ color: "#C9843A", fontSize: 13, margin: 0, fontWeight: 600 }}>
                    {completedCount} stakeholder response{completedCount !== 1 ? "s" : ""} received ✓
                  </p>
                </div>
              )}
            </>
          )}

          <div style={{ height: 1, background: "rgba(45,27,78,0.09)", margin: "20px 0" }} />

          {/* Consent + Generate */}
          <div style={{ padding: "14px 16px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <input type="checkbox" id="consent" checked={consentToShare} onChange={(e) => setConsentToShare(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, cursor: "pointer", flexShrink: 0, accentColor: "#C9843A" }} />
            <label htmlFor="consent" style={{ fontSize: 13, color: "#8B5A1E", lineHeight: 1.5, cursor: "pointer" }}>
              I consent to send a copy of my results to <strong style={{ color: "#1a0a2e" }}>sayhello@paritycoaching.org</strong>
            </label>
          </div>

          <button onClick={generateReport} disabled={!canGenerate || reportLoading}
            style={{ ...styles.btnPrimary, width: "100%", background: "linear-gradient(135deg, #5B2D8E, #2D1B4E)", opacity: canGenerate && !reportLoading ? 1 : 0.5 }}>
            {reportLoading ? "Generating your report..." : completedCount > 0 ? `Generate Report (Self + ${completedCount} stakeholder${completedCount !== 1 ? "s" : ""}) →` : "Generate Report (Self only) →"}
          </button>

          {totalInvited > 0 && completedCount === 0 && (
            <p style={{ textAlign: "center", color: "#9B8BAB", fontSize: 12, marginTop: 10 }}>
              You can generate now or wait for stakeholder responses for a richer report.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Screen 4: Report ─────────────────────────────────────────────────────────  // ── Screen 4: Report ─────────────────────────────────────────────────────────
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
          <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 40, objectFit: "contain" }} />
          </div>
          <button onClick={() => setScreen(3.5)} style={styles.backBtn}>← Back to Status</button>
          <div style={{ marginTop: 16 }} />
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>

          {/* Headline */}
          <div style={{ padding: "24px", background: "linear-gradient(135deg, rgba(201,132,58,0.15), rgba(38,70,83,0.25))", border: "1px solid rgba(201,132,58,0.3)", borderRadius: 16, marginBottom: 24 }}>
            <p style={{ color: "#C9843A", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Your Leadership Brand</p>
            <p style={{ color: "#1a0a2e", fontSize: 16, fontStyle: "italic", lineHeight: 1.6, margin: 0, fontWeight: 600 }}>"{report.headline}"</p>
          </div>

          {/* Pillar summary scores */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {PILLARS.map((pillar) => {
              const selfAvg = (pillar.competencies.reduce((sum, c) => sum + (selfRatings[c.id] || 0), 0) / pillar.competencies.length).toFixed(1);
              const otherAvg = otherRaters.length > 0 ? (pillar.competencies.reduce((sum, c) => { const scores = otherRaters.map(r => ratings[r]?.[c.id] || 0).filter(s => s > 0); return sum + (scores.length > 0 ? scores.reduce((a,b)=>a+b,0)/scores.length : 0); }, 0) / pillar.competencies.length).toFixed(1) : null;
              return (
                <div key={pillar.id} style={{ flex: 1, minWidth: 120, padding: "14px", background: pillar.color + "12", border: `1px solid ${pillar.color}30`, borderRadius: 12, textAlign: "center" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: pillar.color }}>{pillar.name}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1a0a2e" }}>{selfAvg}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#8B7B9B" }}>Self / 5.0</p>
                  {otherAvg && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8B5A1E" }}>Others: {otherAvg}</p>}
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
                <div key={comp.id} style={{ marginBottom: 14, padding: "12px 14px", background: pillar.color + "0d", borderRadius: 10, border: "1px solid " + pillar.color + "25" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a0a2e" }}>{comp.name}</span>
                    {gap !== null && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: Math.abs(gap) <= 0.5 ? "rgba(201,132,58,0.15)" : Math.abs(gap) <= 1 ? "rgba(244,162,97,0.15)" : "rgba(91,45,142,0.12)", color: Math.abs(gap) <= 0.5 ? "#C9843A" : Math.abs(gap) <= 1 ? "#E0A84A" : "#5B2D8E" }}>
                        {gap > 0 ? "+" : ""}{gap} gap
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[["Self", selfScore, 0.6], avgOthers !== null ? ["Others avg", avgOthers, 1] : null].filter(Boolean).map(([label, val, opacity]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 70, fontSize: 10, color: "#8B7B9B" }}>{label}</span>
                        <div style={{ flex: 1, height: 8, background: "rgba(45,27,78,0.07)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: PALETTE[i % PALETTE.length], borderRadius: 4, opacity, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ width: 24, fontSize: 10, color: "#8B5A1E", textAlign: "right" }}>{typeof val === "number" ? val.toFixed(1) : val}</span>
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
            <div style={{ flex: 1, minWidth: 200, padding: "18px 20px", background: "rgba(201,132,58,0.08)", border: "1px solid rgba(201,132,58,0.2)", borderRadius: 12 }}>
              <p style={{ color: "#C9843A", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Top 3 Behaviours</p>
              {(report.top3 || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#C9843A", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#1a0a2e" }}>{s}</p>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: "18px 20px", background: "rgba(91,45,142,0.08)", border: "1px solid rgba(91,45,142,0.15)", borderRadius: 12 }}>
              <p style={{ color: "#5B2D8E", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Bottom 3 Behaviours</p>
              {(report.bottom3 || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#5B2D8E", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#1a0a2e" }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coaching Goals from Bottom 3 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>AI-Generated Coaching Goals</p>
            <p style={{ color: "#8B7B9B", fontSize: 12, margin: "0 0 14px" }}>Based on your bottom 3 behaviours, here are 3 suggested coaching goals with actions.</p>
            {(report.coaching_goals || []).map((goal, i) => (
              <div key={i} style={{ padding: "18px 20px", background: "rgba(244,162,97,0.06)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: "#E0A84A", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>{goal.goal}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8B7B9B" }}>Based on: {goal.based_on}</p>
                  </div>
                </div>
                <div style={{ paddingLeft: 34 }}>
                  {(goal.actions || []).map((action, ai) => (
                    <div key={ai} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: "#E0A84A", fontSize: 12, flexShrink: 0 }}>•</span>
                      <p style={{ margin: 0, fontSize: 12, color: "#8B5A1E" }}>{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Key Strengths */}
          <div style={{ padding: "18px 20px", background: "rgba(201,132,58,0.08)", border: "1px solid rgba(201,132,58,0.2)", borderRadius: 12, marginBottom: 16 }}>
            <p style={{ color: "#C9843A", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Key Strengths</p>
            {(report.strengths || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span style={{ color: "#C9843A", fontSize: 14, flexShrink: 0 }}>→</span>
                <p style={{ margin: 0, fontSize: 13, color: "#1a0a2e" }}>{s}</p>
              </div>
            ))}
          </div>

          {/* Values alignment */}
          {coreValues.length > 0 && (
            <div style={{ padding: "18px 20px", background: "rgba(74,45,110,0.08)", border: "1px solid rgba(74,45,110,0.2)", borderRadius: 12, marginBottom: 16 }}>
              <p style={{ color: "#4A2D6E", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Values Alignment</p>
              <p style={{ margin: 0, fontSize: 13, color: "#1a0a2e", lineHeight: 1.6 }}>{report.values_alignment}</p>
            </div>
          )}

          {/* Comments summary */}
          {report.comments_summary && (
            <div style={{ padding: "18px 20px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 12, marginBottom: 16 }}>
              <p style={{ color: "#1a0a2e", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Qualitative Feedback Summary</p>
              <p style={{ margin: 0, fontSize: 13, color: "#8B5A1E", lineHeight: 1.6 }}>{report.comments_summary}</p>
            </div>
          )}

          {/* Book a session */}
          <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, rgba(201,132,58,0.12), rgba(38,70,83,0.2))", border: "1px solid rgba(201,132,58,0.25)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
            <div>
              <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Discuss your results with a coach</p>
              <p style={{ color: "#8B5A1E", fontSize: 12, margin: 0 }}>Book a 1:1 session to debrief your leadership brand report.</p>
            </div>
            <a href="https://www.paritycoaching.org" target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 20px", background: "#C9843A", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
              Book a Session →
            </a>
          </div>

          {/* Load Stakeholder Responses */}
          {Object.keys(inviteTokens).length > 0 && (
            <div style={{ padding: "16px 20px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 12, marginBottom: 16 }}>
              <p style={{ color: "#1a0a2e", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>Stakeholder Responses</p>
              <p style={{ color: "#8B7B9B", fontSize: 12, margin: "0 0 12px" }}>
                {Object.keys(stakeholderData).length > 0
                  ? `${Object.keys(stakeholderData).length} stakeholder response(s) loaded.`
                  : "Check if your stakeholders have completed their assessments."}
              </p>
              <button onClick={loadStakeholderResponses} disabled={loadingStakeholders}
                style={{ ...styles.btnSecondary, fontSize: 13, opacity: loadingStakeholders ? 0.7 : 1 }}>
                {loadingStakeholders ? "Checking..." : "Load Stakeholder Responses"}
              </button>
            </div>
          )}

          {/* Generate PDF Report */}
          <button onClick={generatePDFReport}
            style={{ ...styles.btnPrimary, width: "100%", marginBottom: 12, background: "linear-gradient(135deg, #2D1B4E, #C9843A)" }}>
            Generate PDF Report
          </button>

          <button onClick={onBack} style={{ ...styles.btnSecondary, width: "100%" }}>
            ← Back Exercise
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  root: { minHeight: "100vh", background: "#F9F6F2", fontFamily: "'Raleway', 'Lato', system-ui, sans-serif", color: "#1a0a2e", padding: "20px 0" },
  container: { maxWidth: 600, margin: "0 auto", padding: "0 20px" },
  backBtn: { background: "none", border: "none", color: "#C9843A", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16, padding: 0 },
  moduleTag: { display: "inline-block", padding: "4px 12px", background: "rgba(45,27,78,0.1)", border: "1px solid rgba(45,27,78,0.25)", borderRadius: 20, color: "#2D1B4E", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 800, color: "#2D1B4E", margin: "0 0 8px", lineHeight: 1.2 },
  subtitle: { fontSize: 14, color: "#8B5A1E", margin: "0 0 24px", lineHeight: 1.5 },
  btnPrimary: { padding: "13px 24px", background: "#C9843A", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  btnSecondary: { padding: "12px 24px", background: "rgba(45,27,78,0.07)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 10, color: "#8B5A1E", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
};
