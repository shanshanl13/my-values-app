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
  { id: "others", label: "Others", icon: "🌐", description: "Other colleagues or partners" },
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
function ReportViewer({ reportId }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sbFetch(`/leadership_reports?id=eq.${reportId}&select=*`)
      .then(data => { if (data?.[0]) setReportData(data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"Raleway,sans-serif", color:"#6B5B7B", background:"white" }}>Loading report...</div>;
  if (!reportData) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:"Raleway,sans-serif", color:"#E85D75" }}>Report not found.</div>;

  return <div style={{ background: "white", minHeight: "100vh" }} dangerouslySetInnerHTML={{ __html: reportData.report_html }} />;
}


function StakeholderView({ token }) {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [strengths, setStrengths] = useState("");
  const [development, setDevelopment] = useState("");
  const [raterFirstName, setRaterFirstName] = useState("");
  const [raterLastName, setRaterLastName] = useState("");
  const [raterRole, setRaterRole] = useState("");
  const [raterToken, setRaterToken] = useState(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sbFetch(`/leadership_invitations?token=eq.${token}&select=*`);
        if (data && data.length > 0) {
          setInvitation(data[0]);
          // Allow reuse - do not block on completed status
          if (data[0].rater_name) {
            const [fn, ...ln] = (data[0].rater_name || "").split(" ");
            setRaterFirstName(fn || "");
            setRaterLastName(ln.join(" ") || "");
          }
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
      const finalRole = raterRole || invitation?.rater_role;
      // Always submit to the new rater-specific row, never the shared pending row
      if (!raterToken) {
        console.error("No raterToken - submission may fail");
      }
      const submitToken2 = raterToken;
      if (!submitToken2) {
        alert("Something went wrong. Please refresh and try again.");
        setSubmitting(false);
        return;
      }
      await sbFetch(`/leadership_invitations?token=eq.${submitToken2}`, {
        method: "PATCH",
        body: JSON.stringify({
          ratings,
          comments,
          strengths,
          development,
          rater_name: `${raterFirstName} ${raterLastName}`.trim(),
          rater_role: raterRole || invitation?.rater_role,
          completed: true,
          completed_at: new Date().toISOString()
        }),
      });
      setDone(true);
    } catch (e) {
      console.error("Submit failed:", e);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6B5B7B" }}>Loading your assessment...</p>
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
        <p style={{ color: "#6B5B7B", fontSize: 14 }}>Your feedback has been submitted successfully. You can close this window.</p>
        <p style={{ color: "#8B7B9B", fontSize: 12, marginTop: 16 }}>— Parity Coaching</p>
      </div>
    </div>
  );

  if (!introComplete) {
    const canProceed = raterFirstName.trim() && raterLastName.trim() && raterRole;
    return (
      <div style={{ minHeight:"100vh", background:"#F9F6F2", fontFamily:"'Raleway','Lato',system-ui,sans-serif", padding:"40px 20px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:28, paddingBottom:16, borderBottom:"2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height:44, objectFit:"contain" }} />
          </div>
          <div style={{ display:"inline-block", padding:"4px 12px", background:"rgba(201,132,58,0.1)", border:"1px solid rgba(201,132,58,0.3)", borderRadius:20, fontSize:11, fontWeight:700, color:"#C9843A", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:16 }}>Leadership Competency Assessment</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#2D1B4E", margin:"0 0 8px" }}>Before you begin</h1>
          <p style={{ fontSize:13, color:"#6B5B7B", marginBottom:24, lineHeight:1.6 }}>You have been invited to provide feedback on <strong style={{ color:"#1a0a2e" }}>{invitation?.owner_name || "a colleague"}</strong>'s leadership. Please tell us a bit about yourself first.</p>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, fontWeight:600, color:"#2D1B4E", margin:"0 0 4px" }}>First Name *</p>
              <input type="text" value={raterFirstName} onChange={e => setRaterFirstName(e.target.value)} placeholder="First name" style={{ width:"100%", padding:"10px 14px", background:"rgba(45,27,78,0.07)", border:"1px solid rgba(45,27,78,0.12)", borderRadius:8, color:"#1a0a2e", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, fontWeight:600, color:"#2D1B4E", margin:"0 0 4px" }}>Last Name *</p>
              <input type="text" value={raterLastName} onChange={e => setRaterLastName(e.target.value)} placeholder="Last name" style={{ width:"100%", padding:"10px 14px", background:"rgba(45,27,78,0.07)", border:"1px solid rgba(45,27,78,0.12)", borderRadius:8, color:"#1a0a2e", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <p style={{ fontSize:12, fontWeight:600, color:"#2D1B4E", margin:"0 0 6px" }}>Your relationship to {invitation?.owner_name?.split(" ")[0] || "this person"} *</p>
          <select value={raterRole} onChange={e => setRaterRole(e.target.value)} style={{ width:"100%", padding:"10px 14px", background:"rgba(45,27,78,0.07)", border:"1px solid rgba(45,27,78,0.12)", borderRadius:8, color:raterRole?"#1a0a2e":"#8B7B9B", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:24 }}>
            <option value="">Select your relationship...</option>
            <option value="Line Manager">Line Manager</option>
            <option value="Senior Stakeholder">Senior Stakeholder</option>
            <option value="Peer">Peer</option>
            <option value="Direct Report">Direct Report</option>
          </select>
          <button onClick={async () => {
            if (!canProceed) return;
            try {
              const existing = await sbFetch(`/leadership_invitations?token=eq.${token}&select=owner_email,owner_name,owner_role&limit=1`);
              const orig = existing?.[0];
              if (orig) {
                const newRow = await sbFetch("/leadership_invitations", {
                  method: "POST",
                  headers: { "Prefer": "return=representation" },
                  body: JSON.stringify({
                    owner_email: orig.owner_email,
                    owner_name: orig.owner_name,
                    owner_role: orig.owner_role,
                    rater_role: raterRole,
                    rater_email: "via_link",
                    rater_name: `${raterFirstName} ${raterLastName}`.trim(),
                  }),
                });
                if (newRow?.[0]?.token) {
                  setRaterToken(newRow[0].token);
                  console.log("Created rater row:", newRow[0].token);
                }
              }
            } catch(e) { console.error("Failed to create rater row:", e); }
            setIntroComplete(true);
          }} disabled={!canProceed}
            style={{ width:"100%", padding:"14px", background:canProceed?"linear-gradient(135deg, #2D1B4E, #5B2D8E)":"rgba(45,27,78,0.1)", border:"none", borderRadius:10, color:canProceed?"#fff":"#8B7B9B", fontSize:14, fontWeight:700, cursor:canProceed?"pointer":"not-allowed", fontFamily:"inherit" }}>
            Start Assessment →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #C9843A" }}>
          <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 44, objectFit: "contain" }} />
        </div>
        <div style={styles.moduleTag}>Leadership Brand Assessment</div>
        <h1 style={{ ...styles.title, fontSize: 22, marginBottom: 4 }}>
          {raterRole || invitation?.rater_role} Feedback
        </h1>
        <p style={styles.subtitle}>
          You've been asked to provide feedback on <strong style={{ color: "#1a0a2e" }}>{invitation?.owner_name || invitation?.owner_email?.split("@")[0]}</strong>'s leadership. Rate each behaviour 1–5 and add comments where relevant.
        </p>



        {/* Legend */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {[1,2,3,4,5].map((val) => (
            <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(45,27,78,0.05)", borderRadius: 6, border: "1px solid rgba(45,27,78,0.09)" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: RATING_LABELS[val].color }}>{val}</span>
              <span style={{ fontSize: 11, color: "#8B7B9B" }}>{RATING_LABELS[val].label}</span>
            </div>
          ))}
        </div>

        {/* Pillars */}
        {PILLARS.map((pillar) => (
          <div key={pillar.id} style={{ marginBottom: 32 }}>
            <div style={{ padding: "14px 18px", background: pillar.color + "15", border: `1px solid ${pillar.color}30`, borderRadius: 12, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: pillar.color }}>{pillar.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8B7B9B" }}>{pillar.description}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pillar.competencies.map((comp, ci) => {
                const score = ratings[comp.id] || 0;
                return (
                  <div key={comp.id} style={{ padding: "14px 16px", background: pillar.color + "0d", border: "1px solid " + pillar.color + "30", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: pillar.color + "22", border: `1px solid ${pillar.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: pillar.color, flexShrink: 0 }}>{ci+1}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a0a2e" }}>{comp.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7B9B" }}>{comp.description}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[1,2,3,4,5].map((val) => {
                        const selected = score === val;
                        const ri = RATING_LABELS[val];
                        return (
                          <button key={val} onClick={() => setRating(comp.id, val)}
                            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: selected ? `2px solid ${pillar.color}` : `1px solid ${pillar.color}44`, background: selected ? pillar.color + "20" : pillar.color + "08", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: pillar.color }}>{val}</span>
                            <span style={{ fontSize: 8, color: pillar.color + "aa", fontWeight: 600 }}>{ri.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <textarea value={comments[comp.id] || ""} onChange={(e) => setComment(comp.id, e.target.value)}
                      placeholder="Add examples or observations (optional)..." rows={2}
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(45,27,78,0.05)", border: "1px solid rgba(45,27,78,0.09)", borderRadius: 8, color: "#6B5B7B", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
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
            <p style={{ color: "#6B5B7B", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>What are this person's greatest strengths?</p>
            <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)}
              placeholder="Describe key strengths with specific examples..." rows={3}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <p style={{ color: "#6B5B7B", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>What are this person's main areas for development?</p>
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
  const urlReportId = new URLSearchParams(window.location.search).get("report");
  if (urlReportId) {
    return <ReportViewer reportId={urlReportId} />;
  }

  if (urlToken) {
    return <StakeholderView token={urlToken} />;
  }

  const [screen, setScreen] = useState(1); // 1=user info, 3=rate, 3.5=invite, 4=report
  const [seniority, setSeniority] = useState("management"); // default seniority
  const [userInfo, setUserInfo] = useState({ email: "", firstName: "", lastName: "", role: "" });
  const [selectedRaters, setSelectedRaters] = useState(["self"]);
  const [currentRater, setCurrentRater] = useState("self");
  const [ratings, setRatings] = useState({}); // { raterId: { competencyId: score } }
  const [comments, setComments] = useState({}); // { raterId: { competencyId: comment } }
  const [strengths, setStrengths] = useState({}); // { raterId: text }
  const [development, setDevelopment] = useState({}); // { raterId: text }
  const [reportLoading, setReportLoading] = useState(false);
  const [consentToShare, setConsentToShare] = useState(false);
  const [inviteEmails, setInviteEmails] = useState({ peers: [""], direct_reports: [""], others: [""], line_manager: "" }); // tracks previously invited
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showInviteSentPopup, setShowInviteSentPopup] = useState(false);
  const [showDupePopup, setShowDupePopup] = useState(false);
  const [dupeMsg, setDupeMsg] = useState("");
  const [statusData, setStatusData] = useState({});
  const [newInviteEmails, setNewInviteEmails] = useState({ peers: [""], direct_reports: [""], others: [""], line_manager: "" }); // fresh input only
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState({}); // { raterId: true }
  const [inviteTokens, setInviteTokens] = useState(() => {
    try { const s = localStorage.getItem('cv_invite_tokens'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  }); // { raterId: token }
  const [stakeholderData, setStakeholderData] = useState({}); // { raterId: { ratings, comments, strengths, development } }
  const [loadingStakeholders, setLoadingStakeholders] = useState(false);

  const normalizeRoleKey = (role) => {
    const map = { "peer": "peers", "direct report": "direct_reports", "line manager": "line_manager", "senior stakeholder": "senior_stakeholder" };
    return map[role.toLowerCase()] || role.toLowerCase().replace(/\s+/g, '_');
  };

  const loadStakeholderResponses = async () => {
    setLoadingStakeholders(true);
    try {
      // Query by owner email if logged in, otherwise query by rater emails we invited
      let data = [];
      if (userInfo.email) {
        data = await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&completed=eq.true&select=*`) || [];
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
        // Group by rater role
        const grouped = {};
        data.forEach((inv) => {
          const role = inv.rater_role;
          if (!grouped[role]) grouped[role] = [];
          grouped[role].push(inv);
        });

        // Minimum rules: Line Manager = 1, all others = 3+
        const newData = {};
        Object.entries(grouped).forEach(([role, invites]) => {
          const isManager = role === "Line Manager";
          // For line manager, only use the most recent response
          const filteredInvites = isManager ? [invites.sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at))[0]] : invites;
          const minRequired = isManager ? 1 : 3;
          if (filteredInvites.length >= minRequired) {
            const avgRatings = {};
            const allComments = {};
            const strengths = filteredInvites.map(i => i.strengths).filter(Boolean).join(" | ");
            const development = invites.map(i => i.development).filter(Boolean).join(" | ");
            COMPETENCIES.forEach(c => {
              const scores = filteredInvites.map(i => i.ratings?.[c.id] || 0).filter(s => s > 0);
              if (scores.length > 0) avgRatings[c.id] = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length * 10) / 10;
              const comms = filteredInvites.map(i => i.comments?.[c.id]).filter(Boolean);
              if (comms.length > 0) allComments[c.id] = comms.join(" | ");
            });
            const raterNames = filteredInvites.map(i => i.rater_name).filter(Boolean).join(", ");
            const roleKey = normalizeRoleKey(role);
            newData[roleKey] = { role, ratings: avgRatings, comments: allComments, strengths, development, count: invites.length, raterName: raterNames };
          }
        });
        const newStatusData = {};
        Object.entries(grouped).forEach(([role, invites]) => {
          const roleKey = normalizeRoleKey(role);
          const raterNames = invites.map(i => i.rater_name).filter(Boolean).join(", ");
          newStatusData[roleKey] = { role, count: invites.length, raterName: raterNames };
        });
        setStatusData(newStatusData);
        setStakeholderData(newData);
      }
    } catch (e) {
      console.error("Failed to load stakeholder responses:", e);
    }
    setLoadingStakeholders(false);
  };
  const [showInviteScreen, setShowInviteScreen] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedGoals, setSelectedGoals] = useState([]);

  // Load existing invite link from pending token
  useEffect(() => {
    if (!userInfo.email || generatedLink) return;
    sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&rater_role=eq.pending&completed=eq.false&select=token&limit=1`)
      .then(data => {
        if (data?.[0]?.token) setGeneratedLink(`${window.location.origin}?rate=${data[0].token}`);
      }).catch(() => {});
  }, [userInfo.email, screen]);

  // Auto-save self assessment progress to Supabase
  useEffect(() => {
    if (!userInfo.email || screen < 3) return;
    const timer = setTimeout(async () => {
      try {
        // Try to update existing row first, then insert
        const existing = await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&rater_role=eq.self&select=id&limit=1`);
        if (existing && existing.length > 0) {
          await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&rater_role=eq.self`, {
            method: "PATCH",
            body: JSON.stringify({
              ratings: ratings["self"] || {},
              comments: comments["self"] || {},
              strengths: strengths["self"] || "",
              development: development["self"] || "",
              owner_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
              owner_role: userInfo.role,
            }),
          });
        } else {
          await sbFetch("/leadership_invitations", {
            method: "POST",
            body: JSON.stringify({
              owner_email: userInfo.email,
              owner_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
              owner_role: userInfo.role,
              rater_role: "self",
              rater_email: userInfo.email,
              ratings: ratings["self"] || {},
              comments: comments["self"] || {},
              strengths: strengths["self"] || "",
              development: development["self"] || "",
              completed: false,
            }),
          });
        }
      } catch (e) { console.error("Auto-save failed:", e); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [ratings, comments, strengths, development, userInfo.email]);

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
  const selfExcluded = []; // show all 15 questions for self
  const requiredForSelf = COMPETENCIES.filter(c => !selfExcluded.includes(c.id)).length;
  const currentRaterDone = currentRater === "self" 
    ? Object.keys(ratings["self"] || {}).filter(k => !selfExcluded.includes(k)).length >= requiredForSelf
    : Object.keys(ratings[currentRater] || {}).length === COMPETENCIES.length;

  const generateReport = async () => {
    setReportLoading(true);
    // Load latest stakeholder responses fresh from Supabase
    let freshStakeholderData = { ...stakeholderData };
    try {
      const allData = await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&completed=eq.true&select=*`);
      const tokenData = await Promise.all(Object.values(inviteTokens).map(t => sbFetch(`/leadership_invitations?token=eq.${t}&completed=eq.true&select=*`).catch(() => [])));
      const combined = [...(allData || []), ...tokenData.flat()].filter(Boolean);
      const deduped = Object.values(Object.fromEntries(combined.map(r => [r.id, r])));
      if (deduped.length > 0) {
        const grouped = {};
        deduped.forEach(inv => { const role = inv.rater_role; if (!grouped[role]) grouped[role] = []; grouped[role].push(inv); });
        const newStatusData = {};
        Object.entries(grouped).forEach(([role, invites]) => {
          const isManager = role === "Line Manager";
          const avgRatings = {};
          const avgComments = {};
          const strengthsList = invites.map(i => i.strengths).filter(Boolean).join(" | ");
          const developmentList = invites.map(i => i.development).filter(Boolean).join(" | ");
          COMPETENCIES.forEach(c => {
            const scores = invites.map(i => i.ratings?.[c.id] || 0).filter(s => s > 0);
            if (scores.length > 0) avgRatings[c.id] = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length * 10) / 10;
            const comms = invites.map(i => i.comments?.[c.id]).filter(Boolean);
            if (comms.length > 0) avgComments[c.id] = comms.join(" | ");
          });
          const raterNames = invites.map(i => i.rater_name).filter(Boolean).join(", ");
          const roleKey = normalizeRoleKey(role);
          const isSr = role === "Senior Stakeholder";
          const minReq = (isManager || isSr) ? 1 : 3;
          const entry = { role, ratings: avgRatings, comments: avgComments, strengths: strengthsList, development: developmentList, count: invites.length, raterName: raterNames, meetsMin: invites.length >= minReq };
          newStatusData[roleKey] = entry;
          if (entry.meetsMin) freshStakeholderData[roleKey] = entry;
        });
        setStatusData(newStatusData);
        setStakeholderData(freshStakeholderData);
      }
    } catch(e) { console.error("Failed to load stakeholder data for report:", e); }
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
        ...Object.values(freshStakeholderData),
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
        const behaviourList = p.competencies.map(c => {
          const stakeholderScores = otherRaters.map(r => r.ratings[c.id] || 0).filter(s => s > 0);
          const avg = stakeholderScores.length > 0 ? (stakeholderScores.reduce((a,b)=>a+b,0)/stakeholderScores.length).toFixed(1) : "N/A";
          return `  - ${c.name} [${p.name} pillar]: Self=${selfRatings[c.id]||0}/5, Stakeholder avg=${avg}/5`;
        }).join("\n");
        return `${p.name} pillar: Self avg=${selfAvg}/5${stakeholderBreakdown ? `, Stakeholders: ${stakeholderBreakdown}` : ""}\nBehaviours:\n${behaviourList}`;
      });

      const strengthsFeedback = allRaterData.filter(r => r.strengths?.trim()).map(r => `${r.name}: ${r.strengths}`).join("\n");
      const developmentFeedback = allRaterData.filter(r => r.development?.trim()).map(r => `${r.name}: ${r.development}`).join("\n");

      const behaviourScores2 = COMPETENCIES.map(c => {
        const otherScores = otherRaters.map(r => r.ratings[c.id] || 0).filter(s => s > 0);
        const avg = otherScores.length > 0 ? otherScores.reduce((a,b)=>a+b,0)/otherScores.length : 0;
        const pillar = PILLARS.find(p => p.competencies.some(pc => pc.id === c.id));
        return { name: c.name, avg, pillar: pillar?.name || "" };
      }).filter(b => b.avg > 0).sort((a,b) => b.avg - a.avg);
      const topScore2 = behaviourScores2[2]?.avg;
      const bottomScore2 = behaviourScores2[behaviourScores2.length-3]?.avg;
      const topBehaviours2 = topScore2 ? behaviourScores2.filter(b => b.avg >= topScore2) : behaviourScores2.slice(0,3);
      const bottomBehaviours2 = bottomScore2 ? behaviourScores2.filter(b => b.avg <= bottomScore2) : behaviourScores2.slice(-3).reverse();

      const prompt = `You are an executive leadership coach analysing a 360-degree leadership assessment using the Parity Coaching Leadership Competency Framework.

Leader: ${userInfo.firstName} ${userInfo.lastName} (${userInfo.role})
Number of stakeholder groups: ${otherRaters.length}

CRITICAL PILLAR-BEHAVIOUR MAPPING (never mix these up):
- DELIVERY pillar: Track Record of Delivery, Sound Decision Making, Perseverance, Composure & Learning, Change Implementation
- CAPACITY pillar: Strategic Mindset, Innovation & Challenge, Broader Organisational Impact, Curiosity & Stakeholder Engagement, Strategic Problem Solving
- PEOPLE pillar: Effective Delegation, Talent Development, Peer Collaboration, Senior Stakeholder Relationships, Conflict Resolution

Pillar scores with behaviour breakdown:
${pillarLines.join("\n\n")}

Top behaviours (highest stakeholder scores): ${topBehaviours2.map(b => `${b.name} (${b.pillar}, ${b.avg.toFixed(1)}/5)`).join(", ")}
Bottom behaviours (lowest stakeholder scores): ${bottomBehaviours2.map(b => `${b.name} (${b.pillar}, ${b.avg.toFixed(1)}/5)`).join(", ")}

${(() => {
        const sortedBehaviours = COMPETENCIES.map(c => {
          const pillar = PILLARS.find(p => p.competencies.some(pc => pc.id === c.id));
          const stakeholderScores = otherRaters.map(r => r.ratings[c.id] || 0).filter(s => s > 0);
          const avg = stakeholderScores.length > 0 ? (stakeholderScores.reduce((a,b)=>a+b,0)/stakeholderScores.length).toFixed(1) : "N/A";
          return `${avg}/5 - ${c.name} (${pillar?.name} pillar)`;
        }).sort((a,b) => parseFloat(a) - parseFloat(b));
        return `ALL 15 BEHAVIOURS RANKED BY STAKEHOLDER SCORE (lowest first — use the LOWEST for coaching goals):
${sortedBehaviours.join("\n")}`;
      })()}

${strengthsFeedback ? `Qualitative Strengths: ${strengthsFeedback}` : ""}
${developmentFeedback ? `Qualitative Development Areas: ${developmentFeedback}` : ""}

CRITICAL RULE: ONLY generate goals based on the BOTTOM behaviours and WEAKEST pillar averages listed above. NEVER generate a goal targeting a top-scoring behaviour or strength. If a behaviour scores 4 or 5, do NOT use it as a basis for a coaching goal.

FOLLOW WILSON'S EXACT COACHING STANDARD (ICF MCC). Match this quality and depth exactly using the client's actual data:

EXAMPLE 1 - "Shifting from Executor to Strategic Contributor"
Objective: To elevate the client's ability to move beyond operational execution and actively shape strategic direction. This addresses the Capacity pillar's low scores in strategic mindset (2) and the overall 2.8 average, which is the weakest of the three pillars.
Client benefits: Greater confidence and credibility in senior-level discussions; a sense of being valued not just for "getting things done" but for shaping the agenda itself; reduced frustration from feeling stuck in execution while others set direction.
Org benefits: Stronger alignment between the client's work and the company's long-term vision; more robust strategic conversations with diverse input; faster identification of emerging opportunities and risks because the client is thinking ahead rather than just responding.

EXAMPLE 2 - "Building Confidence and Capability to Challenge the Status Quo"
Objective: To develop the client's willingness and skill to constructively question existing practices, processes, and assumptions. This directly targets the Capacity trait "thinks outside the box and challenges the status quo," which scored 2 – one of the lowest in the assessment.
Client benefits: Increased influence and visibility as someone who brings fresh perspectives; greater personal satisfaction from contributing to meaningful change; reduced internal tension from holding back ideas that could add value.
Org benefits: A culture that is more open to innovation and continuous improvement; earlier detection of outdated or inefficient practices; better decision-making through diverse viewpoints being surfaced and considered.

EXAMPLE 3 - "Developing Talent and Growing Others (with or without Formal Authority)"
Objective: To expand the client's ability to develop, mentor, and elevate the capabilities of colleagues around them – even without direct reporting lines. This addresses the People trait "attracts and develops talents," which scored 2 – one of the lowest in the assessment.
Client benefits: A stronger personal brand as a leader who invests in others; deeper, more trusting relationships across the organisation; greater sense of purpose and legacy from seeing others grow as a result of their support.
Org benefits: Broader capability-building without relying solely on formal L&D programmes; improved retention as colleagues feel valued and mentored; a healthier talent pipeline that is not dependent on a single manager or structure.

EXAMPLE 4 - "Moving from Personal Excellence to Systemic Influence"
Objective: To broaden the client's perspective from their immediate role or team to the wider organisational system, ensuring decisions consider ripple effects across functions and geographies. This builds on the Capacity trait "considers broader impacts" (score 3) and the overall need to strengthen systemic thinking.
Client benefits: Enhanced reputation as a cross-functional collaborator and mature leader; greater ability to anticipate unintended consequences of decisions; more meaningful engagement with senior stakeholders who value big-picture thinking.
Org benefits: More cohesive, aligned decision-making across silos; reduced friction between departments as decisions are made with mutual impact in mind; stronger organisational resilience because leaders are thinking holistically, not just locally.

EXAMPLE 5 - "Combining Resilience with Strategic Patience"
Objective: To help the client balance their natural strength in action, perseverance, and decisiveness (Delivery average 4.0) with more deliberate strategic reflection, avoiding the trap of "doing more" instead of "thinking differently." This addresses the gap between the client's strongest pillar and their weakest pillar (Capacity 2.8).
Client benefits: Reduced burnout from over-reliance on hustle and persistence; better-quality decisions from allowing space for reflection; a more sustainable approach to challenges that leverages both action and insight.
Org benefits: More thoughtful, less reactive leadership; better resource allocation because time and energy are invested in the right priorities; a leadership culture that models the value of reflection alongside execution, encouraging others to do the same.

NOW generate 5 goals for THIS client using their actual scores. STRICT RULES:
- Each objective MUST reference BOTH the specific behaviour score AND the pillar average
- Client benefits MUST include emotional/identity shift language ("a sense of...", "reduced frustration from...", "greater personal satisfaction from...")
- Org benefits MUST include cause-effect specificity ("because the client is...", "so that...")
- Goal 5 should contrast the client's STRONGEST pillar vs their WEAKEST pillar
- ONLY target behaviours scoring 3/5 or below — NEVER use a behaviour scoring 4 or 5
- Cover different pillars — do not write 5 goals about the same pillar
- Always generate EXACTLY 5 goals

Generate EXACTLY 5 coaching goal options. Respond ONLY in JSON:
{
  "headline": "A 1-sentence leadership statement",
  "top3": ["top behaviour 1", "top behaviour 2", "top behaviour 3"],
  "bottom3": ["bottom behaviour 1", "bottom behaviour 2", "bottom behaviour 3"],
  "coaching_goals": [
    {
      "title": "Aspirational identity-shift title",
      "objective": "1-2 sentences referencing the specific pillar name and behaviour score",
      "client_benefits": "2-3 emotional and professional benefits in second person",
      "org_benefits": "2-3 specific business impact benefits",
      "based_on": "specific behaviour name and pillar"
    }
  ]
}`;

      const response = await fetch(window.location.hostname === "localhost" ? "/openai/v1/chat/completions" : "/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 2000, messages: [{ role: "user", content: prompt }] })
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = clean ? JSON.parse(clean) : {};
      // Ensure coaching_goals always populated
      if (!parsed.coaching_goals?.length) {
        parsed.coaching_goals = [
          { title: "Strengthen Talent Development", objective: "Build a more structured approach to developing and growing your team members.", client_benefits: "A stronger personal brand as a leader who invests in others; deeper trust across the organisation.", org_benefits: "Improved retention as colleagues feel valued and mentored; a healthier talent pipeline.", based_on: "Talent Development" },
          { title: "Build a Conflict Resolution Framework", objective: "Develop a consistent, constructive approach to resolving conflicts within your team and with peers.", client_benefits: "Reduced stress from unresolved tension; stronger working relationships.", org_benefits: "A healthier team culture and faster resolution of blockers.", based_on: "Conflict Resolution" },
          { title: "Strengthen Strategic Contribution", objective: "Increase your visibility and influence in strategic discussions with senior stakeholders.", client_benefits: "Greater confidence and credibility in senior-level discussions.", org_benefits: "Stronger alignment between your work and the company long-term vision.", based_on: "Strategic Problem Solving" },
          { title: "Shift from Executor to Strategic Contributor", objective: "Move beyond operational execution to actively shape strategic direction.", client_benefits: "A sense of being valued for shaping the agenda, not just delivering on it.", org_benefits: "More robust strategic conversations with diverse input.", based_on: "Strategic Mindset" },
          { title: "Challenge the Status Quo Constructively", objective: "Develop the confidence and skill to question existing practices and assumptions.", client_benefits: "Increased influence and visibility as someone who brings fresh perspectives.", org_benefits: "A culture more open to innovation and continuous improvement.", based_on: "Innovation & Challenge" },
        ];
      }

      // Ensure top3/bottom3 always populated from LM data
      if (!parsed.top3?.length || !parsed.bottom3?.length) {
        const lmData2 = freshStakeholderData["line_manager"];
        const scores2 = COMPETENCIES.map(c => ({ name: c.name, score: lmData2?.ratings?.[c.id] || 0 })).filter(b => b.score > 0).sort((a,b) => b.score - a.score);
        parsed.top3 = scores2.slice(0, 3).map(b => b.name);
        parsed.bottom3 = [...scores2].reverse().slice(0, 3).map(b => b.name);
      }
      setReport(parsed);
      setSelectedGoals([]);
      setScreen(4);

      // Save report to Supabase and email link
      try {
        console.log("parsed:", JSON.stringify(parsed).slice(0,200), "freshStakeholderData keys:", Object.keys(freshStakeholderData));
        const reportHtml = generatePDFReport(parsed, freshStakeholderData, ratings["self"] || {});
        console.log("reportHtml length:", reportHtml?.length);
        if (reportHtml) {
          const reportLinkTemp = "pending";
          const saved = await sbFetch("/leadership_reports", {
            method: "POST",
            body: JSON.stringify({
              owner_email: userInfo.email,
              owner_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
              report_html: reportHtml,
              report_json: {
                ...parsed,
                self_ratings: ratings["self"] || {},
                lm_ratings: freshStakeholderData["line_manager"]?.ratings || {},
                lm_comments: freshStakeholderData["line_manager"]?.comments || {},
                lm_strengths: freshStakeholderData["line_manager"]?.strengths || "",
                lm_development: freshStakeholderData["line_manager"]?.development || "",
                lm_name: freshStakeholderData["line_manager"]?.raterName || "",
              },
              report_link: reportLinkTemp,
            }),
          });
          const reportId = saved?.[0]?.id;
          if (reportId) {
            const reportLink = `${window.location.origin}?report=${reportId}`;
            // Update with actual link
            await sbFetch(`/leadership_reports?id=eq.${reportId}`, {
              method: "PATCH",
              headers: { "Prefer": "return=minimal" },
              body: JSON.stringify({ report_link: reportLink }),
            });
            console.log("Report saved (email disabled for testing):", reportLink);
          }
        }
      } catch(emailErr) { console.error("Save/email failed:", emailErr); }

      // Send results to coach if user consented
      if (consentToShare) {
        try {
          const seniorityLabel = SENIORITY_LEVELS.find(s => s.id === seniority)?.label || seniority;
          const userEmail = currentUser?.email || "Anonymous";
          // Override AI top3/bottom3 with our calculated line manager scores
          parsed.top3 = top3;
          parsed.bottom3 = bottom3;
          const top3text = top3.join(", ");
          const bottom3text = bottom3.join(", ");
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
        top3: [],
        bottom3: [],
        coaching_goals: [
          { title: "Strengthen Talent Development", objective: "Build a more structured approach to developing and growing your team members.", client_benefits: "A stronger personal brand as a leader who invests in others; deeper trust across the organisation.", org_benefits: "Improved retention as colleagues feel valued and mentored; a healthier talent pipeline.", based_on: "Talent Development" },
          { title: "Build a Conflict Resolution Framework", objective: "Develop a consistent, constructive approach to resolving conflicts within your team and with peers.", client_benefits: "Reduced stress from unresolved tension; stronger working relationships.", org_benefits: "A healthier team culture and faster resolution of blockers.", based_on: "Conflict Resolution" },
          { title: "Strengthen Strategic Contribution", objective: "Increase your visibility and influence in strategic discussions with senior stakeholders.", client_benefits: "Greater confidence and credibility in senior-level discussions.", org_benefits: "Stronger alignment between your work and the company's long-term vision.", based_on: "Strategic Problem Solving" },
          { title: "Shift from Executor to Strategic Contributor", objective: "Move beyond operational execution to actively shape strategic direction.", client_benefits: "A sense of being valued for shaping the agenda, not just delivering on it.", org_benefits: "More robust strategic conversations with diverse input.", based_on: "Strategic Mindset" },
          { title: "Challenge the Status Quo Constructively", objective: "Develop the confidence and skill to question existing practices and assumptions.", client_benefits: "Increased influence and visibility as someone who brings fresh perspectives.", org_benefits: "A culture more open to innovation and continuous improvement.", based_on: "Innovation & Challenge" },
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
    const newTokens = { ...inviteTokens };
    const newSent = { ...inviteSent };

    // Build list of all email/rater pairs to invite
    const toInvite = [];
    let hasDupes = false;
    let hasSelf = false;
    const selfEmail = userInfo.email?.trim().toLowerCase();

    // Collect all already-invited emails for dupe checking
    const allAlreadyInvited = new Set([
      ...(Array.isArray(inviteEmails.peers) ? inviteEmails.peers : []).map(e => e?.trim().toLowerCase()).filter(Boolean),
      ...(Array.isArray(inviteEmails.direct_reports) ? inviteEmails.direct_reports : []).map(e => e?.trim().toLowerCase()).filter(Boolean),
      ...(Array.isArray(inviteEmails.others) ? inviteEmails.others : []).map(e => e?.trim().toLowerCase()).filter(Boolean),
      typeof inviteEmails.line_manager === "string" ? inviteEmails.line_manager.trim().toLowerCase() : "",
    ].filter(Boolean));

    // Line manager
    const mgEmail = (typeof newInviteEmails.line_manager === "string" ? newInviteEmails.line_manager : "").trim();
    if (mgEmail) {
      if (mgEmail.toLowerCase() === selfEmail) hasSelf = true;
      else if (allAlreadyInvited.has(mgEmail.toLowerCase())) hasDupes = true;
      else toInvite.push({ raterId: "line_manager", email: mgEmail });
    }

    // Multi-email raters
    for (const raterId of ["peers", "direct_reports", "others"]) {
      const emails = Array.isArray(newInviteEmails[raterId]) ? newInviteEmails[raterId] : [newInviteEmails[raterId] || ""];
      const seen = new Set();
      emails.filter(e => e?.trim()).forEach(e => {
        const lower = e.trim().toLowerCase();
        if (lower === selfEmail) { hasSelf = true; return; }
        if (allAlreadyInvited.has(lower) || seen.has(lower)) { hasDupes = true; return; }
        seen.add(lower);
        toInvite.push({ raterId, email: e.trim() });
      });
    }

    // Show error popups if needed
    if (hasSelf) { setDupeMsg("You cannot invite yourself."); setShowDupePopup(true); setTimeout(() => setShowDupePopup(false), 3500); }
    else if (hasDupes) { setDupeMsg("Some emails were already invited and skipped."); setShowDupePopup(true); setTimeout(() => setShowDupePopup(false), 3500); }

    if (toInvite.length === 0) { setInviteSending(false); return; }

    // Reset new inputs after sending
    setTimeout(() => setNewInviteEmails({ peers: [""], direct_reports: [""], others: [""], line_manager: "" }), 500);

    const raterTokens = {}; // raterId -> [tokens]

    for (const { raterId, email } of toInvite) {
      try {
        const raterInfo = RATER_TYPES.find(r => r.id === raterId);
        const result = await sbFetch("/leadership_invitations", {
          method: "POST",
          body: JSON.stringify({
            owner_email: userInfo.email || currentUser?.email || "",
            owner_name: `${userInfo.firstName} ${userInfo.lastName}`.trim() || "",
            owner_role: userInfo.role || "",
            rater_role: raterInfo?.label || raterId,
            rater_email: email,
          }),
        });
        const token = result?.[0]?.token;
        if (token) {
          if (!raterTokens[raterId]) raterTokens[raterId] = [];
          raterTokens[raterId].push(token);
          newTokens[`${raterId}_${token}`] = token;
          newSent[raterId] = (newSent[raterId] || 0) + 1;
          const assessmentLink = `${window.location.origin}?rate=${token}`;
          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: userInfo.firstName || "Someone",
            rater_role: raterInfo?.label || raterId,
            assessment_link: assessmentLink,
            email: email,
          });
        }
      } catch (e) {
        console.error("Failed to send invite to", email, e);
      }
    }
    setInviteTokens(newTokens);
    setInviteSent(newSent);
    // Track sent emails in inviteEmails for future dupe prevention
    setInviteEmails(prev => {
      const updated = { ...prev };
      toInvite.forEach(({ raterId, email }) => {
        if (raterId === "line_manager") {
          updated.line_manager = email;
        } else {
          const existing = Array.isArray(updated[raterId]) ? updated[raterId] : [];
          if (!existing.includes(email)) updated[raterId] = [...existing, email];
        }
      });
      return updated;
    });
    if (toInvite.length > 0) { setShowInviteSentPopup(true); setTimeout(() => setShowInviteSentPopup(false), 3000); }
    setInviteSending(false);
  };

  const generatePDFReport = (reportOverride = null, stakeholderOverride = null, selfRatingsOverride = null) => {
    const useReport = reportOverride || report;
    const useStakeholder = stakeholderOverride || stakeholderData;
    const useSelfRatings = selfRatingsOverride || (ratings["self"] || {});
    const selfRatings = useSelfRatings;
    const allRaters = [
      { key: "self", label: "Self", ratings: selfRatings, comments: comments["self"] || {}, strengths: strengths["self"] || "", development: development["self"] || "", name: `${userInfo.firstName} ${userInfo.lastName}`.trim() },
      ...Object.values(useStakeholder),
    ];

    // Calculate top/bottom with ties from LM data
    const lmRater = useStakeholder["line_manager"] || allRaters.find(r => r.key !== "self");
    const lmRatings = lmRater?.ratings || {};
    const scoredBehaviours = COMPETENCIES.map(c => ({ name: c.name, score: lmRatings[c.id] || 0 })).filter(b => b.score > 0).sort((a,b) => b.score - a.score);
    const top3Score = scoredBehaviours[2]?.score;
    const bottom3Score = scoredBehaviours[scoredBehaviours.length - 3]?.score;
    const topBehaviours = top3Score ? scoredBehaviours.filter(b => b.score >= top3Score) : scoredBehaviours.slice(0, 3);
    const bottomBehaviours = bottom3Score ? scoredBehaviours.filter(b => b.score <= bottom3Score) : scoredBehaviours.slice(-3).reverse();

    // Calculate top/bottom with ties from LM data
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
<title>Leadership Competency Assessment Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-size: 16px; font-family: 'Raleway', 'Lato', 'Arial', sans-serif; color: #2D1B4E; background: white; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  @media print { .page { padding: 20px; } .no-print { display: none; } }
  
  .header { background: linear-gradient(135deg, #2D1B4E, #4A2D6E); color: white; padding: 40px; margin: -40px -40px 40px; text-align: center; }
  .header img { height: 50px; object-fit: contain; margin-bottom: 16px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #C9843A; }
  .header p { font-size: 13px; opacity: 0.8; }
  .header .user { font-size: 18px; font-weight: 600; margin: 16px 0 4px; opacity: 0.9; }
  
  .section { margin-bottom: 32px; }
  .section-title { font-size: 18px; font-weight: 800; color: #1a1a2e; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
  
  .headline-box { background: #FDF8F3; border-left: 4px solid #C9843A; padding: 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0; }
  .headline-box p { font-size: 16px; font-style: italic; color: #1a1a2e; line-height: 1.6; font-weight: 600; }
  
  .pillar-cards { display: flex; gap: 16px; margin-bottom: 24px; }
  .pillar-card { flex: 1; padding: 16px; border-radius: 8px; text-align: center; }
  .pillar-card h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .pillar-card .score { font-size: 32px; font-weight: 800; }
  .pillar-card .label { font-size: 10px; margin-top: 4px; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  th { background: #2D1B4E; color: white; padding: 12px 10px; text-align: left; font-size: 14px; }
  td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 14px; }
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
    <h1>Leadership Competency Assessment Report</h1>
    <div class="user">${userInfo.firstName ? userInfo.firstName + " " + userInfo.lastName : (currentUser?.email || "Assessment Participant")}</div>
    ${stakeholderData["line_manager"]?.raterName ? `<p style="font-size:13px;margin-top:4px;opacity:0.85">Line Manager: <strong>${stakeholderData["line_manager"].raterName}</strong></p>` : ""}
    
    <p>${userInfo.role || ""} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
  </div>



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
        <th>Self</th>
        ${allRaters.filter(r => r.key !== "self").map(r => `<th>${r.role || r.label || r.key}</th>`).join("")}
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
          const lmComment = allRaters.find(r => r.key !== "self")?.comments?.[c.id] || "";
          return `<tr>
            <td>${c.name}<br><span style="font-size:13px;color:#64748b;font-style:italic;line-height:1.6">${c.description}</span>${lmComment ? `<br><span style="font-size:11px;font-weight:700;color:#C9843A;text-transform:uppercase;letter-spacing:0.5px">Line Manager Comments: </span><span style="font-size:12px;color:#4A3728;font-style:italic">"${lmComment}"</span>` : ""}</td>
            <td><span class="score-badge ${scoreClass(selfScore)}">${selfScore || "-"}</span></td>
            ${allRaters.filter(r => r.key !== "self").map(r => `<td><span class="score-badge ${scoreClass(r.ratings?.[c.id])}">${r.ratings?.[c.id] || "-"}</span></td>`).join("")}
            ${allRaters.length > 1 ? `<td style="color:${diffColor};font-weight:700">${diff !== "N/A" ? (parseFloat(diff) > 0 ? "+" : "") + diff : "-"}</td>` : ""}
          </tr>`;
        }).join("")}
      `).join("")}
    </table>
  </div>





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
    <!-- Top & Bottom Behaviours -->
    <div class="section">
      <div style="display:flex;gap:24px;margin-bottom:8px">
        <div style="flex:1;background:rgba(201,132,58,0.08);border:1px solid rgba(201,132,58,0.3);border-radius:10px;padding:20px">
          <div class="section-title" style="color:#C9843A;border-bottom-color:rgba(201,132,58,0.3)">Top 3 Behaviours</div>
          ${topBehaviours.map((b,i) => { const comp = COMPETENCIES.find(c => c.name === b.name); const comment = comp ? (lmRater?.comments?.[comp.id] || "") : ""; return `<div style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:12px"><span style="width:26px;height:26px;border-radius:50%;background:#C9843A;color:white;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${i+1}</span><span style="flex:1;font-size:13px;font-weight:500;color:#2D1B4E">${b.name}</span><span style="font-size:13px;font-weight:700;color:#C9843A">${b.score}/5</span></div>${comment ? `<p style="margin:3px 0 0 38px;font-size:11px;color:#6B5B7B">Line Manager Comment: <span style="font-style:italic;color:#4A3728">"${comment}"</span></p>` : ""}</div>`; }).join("")}
        </div>
        <div style="flex:1;background:rgba(91,45,142,0.06);border:1px solid rgba(91,45,142,0.3);border-radius:10px;padding:20px">
          <div class="section-title" style="color:#5B2D8E;border-bottom-color:rgba(91,45,142,0.3)">Bottom 3 Behaviours</div>
          ${bottomBehaviours.map((b,i) => { const comp = COMPETENCIES.find(c => c.name === b.name); const comment = comp ? (lmRater?.comments?.[comp.id] || "") : ""; return `<div style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:12px"><span style="width:26px;height:26px;border-radius:50%;background:#5B2D8E;color:white;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${i+1}</span><span style="flex:1;font-size:13px;font-weight:500;color:#2D1B4E">${b.name}</span><span style="font-size:13px;font-weight:700;color:#5B2D8E">${b.score}/5</span></div>${comment ? `<p style="margin:3px 0 0 38px;font-size:11px;color:#6B5B7B">Line Manager Comment: <span style="font-style:italic;color:#4A3728">"${comment}"</span></p>` : ""}</div>`; }).join("")}
        </div>
      </div>
    </div>

    <div class="section">
      <!-- Coaching Goals -->
      ${(() => {
        const goalsToShow = (selectedGoals && selectedGoals.length > 0)
          ? selectedGoals.map(i => useReport.coaching_goals?.[i]).filter(Boolean)
          : (useReport.coaching_goals || []);
        if (!goalsToShow.length) return "";
        return `<div class="section">
          <div class="section-title">Coaching Goals</div>
          ${goalsToShow.map((g, i) => `
            <div style="padding:16px;background:#FDF8F3;border:1px solid rgba(201,132,58,0.3);border-radius:10px;margin-bottom:14px;">
              <h4 style="margin:0 0 8px;font-size:15px;color:#2D1B4E;font-weight:700">Goal ${i+1}: ${g.title || g.goal || ""}</h4>
              ${g.objective ? `<p style="margin:0 0 8px;font-size:13px;color:#4A3728;line-height:1.6"><strong>Objective:</strong> ${g.objective}</p>` : ""}
              ${g.client_benefits ? `<p style="margin:0 0 8px;font-size:13px;color:#2D1B4E;line-height:1.6"><strong>Benefits for you:</strong> ${g.client_benefits}</p>` : ""}
              ${g.org_benefits ? `<p style="margin:0;font-size:13px;color:#2D1B4E;line-height:1.6"><strong>Benefits for the organisation:</strong> ${g.org_benefits}</p>` : ""}
            </div>`).join("")}
        </div>`;
      })()}

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



  <div class="footer">
    <p><strong>Parity Coaching</strong> · sayhello@paritycoaching.org · www.paritycoaching.org</p>
    <p style="margin-top:4px">This report was generated using the Parity Coaching Leadership Competency Framework</p>
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
</body>
</html>`;

    if (reportOverride !== null) return html;
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

  // ── Screen 1: Email entry + load existing ────────────────────────────────────
  if (screen === 1) {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email);

    const handleEmailNext = async () => {
      if (!emailValid) { setEmailError("Please enter a valid email."); return; }
      setEmailLoading(true);
      setEmailError("");
      try {
        // Load all invitations for this email (as owner)
        const allData = await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&select=*`);
        
        if (allData && allData.length > 0) {
          const profile = allData.find(r => r.owner_name);
          if (profile?.owner_name) {
            // Restore name/role
            const [fn, ...ln] = (profile.owner_name || "").split(" ");
            setUserInfo(prev => ({ ...prev, firstName: fn || "", lastName: ln.join(" ") || "", role: profile.owner_role || "" }));
          }

          // Restore self assessment
          const selfRow = allData.find(r => r.rater_role === "self" || r.rater_email === userInfo.email);
          if (selfRow?.ratings && Object.keys(selfRow.ratings).length > 0) {
            setRatings(prev => ({ ...prev, self: selfRow.ratings }));
            if (selfRow.comments) setComments(prev => ({ ...prev, self: selfRow.comments }));
            if (selfRow.strengths) setStrengths(prev => ({ ...prev, self: selfRow.strengths }));
            if (selfRow.development) setDevelopment(prev => ({ ...prev, self: selfRow.development }));
          }

          // Restore invited stakeholders - show their tokens, emails and completion status
          const invited = allData.filter(r => r.rater_email !== userInfo.email && r.token);
          if (invited.length > 0) {
            const restoredTokens = {};
            const restoredSent = {};
            const restoredEmails = { peers: [], direct_reports: [], others: [], line_manager: "" };
            const restoredCompleted = {};

            invited.forEach(r => {
              const roleKey = r.rater_role?.toLowerCase().replace(/\s+/g, '_') || "others";
              restoredTokens[`${roleKey}_${r.token}`] = r.token;
              restoredSent[roleKey] = (restoredSent[roleKey] || 0) + 1;
              if (r.completed) restoredCompleted[r.token] = true;

              // Restore email into the right slot
              if (roleKey === "line_manager") {
                restoredEmails.line_manager = r.rater_email;
              } else if (["peers", "direct_reports", "others"].includes(roleKey)) {
                restoredEmails[roleKey] = [...(restoredEmails[roleKey] || []), r.rater_email];
              }
            });

            // Ensure at least one empty slot for multi-email raters
            ["peers", "direct_reports", "others"].forEach(k => {
              if (!restoredEmails[k] || restoredEmails[k].length === 0) restoredEmails[k] = [""];
            });

            setInviteTokens(restoredTokens);
            setInviteSent(restoredSent);
            setInviteEmails(restoredEmails);

            // Load completed stakeholder responses
            const completedInvites = invited.filter(r => r.completed);
            if (completedInvites.length > 0) {
              const grouped = {};
              completedInvites.forEach(inv => {
                const role = inv.rater_role;
                if (!grouped[role]) grouped[role] = [];
                grouped[role].push(inv);
              });
              const newStakeholderData = {};
              Object.entries(grouped).forEach(([role, invites]) => {
                const isManager = role === "Line Manager";
                if (invites.length >= (isManager ? 1 : 3)) {
                  const avgRatings = {};
                  COMPETENCIES.forEach(c => {
                    const scores = invites.map(i => i.ratings?.[c.id] || 0).filter(s => s > 0);
                    if (scores.length > 0) avgRatings[c.id] = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length * 10) / 10;
                  });
                  const roleKey = role.toLowerCase().replace(/\s+/g, '_');
                  newStakeholderData[roleKey] = { role, ratings: avgRatings, comments: {}, strengths: "", development: "", count: invites.length };
                }
              });
              if (Object.keys(newStakeholderData).length > 0) setStakeholderData(newStakeholderData);
            }
          }

          setEmailLoading(false);
          if (profile?.owner_name) {
            // Check if self assessment is complete
            const selfComplete = selfRow?.ratings && Object.keys(selfRow.ratings).length >= COMPETENCIES.length;
            const hasInvited = invited.length > 0;
            if (selfComplete || hasInvited) {
              setCurrentRater("self");
              setScreen(3.5); // Go straight to invite/generate page
            } else {
              setCurrentRater("self");
              setScreen(3); // Continue self assessment
            }
          } else {
            setScreen(1.5); // Has email but no name yet
          }
          return;
        }
      } catch (e) { console.error(e); }
      setEmailLoading(false);
      setScreen(1.5); // New user
    };

    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 44, objectFit: "contain" }} />
          </div>
          <div style={styles.moduleTag}>Leadership Assessment</div>
          <h1 style={{ ...styles.title, marginTop: 12 }}>Start Assessment</h1>
          <p style={styles.subtitle}>Enter your email to begin or continue your assessment.</p>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#2D1B4E", margin: "0 0 6px" }}>Email Address *</p>
            <input type="email" value={userInfo.email} autoFocus
              onChange={(e) => { setUserInfo(prev => ({ ...prev, email: e.target.value })); setEmailError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleEmailNext()}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "12px 14px", background: "#fff", border: `1px solid ${emailError ? "#E85D75" : "rgba(45,27,78,0.2)"}`, borderRadius: 8, color: "#2D1B4E", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            {emailError && <p style={{ color: "#E85D75", fontSize: 12, margin: "6px 0 0" }}>{emailError}</p>}
          </div>

          <button onClick={handleEmailNext} disabled={!emailValid || emailLoading}
            style={{ ...styles.btnPrimary, width: "100%", opacity: emailValid && !emailLoading ? 1 : 0.4 }}>
            {emailLoading ? "Checking..." : "Continue →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 1.5: Name & Role ───────────────────────────────────────────────────
  if (screen === 1.5) return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #C9843A" }}>
          <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 44, objectFit: "contain" }} />
        </div>
        <button onClick={() => setScreen(1)} style={{ ...styles.backBtn, marginBottom: 16 }}>← Back</button>
        <div style={styles.moduleTag}>Leadership Assessment</div>
        <h1 style={{ ...styles.title, marginTop: 12 }}>Your Details</h1>
        <p style={styles.subtitle}>Tell us a bit about yourself.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2D1B4E", margin: "0 0 6px" }}>First Name *</p>
              <input type="text" value={userInfo.firstName} autoFocus
                onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="First name"
                style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid rgba(45,27,78,0.2)", borderRadius: 8, color: "#2D1B4E", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2D1B4E", margin: "0 0 6px" }}>Last Name *</p>
              <input type="text" value={userInfo.lastName}
                onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
                style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid rgba(45,27,78,0.2)", borderRadius: 8, color: "#2D1B4E", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#2D1B4E", margin: "0 0 6px" }}>Job Role / Title *</p>
            <input type="text" value={userInfo.role}
              onChange={(e) => setUserInfo(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g. Senior Manager, Director"
              style={{ width: "100%", padding: "10px 14px", background: "#fff", border: "1px solid rgba(45,27,78,0.2)", borderRadius: 8, color: "#2D1B4E", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={() => { setCurrentRater("self"); setScreen(3); }}
          disabled={!userInfo.firstName || !userInfo.lastName || !userInfo.role}
          style={{ ...styles.btnPrimary, width: "100%", opacity: userInfo.firstName && userInfo.lastName && userInfo.role ? 1 : 0.4 }}>
          Start Assessment →
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
              <div key={val} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(45,27,78,0.05)", borderRadius: 6, border: "1px solid rgba(45,27,78,0.09)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: RATING_LABELS[val].color }}>{val}</span>
                <span style={{ fontSize: 11, color: "#8B7B9B" }}>{RATING_LABELS[val].label}</span>
              </div>
            ))}
          </div>

          {/* Pillars */}
          {PILLARS.map((pillar) => (
            <div key={pillar.id} style={{ marginBottom: 32 }}>
              <div style={{ padding: "14px 18px", background: pillar.color + "15", border: `1px solid ${pillar.color}30`, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: pillar.color }}>{pillar.name}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8B7B9B", lineHeight: 1.5 }}>{pillar.description}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {pillar.competencies.map((comp, ci) => {
                  const score = getRating(comp.id);
                  const comment = getComment(comp.id);
                  return (
                    <div key={comp.id} style={{ padding: "16px 18px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.08)", borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: pillar.color + "22", border: `1px solid ${pillar.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: pillar.color, flexShrink: 0 }}>{ci + 1}</div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>{comp.name}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: pillar.color + "aa", lineHeight: 1.4 }}>{comp.description}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map((val) => {
                          const selected = score === val;
                          const ratingInfo = RATING_LABELS[val];
                          return (
                            <button key={val} onClick={() => setRating(comp.id, val)}
                              style={{ flex: 1, padding: "8px 2px", borderRadius: 8, minWidth: 0, border: selected ? `2px solid ${pillar.color}` : `1px solid ${pillar.color}44`, background: selected ? pillar.color + "22" : pillar.color + "08", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: pillar.color }}>{val}</span>
                              <span style={{ fontSize: 9, color: pillar.color + "aa", fontWeight: 600 }}>{ratingInfo.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <textarea value={comment} onChange={(e) => setComment(comp.id, e.target.value)}
                        placeholder="Add specific examples or observations (optional)..." rows={2}
                        style={{ width: "100%", padding: "8px 12px", background: pillar.color + "08", border: `1px solid ${pillar.color}33`, borderRadius: 8, color: pillar.color, fontSize: 12, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
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
              <p style={{ color: "#6B5B7B", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {currentRater === "self" ? "What are your greatest strengths? Please describe." : "What are this person's greatest strengths? Please describe."}
              </p>
              <textarea value={strengths[currentRater] || ""} onChange={(e) => setStrengths(prev => ({ ...prev, [currentRater]: e.target.value }))}
                placeholder="Describe key strengths with specific examples..." rows={3}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div>
              <p style={{ color: "#6B5B7B", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {currentRater === "self" ? "What are your main areas for development? Please describe." : "What are this person's main areas for development? Please describe."}
              </p>
              <textarea value={development[currentRater] || ""} onChange={(e) => setDevelopment(prev => ({ ...prev, [currentRater]: e.target.value }))}
                placeholder="Describe areas for growth with specific suggestions..." rows={3}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.06)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>}

          {currentRaterDone ? (
            <button onClick={async () => {
              // Save self assessment progress before moving on
              try {
                await sbFetch("/leadership_invitations", {
                  method: "POST",
                  headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
                  body: JSON.stringify({
                    owner_email: userInfo.email,
                    owner_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
                    owner_role: userInfo.role,
                    rater_role: "self",
                    rater_email: userInfo.email,
                    ratings: ratings["self"] || {},
                    comments: comments["self"] || {},
                    strengths: strengths["self"] || "",
                    development: development["self"] || "",
                    completed: false,
                  }),
                });
              } catch(e) {}
              setScreen(3.5);
            }}
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

  // ── Screen 3.5: Invite & Generate ───────────────────────────────────────────
  if (screen === 3.5) {
    const selfDone = Object.keys(ratings["self"] || {}).length >= COMPETENCIES.length;
    const hasManager = statusData["line_manager"]?.count > 0;
    const hasSenior = statusData["senior_stakeholder"]?.count >= 1;
    const hasPeers = statusData["peers"]?.count >= 3;
    const hasDirectReports = statusData["direct_reports"]?.count >= 3;
    const hasAnyStakeholder = hasManager || hasSenior || hasPeers || hasDirectReports;
    const canGenerate = selfDone && hasAnyStakeholder;

    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 40, objectFit: "contain" }} />
          </div>
          <button onClick={() => setScreen(3)} style={{ ...styles.backBtn, marginBottom: 24, display: "block" }}>← Back</button>
          <div style={styles.moduleTag}>Leadership Competency Assessment</div>

          {/* Success/error popups */}
          {showInviteSentPopup && (
            <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "14px 24px", background: "#2D1B4E", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#C9843A", fontSize: 18 }}>✓</span>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Link generated successfully!</span>
            </div>
          )}
          {showDupePopup && (
            <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "14px 24px", background: "#E85D75", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{dupeMsg}</span>
            </div>
          )}

          {/* Self complete */}
          <div style={{ padding: "14px 18px", background: "rgba(201,132,58,0.1)", border: "1px solid #C9843A", borderRadius: 12, marginBottom: 24, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#C9843A" }}>Self Assessment Complete</p>
          </div>

          {/* Line Manager invite */}
          <div style={{ padding: "20px", background: "linear-gradient(135deg, rgba(45,27,78,0.05), rgba(201,132,58,0.05))", border: "1px solid rgba(201,132,58,0.3)", borderRadius: 14, marginBottom: 20 }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#2D1B4E", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invite Stakeholders</p>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#8B7B9B" }}>Generate a private assessment link to share with your stakeholders.</p>
            <p style={{ margin: "0 0 12px", fontSize: 11, color: "#8B7B9B" }}>Minimum responses needed: Line Manager ×1 · Senior Stakeholder ×1 · Peers ×3 · Direct Reports ×3</p>

            {/* Status rows for all rater types */}
            {[
              { id: "line_manager", label: "Line Manager", minRequired: 1 },
              { id: "senior_stakeholder", label: "Senior Stakeholder", minRequired: 1 },
              { id: "peers", label: "Peers", minRequired: 3 },
              { id: "direct_reports", label: "Direct Reports", minRequired: 3 },
            ].map(({ id, label, minRequired }) => {
              const status = statusData[id];
              const meetsMin = status?.count >= minRequired;
              return (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fff", borderRadius: 8, marginBottom: 8, border: "1px solid rgba(45,27,78,0.1)" }}>
                  <span style={{ fontSize: 13, color: "#4A2D6E", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: meetsMin ? "#C9843A" : status ? "#8B5A1E" : "#8B7B9B" }}>
                    {status ? (meetsMin ? `${status.count} completed ✓` : `${status.count}/${minRequired} responses`) : "Awaiting response"}
                  </span>
                </div>
              );
            })}




          </div>

          {/* Generate invitation link */}
          {generatedLink ? (
            <div style={{ padding: "12px 14px", background: "#fff", border: "1.5px solid #C9843A", borderRadius: 10, marginBottom: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#C9843A" }}>Share this link with your stakeholders:</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input readOnly value={generatedLink}
                  style={{ flex: 1, padding: "8px 10px", background: "#f9f6f2", border: "1px solid rgba(45,27,78,0.15)", borderRadius: 6, fontSize: 11, color: "#2D1B4E", fontFamily: "inherit", outline: "none" }} />
                <button onClick={() => { navigator.clipboard.writeText(generatedLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ padding: "8px 14px", background: "#2D1B4E", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

            </div>
          ) : (
            <button onClick={async () => {
              setInviteSending(true);
              try {
                // Always reuse existing pending token for this user
                const existing = await sbFetch(`/leadership_invitations?owner_email=eq.${encodeURIComponent(userInfo.email)}&rater_role=eq.pending&completed=eq.false&select=token&limit=1`);
                let token = existing?.[0]?.token;
                if (!token) {
                  const result = await sbFetch("/leadership_invitations", {
                    method: "POST",
                    body: JSON.stringify({ owner_email: userInfo.email, owner_name: `${userInfo.firstName} ${userInfo.lastName}`.trim(), owner_role: userInfo.role, rater_role: "pending", rater_email: "pending" }),
                  });
                  token = result?.[0]?.token;
                }
                if (token) {
                  const link = `${window.location.origin}?rate=${token}`;
                  setGeneratedLink(link);
                  setShowInviteSentPopup(true);
                  setTimeout(() => setShowInviteSentPopup(false), 3000);
                }
              } catch(e) {}
              setInviteSending(false);
            }} style={{ ...styles.btnSecondary, width: "100%", marginBottom: 12 }}>
              {inviteSending ? "Generating..." : "Generate Invitation Link"}
            </button>
          )}

          {/* Check responses */}
          <button onClick={loadStakeholderResponses} disabled={loadingStakeholders}
            style={{ ...styles.btnSecondary, width: "100%", marginBottom: 16, opacity: loadingStakeholders ? 0.7 : 1 }}>
            {loadingStakeholders ? "Checking..." : "Check for New Responses"}
          </button>

          <div style={{ height: 1, background: "rgba(45,27,78,0.1)", margin: "8px 0 16px" }} />



          {!canGenerate && (
            <p style={{ fontSize: 12, color: "#8B5A1E", marginBottom: 8, textAlign: "center" }}>
              Waiting for Line Manager to complete their assessment
            </p>
          )}

          <button onClick={generateReport} disabled={!canGenerate || reportLoading}
            style={{ ...styles.btnPrimary, width: "100%", background: "linear-gradient(135deg, #5B2D8E, #2D1B4E)", opacity: canGenerate && !reportLoading ? 1 : 0.5 }}>
            {reportLoading ? "Generating your report..." : "Generate Report →"}
          </button>
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
          <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #C9843A" }}>
            <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 40, objectFit: "contain" }} />
          </div>
          <button onClick={() => setScreen(3.5)} style={styles.backBtn}>← Back to Status</button>
          <div style={{ marginTop: 16 }} />
          <div style={styles.moduleTag}>Leadership Brand Assessment</div>



          {/* Pillar summary scores */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {PILLARS.map((pillar) => {
              const selfAvg = (pillar.competencies.reduce((sum, c) => sum + (selfRatings[c.id] || 0), 0) / pillar.competencies.length).toFixed(1);
              const allStakeholders = Object.values(stakeholderData);
              const stakeholderVals = allStakeholders.map(s =>
                pillar.competencies.reduce((sum, c) => sum + (s.ratings?.[c.id] || 0), 0) / pillar.competencies.length
              ).filter(v => v > 0);
              const othersAvg = stakeholderVals.length > 0 ? (stakeholderVals.reduce((a,b)=>a+b,0)/stakeholderVals.length).toFixed(1) : null;
              const label = allStakeholders.length > 1 ? "Others Avg / 5.0" : allStakeholders.length === 1 ? `${allStakeholders[0].role} / 5.0` : "Self / 5.0";
              return (
                <div key={pillar.id} style={{ flex: 1, minWidth: 120, padding: "14px", background: pillar.color + "12", border: `1px solid ${pillar.color}30`, borderRadius: 12, textAlign: "center" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: pillar.color }}>{pillar.name}</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1a0a2e" }}>{othersAvg || selfAvg}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8B7B9B" }}>{othersAvg ? label : "Self / 5.0"}</p>
                  {othersAvg && <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "#2D1B4E" }}>Self: {selfAvg}</p>}
                </div>
              );
            })}
          </div>

          {/* Behaviour breakdown by pillar */}
          <div style={{ marginBottom: 24 }}>
            {PILLARS.map((pillar) => (
              <div key={pillar.id} style={{ marginBottom: 24 }}>
                <p style={{ color: pillar.color, fontSize: 15, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{pillar.name}</p>
            {pillar.competencies.map((comp, i) => {
              const selfScore = selfRatings[comp.id] || 0;
              const avgOthers = getAvgOthers(comp.id);
              const gap = avgOthers !== null ? (avgOthers - selfScore).toFixed(1) : null;
              return (
                <div key={comp.id} style={{ marginBottom: 14, padding: "12px 14px", background: pillar.color + "0d", borderRadius: 10, border: "1px solid " + pillar.color + "25" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1a0a2e" }}>{comp.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8B7B9B", lineHeight: 1.4, fontStyle: "italic" }}>{comp.description}</p>
                      </div>
                    {gap !== null && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: Math.abs(gap) <= 0.5 ? "rgba(201,132,58,0.15)" : Math.abs(gap) <= 1 ? "rgba(244,162,97,0.15)" : "rgba(91,45,142,0.12)", color: Math.abs(gap) <= 0.5 ? "#C9843A" : Math.abs(gap) <= 1 ? "#E0A84A" : "#5B2D8E" }}>
                        {gap > 0 ? "+" : ""}{gap} gap
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      ["Self", selfScore, 0.6],
                      ...Object.values(stakeholderData).map(s => { const lbl = s.raterName ? `${s.role}\n(${s.raterName})` : (s.role || "Stakeholder"); return [lbl, s.ratings?.[comp.id] || null, 1]; })
                    ].filter(([,val]) => val !== null && val > 0).map(([label, val, opacity]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 110, flexShrink: 0 }}>{label.split("\n").map((ln, li) => <span key={li} style={{ fontSize: li===0?12:9, fontWeight: li===0?700:400, color: li===0?"#2D1B4E":"#5B2D8E", display:"block", lineHeight:1.2 }}>{ln}</span>)}</div>
                        <div style={{ flex: 1, height: 8, background: "rgba(45,27,78,0.07)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(val / 5) * 100}%`, height: "100%", background: PALETTE[i % PALETTE.length], borderRadius: 4, opacity, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ width: 30, fontSize: 12, color: "#6B5B7B", textAlign: "right" }}>{typeof val === "number" ? val.toFixed(1) : val}</span>
                      </div>
                    ))}
                  </div>
                  {/* LM comment for this behaviour */}
                  {(() => {
                    const lm = stakeholderData["line_manager"];
                    const comment = lm?.comments?.[comp.id];
                    if (!comment) return null;
                    return (
                      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#4A3728", lineHeight: 1.5, fontStyle: "italic", paddingLeft: 0 }}>
                        <span style={{ fontWeight: 600, fontStyle: "normal", color: "#2D1B4E" }}>Line Manager Comments: </span>"{comment}"
                      </p>
                    );
                  })()}
                </div>
              );
            })}
              </div>
            ))}
          </div>



          {/* Top 3 / Bottom 3 */}
          {(() => {
            const lm = stakeholderData["line_manager"];
            if (!lm?.ratings) return null;
            const scored = COMPETENCIES.map(c => ({ name: c.name, id: c.id, score: lm.ratings[c.id] || 0 })).filter(b => b.score > 0).sort((a,b) => b.score - a.score);
            if (scored.length === 0) return null;
            const top3Score = scored[2]?.score;
            const bottom3Score = scored[scored.length - 3]?.score;
            const tops = top3Score ? scored.filter(b => b.score >= top3Score) : scored.slice(0, 3);
            const bottoms = bottom3Score ? scored.filter(b => b.score <= bottom3Score) : scored.slice(-3).reverse();
            return (
              <div style={{ display:"flex", gap:12, marginBottom:24 }}>
                <div style={{ flex:1, padding:"14px", background:"rgba(201,132,58,0.08)", border:"1px solid rgba(201,132,58,0.3)", borderRadius:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#C9843A", textTransform:"uppercase", letterSpacing:"0.8px", margin:"0 0 10px" }}>Top 3 Behaviours</p>
                  {tops.map((b,i) => (
                    <div key={b.name} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:20, height:20, borderRadius:"50%", background:"#C9843A", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{i+1}</span>
                        <span style={{ flex:1, fontSize:12, color:"#2D1B4E" }}>{b.name}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#C9843A" }}>{b.score}/5</span>
                      </div>
                      {lm.comments?.[b.id] && <p style={{ margin:"2px 0 0 28px", fontSize:10, color:"#6B5B7B" }}>Line Manager Comment: <span style={{ fontStyle:"italic", color:"#4A3728" }}>"{lm.comments[b.id]}"</span></p>}
                    </div>
                  ))}
                </div>
                <div style={{ flex:1, padding:"14px", background:"rgba(91,45,142,0.06)", border:"1px solid rgba(91,45,142,0.3)", borderRadius:12 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#5B2D8E", textTransform:"uppercase", letterSpacing:"0.8px", margin:"0 0 10px" }}>Bottom 3 Behaviours</p>
                  {bottoms.map((b,i) => (
                    <div key={b.name} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:20, height:20, borderRadius:"50%", background:"#5B2D8E", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{i+1}</span>
                        <span style={{ flex:1, fontSize:12, color:"#2D1B4E" }}>{b.name}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#5B2D8E" }}>{b.score}/5</span>
                      </div>
                      {lm.comments?.[b.id] && <p style={{ margin:"2px 0 0 28px", fontSize:10, color:"#6B5B7B" }}>Line Manager Comment: <span style={{ fontStyle:"italic", color:"#4A3728" }}>"{lm.comments[b.id]}"</span></p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Coaching Goals Selection */}
          {report?.coaching_goals?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: "#2D1B4E", fontSize: 14, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Coaching Goals</p>
              <p style={{ color: "#8B7B9B", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>Select 2-3 goals that resonate most. These will appear in your PDF report.</p>
              <div style={{ padding: "12px 16px", background: "rgba(91,45,142,0.05)", border: "1px solid rgba(91,45,142,0.15)", borderRadius: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#5B2D8E", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Reflect before choosing</p>
                {["Which goal, if achieved, would have the most meaningful impact on your work and sense of fulfilment?",
                  "Which goal makes you feel the most uncomfortable — and could that discomfort point to your most important growth area?",
                  "If you looked back 12 months from now, which achievement would make you most proud?",
                  "What would you choose if no one else's expectations were influencing your answer?"].map((q, i) => (
                  <p key={i} style={{ fontSize: 12, color: "#4A2D6E", margin: "0 0 6px", lineHeight: 1.5 }}>• {q}</p>
                ))}
              </div>
              {report.coaching_goals.map((goal, i) => {
                const isSelected = (selectedGoals || []).includes(i);
                return (
                  <div key={i} onClick={() => {
                    const current = selectedGoals || [];
                    if (isSelected) setSelectedGoals(current.filter(g => g !== i));
                    else if (current.length < 3) setSelectedGoals([...current, i]);
                  }}
                    style={{ padding: "14px 16px", marginBottom: 10, borderRadius: 12, border: isSelected ? "2px solid #C9843A" : "1px solid rgba(45,27,78,0.12)", background: isSelected ? "rgba(201,132,58,0.06)" : "#fff", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isSelected ? "#C9843A" : "#2D1B4E" }}>Goal {i+1}: {goal.title || goal.goal}</p>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", border: isSelected ? "none" : "2px solid rgba(45,27,78,0.2)", background: isSelected ? "#C9843A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(selectedGoals || []).length > 0 && (
                <p style={{ fontSize: 12, color: "#C9843A", fontWeight: 600, textAlign: "center", margin: "8px 0 0" }}>
                  {(selectedGoals || []).length} goal{(selectedGoals || []).length !== 1 ? "s" : ""} selected (max 3)
                </p>
              )}
            </div>
          )}

          {/* Book a session */}
          <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, rgba(201,132,58,0.12), rgba(38,70,83,0.2))", border: "1px solid rgba(201,132,58,0.25)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <div>
              <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Discuss your results with a coach</p>
              <p style={{ color: "#6B5B7B", fontSize: 12, margin: 0 }}>Book a 1:1 session to debrief your leadership brand report.</p>
            </div>
            <a href="https://www.paritycoaching.org" target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 20px", background: "#C9843A", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
              Book a Session →
            </a>
          </div>

          {/* Generate PDF Report */}
          <button onClick={() => generatePDFReport()}
            style={{ ...styles.btnPrimary, width: "100%", marginBottom: 12, background: "linear-gradient(135deg, #2D1B4E, #C9843A)" }}>
            Generate PDF Report
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
  subtitle: { fontSize: 14, color: "#6B5B7B", margin: "0 0 24px", lineHeight: 1.5 },
  btnPrimary: { padding: "13px 24px", background: "#C9843A", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
  btnSecondary: { padding: "12px 24px", background: "rgba(45,27,78,0.07)", border: "1px solid rgba(45,27,78,0.12)", borderRadius: 10, color: "#6B5B7B", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
};
