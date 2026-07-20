import { useState, useRef, useEffect, useCallback } from "react";
import LeadershipAssessment from "./LeadershipAssessment";

// ─── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://spowxgwxglvljpatdtzi.supabase.co";
const SUPABASE_KEY = "sb_publishable_pMMs0XKnoWNgbRtbdYDL7A_NnEI46Y5";

const supabase = {
  async saveProfile(email, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ email, values_data: data, created_at: new Date().toISOString() }),
    });
    return res.ok;
  },
  async loadProfile(email) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=*`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.length > 0 ? data[0].values_data : null;
  },
};

// ─── Local storage helpers ─────────────────────────────────────────────────────
const LS_KEY = "cv_app_state";
const LS_USER_KEY = "cv_user";

function saveToLS(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}
function loadFromLS() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveUserToLS(user) {
  try { localStorage.setItem(LS_USER_KEY, JSON.stringify(user)); } catch {}
}
function loadUserFromLS() {
  try { const s = localStorage.getItem(LS_USER_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const VALUES_LIST = [
  "Affirmation","Achievement","Adventure","Appreciation","Authenticity","Authority","Autonomy",
  "Balance","Beauty","Boldness","Collaboration","Compassion","Challenge","Citizenship",
  "Community","Competency","Connection","Contribution","Creativity","Curiosity","Determination",
  "Ease","Equity","Fairness","Faith","Fame","Freedom","Friendships","Fun","Gratitude","Growth",
  "Happiness","Honesty","Humility","Humor","Influence","Inner Harmony","Integrity",
  "Intentionality","Joy","Justice","Kindness","Knowledge","Leadership","Learning","Liberation",
  "Love","Loyalty","Meaningful Work","Openness","Optimism","Peace","Pleasure","Poise",
  "Popularity","Recognition","Reflection","Religion","Reputation","Respect","Responsibility",
  "Rest","Security","Self-Respect","Service","Spaciousness","Spirituality","Stability","Success",
  "Sustainability","Status","Trustworthiness","Wealth","Wellness","Wisdom"
];

const COMMON_GOALS = {
  "Affirmation": ["Practice daily positive self-talk", "Write weekly affirmation statements", "Celebrate small wins regularly", "Surround yourself with encouraging people"],
  "Achievement": ["Set quarterly measurable objectives", "Complete a professional certification", "Track progress with a success journal", "Tackle one stretch project per year"],
  "Adventure": ["Travel to a new destination each year", "Try one new activity each month", "Step outside your comfort zone weekly", "Plan a spontaneous weekend trip"],
  "Appreciation": ["Write gratitude letters to loved ones", "Express thanks daily to someone specific", "Keep a gratitude journal", "Acknowledge others' contributions publicly"],
  "Authenticity": ["Share your true opinions more often", "Align daily actions with personal beliefs", "Reduce people-pleasing behaviors", "Practice vulnerability in relationships"],
  "Authority": ["Seek leadership roles in your community", "Develop expertise in your field", "Mentor others in your area of strength", "Lead a project or initiative"],
  "Autonomy": ["Negotiate flexible work arrangements", "Build an emergency fund for independence", "Make decisions without excessive input-seeking", "Start a personal project or side business"],
  "Balance": ["Set clear work-life boundaries", "Schedule regular self-care time", "Divide energy across key life areas", "Practice saying no to overcommitments"],
  "Beauty": ["Curate your living space intentionally", "Visit art galleries or nature regularly", "Create something artistic monthly", "Surround yourself with aesthetically pleasing environments"],
  "Boldness": ["Speak up in meetings or group settings", "Pitch an unconventional idea at work", "Take a calculated risk each quarter", "Start a conversation with a stranger weekly"],
  "Collaboration": ["Join a team project or group initiative", "Practice active listening in group settings", "Seek diverse perspectives before decisions", "Co-create something with a partner or team"],
  "Compassion": ["Volunteer monthly at a local organization", "Practice empathetic listening daily", "Perform random acts of kindness weekly", "Support someone going through a hard time"],
  "Challenge": ["Set one stretch goal per quarter", "Enter a competition or contest", "Learn a skill outside your comfort zone", "Take on a project that pushes your limits"],
  "Citizenship": ["Vote in every election", "Attend local community meetings", "Volunteer for civic organizations", "Stay informed on local and national issues"],
  "Community": ["Attend local events regularly", "Join or start a neighborhood group", "Host gatherings for friends and neighbors", "Contribute to a community project"],
  "Competency": ["Take a course to upskill annually", "Seek feedback on your performance quarterly", "Read industry-leading publications monthly", "Practice deliberate skill-building daily"],
  "Connection": ["Schedule regular catch-ups with close friends", "Deepen one relationship per month", "Join a group aligned with your interests", "Practice being fully present in conversations"],
  "Contribution": ["Donate time or money to causes you care about", "Share your skills with others who need them", "Create something that benefits your community", "Mentor someone less experienced"],
  "Creativity": ["Dedicate weekly time to a creative hobby", "Brainstorm new ideas without judgment", "Take a creative workshop or class", "Experiment with a new medium or form"],
  "Curiosity": ["Read a book outside your usual genre monthly", "Ask more questions in conversations", "Explore a new topic each week", "Attend lectures or talks on unfamiliar subjects"],
  "Determination": ["Set a long-term goal and create milestones", "Build a daily discipline routine", "Persist through one difficult challenge", "Track streaks of consistent effort"],
  "Ease": ["Simplify your daily routines", "Automate repetitive tasks", "Practice letting go of perfectionism", "Create buffer time between commitments"],
  "Equity": ["Educate yourself on systemic inequalities", "Advocate for fair practices in your workplace", "Support organizations fighting for equity", "Amplify underrepresented voices"],
  "Fairness": ["Evaluate your biases regularly", "Ensure equitable treatment in your interactions", "Speak up when you witness unfairness", "Create fair processes in your sphere of influence"],
  "Faith": ["Develop a daily spiritual practice", "Join a faith community or study group", "Read spiritual texts regularly", "Practice trust in uncertain situations"],
  "Fame": ["Build a personal brand online", "Share your expertise through content creation", "Speak at events or conferences", "Grow your professional network strategically"],
  "Freedom": ["Reduce financial obligations for flexibility", "Build passive income streams", "Negotiate more autonomy in your roles", "Eliminate commitments that feel constraining"],
  "Friendships": ["Reach out to a friend weekly", "Plan monthly social activities", "Be more vulnerable with close friends", "Invest time in deepening existing friendships"],
  "Fun": ["Schedule leisure activities weekly", "Try a new hobby each season", "Incorporate play into your daily routine", "Plan enjoyable experiences with loved ones"],
  "Gratitude": ["Write three things you're grateful for daily", "Express appreciation to someone each day", "Keep a gratitude journal", "Reflect on positive moments before bed"],
  "Growth": ["Set personal development goals quarterly", "Seek constructive feedback regularly", "Read self-improvement books monthly", "Invest in coaching or therapy"],
  "Happiness": ["Identify and do more of what brings you joy", "Practice mindfulness daily", "Cultivate positive relationships", "Reduce time on activities that drain you"],
  "Honesty": ["Practice radical honesty in key relationships", "Align your words with your actions", "Have difficult conversations promptly", "Be transparent about your needs and boundaries"],
  "Humility": ["Ask for help when you need it", "Acknowledge mistakes quickly", "Celebrate others' achievements genuinely", "Stay open to being wrong"],
  "Humor": ["Watch or read something funny daily", "Practice not taking yourself too seriously", "Share laughter with friends regularly", "Find humor in challenging situations"],
  "Influence": ["Share your perspective through writing or speaking", "Build relationships with decision-makers", "Lead by example in your community", "Develop your communication skills"],
  "Inner Harmony": ["Practice meditation or mindfulness daily", "Resolve internal conflicts through journaling", "Align actions with personal values weekly", "Create peaceful daily rituals"],
  "Integrity": ["Keep your promises consistently", "Act according to your values even when it's hard", "Be honest in all dealings", "Hold yourself accountable publicly"],
  "Intentionality": ["Plan your week with clear intentions", "Review your priorities monthly", "Make deliberate choices about how you spend time", "Set intentions before key activities"],
  "Joy": ["Identify your top joy-bringing activities", "Schedule joy into your week deliberately", "Share joyful moments with others", "Remove or reduce joy-depleting obligations"],
  "Justice": ["Support organizations fighting injustice", "Educate yourself on social justice issues", "Speak up against unfair treatment", "Participate in advocacy or activism"],
  "Kindness": ["Perform one act of kindness daily", "Speak kindly to yourself and others", "Surprise someone with a thoughtful gesture weekly", "Practice patience in frustrating situations"],
  "Knowledge": ["Read for 30 minutes daily", "Take an online course quarterly", "Engage in intellectual discussions regularly", "Teach something you've learned to others"],
  "Leadership": ["Mentor one person actively", "Take initiative on a team project", "Develop your emotional intelligence", "Seek leadership training or coaching"],
  "Learning": ["Dedicate time to learning something new weekly", "Attend workshops or seminars quarterly", "Maintain a learning journal", "Seek out diverse educational experiences"],
  "Liberation": ["Identify and release limiting beliefs", "Break free from unhealthy patterns", "Set boundaries that honor your freedom", "Practice financial independence strategies"],
  "Love": ["Express love to someone important daily", "Practice self-love through care routines", "Invest quality time in your closest relationships", "Write love letters or notes of appreciation"],
  "Loyalty": ["Show up consistently for your inner circle", "Defend your loved ones when needed", "Maintain long-term commitments", "Be reliable and dependable in relationships"],
  "Meaningful Work": ["Align your career with your passions", "Seek projects that create real impact", "Reflect on your purpose regularly", "Find meaning in daily tasks through intentionality"],
  "Openness": ["Try something new each week", "Listen to opposing viewpoints with curiosity", "Share your feelings more openly", "Embrace change rather than resisting it"],
  "Optimism": ["Reframe negative thoughts into positive ones", "Surround yourself with positive influences", "Visualize success before challenges", "Start each day with a positive intention"],
  "Peace": ["Practice daily meditation or deep breathing", "Resolve conflicts promptly and calmly", "Create a peaceful home environment", "Limit exposure to stressful media"],
  "Pleasure": ["Savor enjoyable experiences fully", "Treat yourself to small pleasures weekly", "Engage your senses intentionally", "Make time for activities that bring delight"],
  "Poise": ["Practice calm responses under pressure", "Develop public speaking confidence", "Maintain composure in difficult conversations", "Cultivate grace in social situations"],
  "Popularity": ["Expand your social network intentionally", "Be genuinely interested in others", "Contribute positively to group settings", "Build your reputation through consistent kindness"],
  "Recognition": ["Share your accomplishments appropriately", "Seek feedback and endorsements", "Document and celebrate your milestones", "Apply for awards or honors in your field"],
  "Reflection": ["Journal for 15 minutes daily", "Schedule monthly personal reviews", "Practice end-of-day reflection", "Seek solitude for deep thinking weekly"],
  "Religion": ["Attend religious services regularly", "Study religious texts weekly", "Participate in religious community activities", "Integrate religious practices into daily life"],
  "Reputation": ["Deliver on promises consistently", "Build expertise others recognize", "Act with integrity in public and private", "Seek testimonials and positive references"],
  "Respect": ["Listen actively in all conversations", "Honor others' boundaries and preferences", "Treat everyone with dignity regardless of status", "Respect your own needs and limits"],
  "Responsibility": ["Follow through on all commitments", "Take ownership of mistakes immediately", "Manage your finances responsibly", "Be accountable for your impact on others"],
  "Rest": ["Maintain a consistent sleep schedule", "Take regular breaks during work", "Schedule restorative downtime weekly", "Practice digital detox regularly"],
  "Security": ["Build a 6-month emergency fund", "Invest in long-term financial planning", "Develop multiple income streams", "Create stable routines and systems"],
  "Self-Respect": ["Set and enforce personal boundaries", "Stop tolerating disrespectful behavior", "Invest in your physical and mental health", "Speak to yourself as you would a good friend"],
  "Service": ["Volunteer regularly in your community", "Offer your skills to those in need", "Look for ways to serve others daily", "Support charitable causes financially"],
  "Spaciousness": ["Declutter your physical space regularly", "Build margin into your schedule", "Practice minimalism in possessions", "Create quiet, unstructured time weekly"],
  "Spirituality": ["Develop a daily spiritual practice", "Explore different spiritual traditions", "Spend time in nature for spiritual renewal", "Connect with a spiritual community"],
  "Stability": ["Create consistent daily routines", "Build financial reserves", "Maintain steady relationships", "Develop systems that reduce chaos"],
  "Success": ["Define success on your own terms", "Set SMART goals annually", "Track your progress monthly", "Celebrate achievements along the way"],
  "Sustainability": ["Reduce your environmental footprint", "Make eco-friendly purchasing decisions", "Support sustainable businesses", "Educate others about sustainable practices"],
  "Status": ["Pursue promotions strategically", "Build visible expertise in your field", "Network with influential individuals", "Invest in your professional image"],
  "Trustworthiness": ["Keep confidences absolutely", "Be consistent in your words and actions", "Show up reliably for others", "Admit when you don't know something"],
  "Wealth": ["Create a comprehensive financial plan", "Invest consistently for the long term", "Develop multiple income streams", "Educate yourself on financial literacy"],
  "Wellness": ["Exercise at least 3 times per week", "Prioritize sleep quality and duration", "Eat nutritious meals consistently", "Schedule regular health check-ups"],
  "Wisdom": ["Seek advice from mentors and elders", "Reflect on lessons learned from experiences", "Study philosophy or timeless literature", "Practice thoughtful decision-making"],
};

const PALETTE = [
  "#5B2D8E","#C9843A","#2D1B4E","#8B4A6E","#E0A84A",
  "#4A2D6E","#9B6B9E","#D4956A","#7A4D8E","#B87A3A"
];

// ─── PieChart component ────────────────────────────────────────────────────────
function PieChart({ values, percentages, descriptions, onPercentageChange, activeIndex, onActiveChange, onSliderRelease, lastTouched = null, interactive = false }) {
  const svgSize = 340;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 140;

  let cumulative = 0;
  const slices = values.map((v, i) => {
    const pct = percentages[i] || 0;
    const startAngle = (cumulative / 100) * 360;
    cumulative += pct;
    const endAngle = (cumulative / 100) * 360;
    return { value: v, pct, startAngle, endAngle, color: PALETTE[i % PALETTE.length], index: i };
  });

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    if (endAngle - startAngle >= 359.99) {
      const mid = polarToCartesian(cx, cy, r, startAngle + 180);
      const end = polarToCartesian(cx, cy, r, startAngle + 359.99);
      const start = polarToCartesian(cx, cy, r, startAngle);
      return `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${mid.x} ${mid.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
    }
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  const labelPos = (startAngle, endAngle) => {
    const mid = (startAngle + endAngle) / 2;
    return polarToCartesian(cx, cy, radius * 0.65, mid);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {slices.map((s, i) => {
          const isActive = activeIndex === i;
          const isAffected = activeIndex !== null && activeIndex !== i;
          const explodeOffset = isActive ? 8 : 0;
          const midAngle = ((s.startAngle + s.endAngle) / 2 - 90) * Math.PI / 180;
          const dx = explodeOffset * Math.cos(midAngle);
          const dy = explodeOffset * Math.sin(midAngle);
          return s.pct > 0 && (
            <g key={i} transform={`translate(${dx},${dy})`} style={{ transition: "transform 0.25s ease" }}>
              <path
                d={describeArc(cx, cy, isActive ? radius + 4 : radius, s.startAngle, s.endAngle)}
                fill={s.color}
                stroke={isActive ? "#fff" : "#1a1a2e"}
                strokeWidth={isActive ? 3 : 2}
                opacity={activeIndex !== null && !isActive && !isAffected ? 0.5 : isAffected ? 0.7 : 1}
                style={{ transition: "all 0.25s ease", filter: isActive ? "brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.3))" : isAffected ? "brightness(0.85)" : "none" }}
              />
              {s.pct >= 8 && (
                <text x={labelPos(s.startAngle, s.endAngle).x} y={labelPos(s.startAngle, s.endAngle).y}
                  textAnchor="middle" dominantBaseline="middle" fill="#fff"
                  fontSize={isActive ? "14" : "11"} fontWeight="700"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)", transition: "font-size 0.25s ease" }}>
                  {s.pct}%
                </text>
              )}
            </g>
          );
        })}
        {activeIndex !== null && (
          <g>
            <circle cx={cx} cy={cy} r={38} fill="rgba(15,23,42,0.9)" />
            <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fill={PALETTE[activeIndex % PALETTE.length]} fontSize="20" fontWeight="800">{percentages[activeIndex]}%</text>
            <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fill="#6B5B7B" fontSize="9" fontWeight="600">{values[activeIndex]}</text>
          </g>
        )}
      </svg>
      {interactive && (
        <div style={{ width: "100%", maxWidth: 540 }}>
          <p style={{ color: "#6B5B7B", fontSize: 13, marginBottom: 14, textAlign: "center" }}>Drag a slider — your previous adjustment stays fixed.</p>
          {values.map((v, i) => {
            const isActive = activeIndex === i;
            const isProtected = lastTouched === i && !isActive;
            const isAffected = activeIndex !== null && activeIndex !== i && !isProtected;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "8px 12px", borderRadius: 10,
                background: isActive ? `${PALETTE[i % PALETTE.length]}18` : isProtected ? "rgba(244,162,97,0.06)" : "transparent",
                border: isActive ? `2px solid ${PALETTE[i % PALETTE.length]}55` : isProtected ? "2px solid rgba(244,162,97,0.15)" : "2px solid transparent",
                transition: "all 0.2s ease", transform: isActive ? "scale(1.02)" : "scale(1)" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: PALETTE[i % PALETTE.length], flexShrink: 0, boxShadow: isActive ? `0 0 10px ${PALETTE[i % PALETTE.length]}88` : "none", transition: "box-shadow 0.2s ease" }} />
                <span style={{ width: 100, fontSize: 13, fontWeight: isActive ? 800 : 600, color: isActive ? "#fff" : isProtected ? "#C9843A" : isAffected ? "#8B7B9B" : "#1a0a2e", transition: "all 0.2s ease" }}>{v}</span>
                {isProtected && <span style={{ fontSize: 10, color: "#C9843A", flexShrink: 0 }}>set</span>}
                <input type="range" min={0} max={100} value={percentages[i]}
                  onChange={(e) => onPercentageChange(i, parseInt(e.target.value))}
                  onMouseDown={() => onActiveChange(i)} onTouchStart={() => onActiveChange(i)}
                  onMouseUp={() => onSliderRelease(i)} onTouchEnd={() => onSliderRelease(i)}
                  style={{ flex: 1, accentColor: PALETTE[i % PALETTE.length], cursor: "pointer" }} />
                <span style={{ width: 44, fontSize: isActive ? 16 : 13, fontWeight: isActive ? 800 : isProtected ? 700 : 500,
                  color: isActive ? PALETTE[i % PALETTE.length] : isProtected ? "#C9843A" : isAffected ? "#9B8BAB" : "#4A2D6E",
                  textAlign: "right", transition: "all 0.2s ease" }}>{percentages[i]}%</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
            background: activeIndex === i ? `${s.color}22` : "rgba(45,27,78,0.05)", borderRadius: 6,
            border: activeIndex === i ? `1px solid ${s.color}44` : "1px solid transparent", transition: "all 0.2s ease" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
            <span style={{ fontSize: 12, color: activeIndex === i ? "#fff" : "#4A2D6E", fontWeight: activeIndex === i ? 700 : 400 }}>{s.value} ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Registration Modal ────────────────────────────────────────────────────────
function WelcomeModal({ onNewUser, onLoadUser, onNewUserLeadership, onLoadUserLeadership }) {
  const [mode, setMode] = useState("choose"); // choose | module_new | module_returning | returning
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoad = async (goToLeadership = false) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    const data = await supabase.loadProfile(trimmed);
    setLoading(false);
    if (data) {
      if (goToLeadership) onLoadUserLeadership({ email: trimmed }, data);
      else onLoadUser({ email: trimmed }, data);
    } else {
      setError("No saved profile found for this email. Try starting fresh.");
    }
  };

  const ModuleCard = ({ icon, title, desc, color, onClick }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: "24px 16px", borderRadius: 14,
      border: `1.5px solid ${color}33`,
      background: `${color}0d`,
      cursor: "pointer", fontFamily: "inherit", textAlign: "center",
      transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}1a`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}0d`}
    >
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a0a2e", lineHeight: 1.3 }}>{title}</p>
      <p style={{ margin: 0, fontSize: 11, color: "#8B7B9B", lineHeight: 1.5 }}>{desc}</p>
    </button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#EDE8F5", border: "1px solid rgba(45,27,78,0.2)", borderRadius: 20, width: "100%", maxWidth: 460, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, #5B2D8E, #2D1B4E, #C9843A)" }} />

        {/* Screen 1: New or returning */}
        {mode === "choose" && (
          <div style={{ padding: "32px 32px 28px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 50, objectFit: "contain" }} />
            </div>
            <h2 style={{ textAlign: "center", color: "#2D1B4E", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Leadership Brand Assessment</h2>
            <p style={{ textAlign: "center", color: "#6B5B7B", fontSize: 13, lineHeight: 1.6, margin: "0 0 28px" }}>Understand your leadership competencies and get AI-driven coaching goals.</p>
            <button onClick={onNewUserLeadership} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #C9843A, #8B4A1E)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              🆕 Start Assessment
            </button>
            <button onClick={() => setMode("returning_leadership")} style={{ width: "100%", padding: "14px", background: "rgba(45,27,78,0.08)", border: "1px solid rgba(45,27,78,0.18)", borderRadius: 10, color: "#1a0a2e", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              👋 I have a saved profile
            </button>
          </div>
        )}

        {/* Screen 2a: New user — pick module */}
        {mode === "module_new" && (
          <div style={{ padding: "28px 28px 28px" }}>
            <button onClick={() => setMode("choose")} style={{ background: "none", border: "none", color: "#8B7B9B", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16 }}>← Back</button>
            <h2 style={{ textAlign: "center", color: "#1a0a2e", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>What would you like to do?</h2>
            <p style={{ textAlign: "center", color: "#8B7B9B", fontSize: 12, margin: "0 0 20px" }}>You can always access the other module later.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <ModuleCard
                icon="🎯"
                title="Core Values to Goals"
                desc="Discover your values, set goals, build your identity statement"
                color="#C9843A"
                onClick={onNewUserLeadership}
              />
              <ModuleCard
                icon="🏆"
                title="Leadership Brand Assessment"
                desc="Rate your leadership competencies and get a personalised report"
                color="#4A2D6E"
                onClick={onNewUserLeadership}
              />
            </div>
          </div>
        )}

        {/* Screen 2b: Returning user — pick module */}
        {mode === "module_returning" && (
          <div style={{ padding: "28px 28px 28px" }}>
            <button onClick={() => setMode("choose")} style={{ background: "none", border: "none", color: "#8B7B9B", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16 }}>← Back</button>
            <h2 style={{ textAlign: "center", color: "#1a0a2e", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Where would you like to go?</h2>
            <p style={{ textAlign: "center", color: "#8B7B9B", fontSize: 12, margin: "0 0 20px" }}>We'll load your saved profile.</p>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <ModuleCard
                icon="🎯"
                title="Core Values to Goals"
                desc="Continue where you left off with your values and goals"
                color="#C9843A"
                onClick={() => setMode("returning_values")}
              />
              <ModuleCard
                icon="🏆"
                title="Leadership Assessment"
                desc="View or redo your leadership brand assessment"
                color="#4A2D6E"
                onClick={() => setMode("returning_leadership")}
              />
            </div>
          </div>
        )}

        {/* Screen 3a: Returning — email for values */}
        {mode === "returning_values" && (
          <div style={{ padding: "28px 32px 24px" }}>
            <button onClick={() => { setMode("module_returning"); setError(""); }} style={{ background: "none", border: "none", color: "#8B7B9B", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16 }}>← Back</button>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🎯</div>
            <h2 style={{ textAlign: "center", color: "#1a0a2e", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Load Your Values Profile</h2>
            <p style={{ textAlign: "center", color: "#6B5B7B", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>Enter your email to continue where you left off.</p>
            <input type="email" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLoad(false)}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(45,27,78,0.08)", border: `1.5px solid ${error ? "#5B2D8E" : "rgba(45,27,78,0.18)"}`, borderRadius: 10, color: "#1a0a2e", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
            {error && <p style={{ color: "#5B2D8E", fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
            <button onClick={() => handleLoad(false)} disabled={loading}
              style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #C9843A, #8B4A1E)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Loading..." : "Load My Progress →"}
            </button>
            <p style={{ textAlign: "center", color: "#B0A0BF", fontSize: 11, margin: "12px 0 0" }}>🔒 Only used to find your profile.</p>
          </div>
        )}

        {/* Screen 3b: Returning — email for leadership */}
        {mode === "returning_leadership" && (
          <div style={{ padding: "28px 32px 24px" }}>
            <button onClick={() => { setMode("module_returning"); setError(""); }} style={{ background: "none", border: "none", color: "#8B7B9B", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 16 }}>← Back</button>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🏆</div>
            <h2 style={{ textAlign: "center", color: "#1a0a2e", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Load Your Leadership Profile</h2>
            <p style={{ textAlign: "center", color: "#6B5B7B", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>Enter your email to access your leadership assessment.</p>
            <input type="email" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLoad(true)}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(45,27,78,0.08)", border: `1.5px solid ${error ? "#5B2D8E" : "rgba(45,27,78,0.18)"}`, borderRadius: 10, color: "#1a0a2e", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
            {error && <p style={{ color: "#5B2D8E", fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
            <button onClick={() => handleLoad(true)} disabled={loading}
              style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #7B2D8B, #264653)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Loading..." : "Load My Assessment →"}
            </button>
            <p style={{ textAlign: "center", color: "#B0A0BF", fontSize: 11, margin: "12px 0 0" }}>🔒 Only used to find your profile.</p>
          </div>
        )}

      </div>
    </div>
  );
}

function RegistrationModal({ onComplete, onSkip }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("saving");
    setError("");
    // Save just the user — app state synced separately
    const ok = await supabase.saveProfile(trimmed, {});
    if (ok) {
      setStatus("done");
      setTimeout(() => onComplete({ email: trimmed }), 1400);
    } else {
      setStatus("error");
      setError("Couldn't connect to database. Your progress is saved locally.");
      setTimeout(() => onComplete({ email: trimmed, localOnly: true }), 2000);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#F9F6F2", border: "1px solid rgba(45,27,78,0.15)", borderRadius: 20, width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, #5B2D8E, #C9843A)" }} />
        {status === "done" ? (
          <div style={{ textAlign: "center", padding: "40px 32px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(201,132,58,0.15)", border: "2px solid #2A9D8F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#C9843A", margin: "0 auto 16px", lineHeight: "56px" }}>✓</div>
            <h2 style={{ color: "#1a0a2e", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Profile saved!</h2>
            <p style={{ color: "#6B5B7B", fontSize: 13 }}>Your values are saved to the cloud — accessible from any device.</p>
          </div>
        ) : (
          <div style={{ padding: "28px 32px 24px" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🔐</div>
            <h2 style={{ textAlign: "center", color: "#1a0a2e", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Save Your Progress</h2>
            <p style={{ textAlign: "center", color: "#6B5B7B", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
              Enter your email to save your values to the cloud. Come back on any device and pick up where you left off.
            </p>
            <input type="email" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(45,27,78,0.08)", border: `1.5px solid ${error ? "#5B2D8E" : "rgba(45,27,78,0.18)"}`, borderRadius: 10, color: "#1a0a2e", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
            {error && <p style={{ color: "#5B2D8E", fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
            <button onClick={handleSubmit} disabled={status === "saving"}
              style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #C9843A, #8B4A1E)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: status === "saving" ? "wait" : "pointer", fontFamily: "inherit", marginTop: 8, marginBottom: 10, opacity: status === "saving" ? 0.7 : 1 }}>
              {status === "saving" ? "Saving..." : "Save to Cloud →"}
            </button>
            <button onClick={onSkip} style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid rgba(45,27,78,0.1)", borderRadius: 10, color: "#8B7B9B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Skip — save locally only
            </button>
            <p style={{ textAlign: "center", color: "#B0A0BF", fontSize: 11, margin: "12px 0 0" }}>🔒 Only used to save your profile. No spam.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Return User Banner ────────────────────────────────────────────────────────
function ReturnBanner({ email, onLoad, onDismiss }) {
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    const data = await supabase.loadProfile(email);
    setLoading(false);
    if (data) onLoad(data);
    else onDismiss();
  };

  return (
    <div style={{ margin: "0 0 20px", padding: "14px 18px", background: "rgba(201,132,58,0.1)", border: "1px solid rgba(201,132,58,0.25)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <p style={{ color: "#C9843A", fontSize: 13, fontWeight: 700, margin: 0 }}>Welcome back!</p>
        <p style={{ color: "#8B7B9B", fontSize: 12, margin: "2px 0 0" }}>Load your saved progress from the cloud?</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleLoad} disabled={loading}
          style={{ padding: "8px 14px", background: "#C9843A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {loading ? "Loading..." : "Load my data"}
        </button>
        <button onClick={onDismiss} style={{ padding: "8px 14px", background: "transparent", border: "1px solid rgba(45,27,78,0.15)", borderRadius: 8, color: "#8B7B9B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          Start fresh
        </button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function CoreValuesApp() {
  const savedState = loadFromLS();
  const savedUser = loadUserFromLS();

  const [step, setStep] = useState(savedState?.step ?? 0);
  const [customValue, setCustomValue] = useState("");
  const [allValues, setAllValues] = useState(savedState?.allValues ?? VALUES_LIST);
  const [selectedTen, setSelectedTen] = useState(savedState?.selectedTen ?? []);
  const [selectedCore, setSelectedCore] = useState(savedState?.selectedCore ?? []);
  const [percentages, setPercentages] = useState(savedState?.percentages ?? []);
  const [descriptions, setDescriptions] = useState(savedState?.descriptions ?? []);
  const [selectedGoals, setSelectedGoals] = useState(savedState?.selectedGoals ?? {});
  const [customGoalText, setCustomGoalText] = useState("");
  const [customGoalValue, setCustomGoalValue] = useState("");
  const [activeSlider, setActiveSlider] = useState(null);
  const lastTouched = useRef(null);
  const [aiGeneratedGoals, setAiGeneratedGoals] = useState(savedState?.aiGeneratedGoals ?? {});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [weeklyActions, setWeeklyActions] = useState(savedState?.weeklyActions ?? []);
  const [newActionText, setNewActionText] = useState("");
  const [newActionValue, setNewActionValue] = useState("");
  const [newActionGoal, setNewActionGoal] = useState("");
  const [newActionDate, setNewActionDate] = useState("");
  const [inputMode, setInputMode] = useState("manual");
  const [todoItems, setTodoItems] = useState(savedState?.todoItems ?? []);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoValue, setNewTodoValue] = useState("");
  const [newTodoGoal, setNewTodoGoal] = useState("");
  const [newTodoDate, setNewTodoDate] = useState("");
  const [currentUser, setCurrentUser] = useState(savedUser);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showReturnBanner, setShowReturnBanner] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(!savedUser);
  const [showLeadership, setShowLeadership] = useState(true);
  const [identityStatement, setIdentityStatement] = useState(savedState?.identityStatement || "");
  const [identityOptions, setIdentityOptions] = useState([]);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState(null);

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const toLocalStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const [calendarDate, setCalendarDate] = useState(() => getLocalDate());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => getLocalDate());

  // ── Auto-save to localStorage whenever key state changes ──
  useEffect(() => {
    saveToLS({ step, allValues, selectedTen, selectedCore, percentages, descriptions, selectedGoals, aiGeneratedGoals, weeklyActions, todoItems, identityStatement });
  }, [step, allValues, selectedTen, selectedCore, percentages, descriptions, selectedGoals, aiGeneratedGoals, weeklyActions, todoItems]);

  // Save only happens on explicit Save button (Step 4) or registration modal

  // ── Load data from Supabase (return user) ──
  const handleLoadCloudData = (data) => {
    if (data.selectedTen) setSelectedTen(data.selectedTen);
    if (data.selectedCore) setSelectedCore(data.selectedCore);
    if (data.percentages) setPercentages(data.percentages);
    if (data.descriptions) setDescriptions(data.descriptions);
    if (data.selectedGoals) setSelectedGoals(data.selectedGoals);
    if (data.aiGeneratedGoals) setAiGeneratedGoals(data.aiGeneratedGoals);
    if (data.weeklyActions) setWeeklyActions(data.weeklyActions);
    if (data.todoItems) setTodoItems(data.todoItems);
    if (data.allValues) setAllValues(data.allValues);
    if (data.step !== undefined) setStep(data.step);
    setShowReturnBanner(false);
  };

  const toggleTen = (v) => setSelectedTen((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 10 ? [...prev, v] : prev);
  const toggleCore = (v) => setSelectedCore((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 5 ? [...prev, v] : prev);

  useEffect(() => {
    if (step === 2 && percentages.length !== selectedCore.length) {
      const even = Math.floor(100 / selectedCore.length);
      setPercentages(selectedCore.map((_, i) => (i === 0 ? 100 - even * (selectedCore.length - 1) : even)));
      setDescriptions(selectedCore.map(() => ""));
    }
  }, [step, selectedCore.length]);

  const handlePercentageChange = (idx, val) => {
    setPercentages((prev) => {
      const newVal = Math.min(Math.max(0, val), 100);
      const prevTouched = lastTouched.current;
      const frozen = new Set([idx]);
      if (prevTouched !== null && prevTouched !== idx) frozen.add(prevTouched);
      const frozenSum = [...frozen].filter((i) => i !== idx).reduce((sum, i) => sum + prev[i], 0);
      const remaining = Math.max(0, 100 - newVal - frozenSum);
      const flexible = prev.map((_, i) => i).filter((i) => !frozen.has(i));
      const next = [...prev];
      next[idx] = newVal;
      if (flexible.length > 0) {
        const flexOldSum = flexible.reduce((sum, i) => sum + prev[i], 0);
        if (flexOldSum > 0) {
          let distributed = 0;
          flexible.forEach((i, arrIdx) => {
            if (arrIdx === flexible.length - 1) { next[i] = Math.max(0, remaining - distributed); }
            else { const share = Math.max(0, Math.round((prev[i] / flexOldSum) * remaining)); next[i] = share; distributed += share; }
          });
        } else {
          const each = Math.floor(remaining / flexible.length);
          let leftover = remaining - each * flexible.length;
          flexible.forEach((i) => { next[i] = each + (leftover > 0 ? 1 : 0); if (leftover > 0) leftover--; });
        }
      } else if (remaining > 0) { next[idx] = 100 - frozenSum; }
      return next;
    });
  };

  const handleSliderRelease = (idx) => { lastTouched.current = idx; setActiveSlider(null); };
  const handleDescChange = (idx, val) => setDescriptions((prev) => { const next = [...prev]; next[idx] = val; return next; });
  const toggleGoal = (value, goal) => setSelectedGoals((prev) => {
    const current = prev[value] || [];
    const next = current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal];
    return { ...prev, [value]: next };
  });

  const generateAiGoals = useCallback(async () => {
    setAiLoading(true); setAiError(null);
    try {
      const describedValues = [];
      const undescribedValues = [];
      selectedCore.forEach((v, i) => {
        const desc = descriptions[i] && descriptions[i].trim();
        if (desc) describedValues.push({ name: v, pct: percentages[i], desc });
        else undescribedValues.push({ name: v, pct: percentages[i] });
      });
      let prompt = `You are a life coach helping someone set goals aligned with their core values.\n\n`;
      if (describedValues.length > 0) {
        prompt += `These values have personal descriptions — generate goals that directly reflect what they wrote:\n`;
        describedValues.forEach((v) => { prompt += `- ${v.name} (${v.pct}% of their focus): "${v.desc}"\n`; });
        prompt += `\n`;
      }
      if (undescribedValues.length > 0) {
        prompt += `These values have NO description. Generate goals scaled to their importance percentage:\n`;
        undescribedValues.forEach((v) => { prompt += `- ${v.name} (${v.pct}% of their focus)\n`; });
        prompt += `\n`;
      }
      prompt += `Generate exactly 4 goals per value. Respond ONLY in this exact JSON format with no other text, no markdown, no backticks:\n`;
      prompt += `{${selectedCore.map((v) => `"${v}": ["goal1", "goal2", "goal3", "goal4"]`).join(", ")}}`;

      const response = await fetch("/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer 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" },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || "";
      const clean = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAiGeneratedGoals(parsed);
    } catch (err) {
      setAiError("Couldn't generate personalized goals. Using defaults instead.");
      const fallback = {};
      selectedCore.forEach((v) => { fallback[v] = COMMON_GOALS[v] || ["Set meaningful objectives", "Build consistent habits", "Track your progress", "Seek accountability"]; });
      setAiGeneratedGoals(fallback);
    } finally {
      setAiLoading(false);
    }
  }, [selectedCore, descriptions, percentages]);

  useEffect(() => { if (step === 3 && Object.keys(aiGeneratedGoals).length === 0) generateAiGoals(); }, [step]);

  const generateIdentityStatements = useCallback(async () => {
    setIdentityLoading(true);
    setIdentityError(null);
    try {
      const valuesSummary = selectedCore.map((v, i) => {
        const desc = descriptions[i]?.trim();
        return desc ? `- ${v} (${percentages[i]}%): "${desc}"` : `- ${v} (${percentages[i]}%)`;
      }).join("\n");

      const goalsSummary = selectedCore.map((v) => {
        const goals = selectedGoals[v] || [];
        return goals.length > 0 ? `- ${v}: ${goals.slice(0, 2).join(", ")}` : null;
      }).filter(Boolean).join("\n");

      const prompt = `You are a professional coach helping an executive/leader define their personal identity statement based on their core values and goals.

Their core values and meanings:
${valuesSummary}

Their selected goals:
${goalsSummary}

Generate exactly 3 distinct Personal Identity Statement options. Each should:
- Start with "I am a..." or "I am an..."
- Be 1-2 sentences, powerful and memorable
- Directly reflect their specific values and what they mean to this person
- Sound authentic, not generic
- Use bold descriptive phrases that capture their unique combination of values

Respond ONLY in this exact JSON format with no other text:
{"options": ["statement 1", "statement 2", "statement 3"]}`;

      const response = await fetch("/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer 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" },
        body: JSON.stringify({ model: "gpt-4o", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      const text = data.choices[0].message.content || "";
      const parsed = JSON.parse(text.trim());
      setIdentityOptions(parsed.options || []);
    } catch (err) {
      console.error("Identity generation failed:", err);
      setIdentityError("Couldn't generate identity statements. Please try again.");
      setIdentityOptions([
        `I am a purpose-driven leader who lives by ${selectedCore[0]} and ${selectedCore[1]}, committed to growth and meaningful impact.`,
        `I am an authentic ${selectedCore[0].toLowerCase()} seeker who channels ${selectedCore[1]?.toLowerCase()} into everything I do.`,
        `I am a values-led individual who prioritizes ${selectedCore.slice(0, 3).join(", ")} as the foundation of all my decisions.`,
      ]);
    } finally {
      setIdentityLoading(false);
    }
  }, [selectedCore, descriptions, percentages, selectedGoals]);

  useEffect(() => { if (step === 4) generateIdentityStatements(); }, [step]);

  const addCustomGoal = () => {
    if (!customGoalText.trim() || !customGoalValue) return;
    setSelectedGoals((prev) => ({ ...prev, [customGoalValue]: [...(prev[customGoalValue] || []), customGoalText.trim()] }));
    setCustomGoalText("");
  };

  const addCustomValueAndContinue = () => {
    if (customValue.trim() && !allValues.includes(customValue.trim())) {
      setAllValues((prev) => [...prev, customValue.trim()]);
      setCustomValue("");
    }
  };

  const totalGoals = Object.values(selectedGoals).reduce((a, b) => a + b.length, 0);

  const handleRegistrationComplete = async (user) => {
    saveUserToLS(user);
    setCurrentUser(user);
    setShowRegModal(false);
    // Sync current state to Supabase immediately on registration
    if (!user.localOnly) {
      await supabase.saveProfile(user.email, {
        step, allValues, selectedTen, selectedCore, percentages,
        descriptions, selectedGoals, aiGeneratedGoals, weeklyActions, todoItems, identityStatement,
      });
    }
    setStep(step + 1);
  };

  const handleSkipReg = () => { setShowRegModal(false); setStep(step + 1); };
  const handleNewUser = () => { setShowWelcomeModal(false); };
  const handleNewUserLeadership = () => { setShowWelcomeModal(false); setShowLeadership(true); };
  const handleLoadUser = (user, data) => {
    saveUserToLS(user);
    setCurrentUser(user);
    setShowWelcomeModal(false);
    if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed.selectedTen?.length) setSelectedTen(parsed.selectedTen);
      if (parsed.selectedCore?.length) setSelectedCore(parsed.selectedCore);
      if (parsed.percentages?.length) setPercentages(parsed.percentages);
      if (parsed.descriptions?.length) setDescriptions(parsed.descriptions);
      if (parsed.selectedGoals && Object.keys(parsed.selectedGoals).length) setSelectedGoals(parsed.selectedGoals);
      if (parsed.aiGeneratedGoals && Object.keys(parsed.aiGeneratedGoals).length) setAiGeneratedGoals(parsed.aiGeneratedGoals);
      if (parsed.weeklyActions?.length) setWeeklyActions(parsed.weeklyActions);
      if (parsed.todoItems?.length) setTodoItems(parsed.todoItems);
      if (parsed.allValues?.length) setAllValues(parsed.allValues);
      if (parsed.step !== undefined) setStep(parsed.step);
      if (parsed.identityStatement) setIdentityStatement(parsed.identityStatement);
    }
  };
  const handleLoadUserLeadership = (user, data) => {
    saveUserToLS(user);
    setCurrentUser(user);
    setShowWelcomeModal(false);
    setShowLeadership(true);
    if (data) {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed.selectedCore?.length) setSelectedCore(parsed.selectedCore);
    }
  };
  const handleLogout = () => { localStorage.removeItem(LS_USER_KEY); setCurrentUser(null); };
  const handleClearData = () => {
    if (window.confirm("Clear all your saved progress and start over?")) {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_USER_KEY);
      window.location.reload();
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return selectedTen.length === 10;
      case 1: return selectedCore.length >= 3 && selectedCore.length <= 5;
      case 2: return true;
      case 3: return totalGoals > 0;
      case 4: return !!identityStatement; // must have selected an identity statement
      case 5: return true;
      case 6: return true;
      case 7: return false;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step === 3 && !currentUser) { setShowRegModal(true); return; }
    if (step === 3 && currentUser && !currentUser.localOnly) {
      await supabase.saveProfile(currentUser.email, {
        step: 4, allValues, selectedTen, selectedCore, percentages,
        descriptions, selectedGoals, aiGeneratedGoals, weeklyActions, todoItems, identityStatement,
      });
    }
    setStep(step + 1);
  };

  const nextLabel = () => {
    if (step === 4) return "Next →";
    if (step === 5) return "Final Review →";
    if (step === 6) return "Weekly Tracker →";
    return "Next →";
  };

  // ── Step renderers ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 1: Select Your Top 10 Values</h2>
            <p style={styles.stepDesc}>
              Choose exactly 10 values most important to your life and/or work.
              <strong style={{ color: selectedTen.length === 10 ? "#C9843A" : "#C9843A" }}> ({selectedTen.length}/10 selected{selectedTen.length < 10 ? ` — need ${10 - selectedTen.length} more` : " ✓"})</strong>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {allValues.map((v) => (
                <button key={v} onClick={() => toggleTen(v)} style={{ ...styles.selectableChip, background: selectedTen.includes(v) ? "#C9843A" : "rgba(45,27,78,0.08)", color: selectedTen.includes(v) ? "#fff" : "#6B5B7B", borderColor: selectedTen.includes(v) ? "#C9843A" : "rgba(45,27,78,0.15)" }}>{v}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Add a custom value..." style={{ ...styles.input, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addCustomValueAndContinue()} />
              <button onClick={addCustomValueAndContinue} style={styles.btnSecondary}>+ Add</button>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 2: Narrow to 3–5 Core Values</h2>
            <p style={styles.stepDesc}>
              From your top 10, select 3 to 5 values most important to you right now.
              <strong style={{ color: selectedCore.length >= 3 ? "#C9843A" : "#C9843A" }}> ({selectedCore.length}/5 selected{selectedCore.length < 3 ? ` — need at least ${3 - selectedCore.length} more` : " ✓"})</strong>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {selectedTen.map((v) => (
                <button key={v} onClick={() => toggleCore(v)} style={{ ...styles.selectableChip, padding: "10px 20px", fontSize: 15, background: selectedCore.includes(v) ? "#5B2D8E" : "rgba(45,27,78,0.08)", color: selectedCore.includes(v) ? "#fff" : "#6B5B7B", borderColor: selectedCore.includes(v) ? "#5B2D8E" : "rgba(45,27,78,0.15)" }}>{v}</button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 3: Visualize Your Values</h2>
            <p style={styles.stepDesc}>Use the sliders to set how important each value is to you. Then describe what each value means.</p>
            <PieChart values={selectedCore} percentages={percentages} descriptions={descriptions} onPercentageChange={handlePercentageChange} activeIndex={activeSlider} onActiveChange={setActiveSlider} onSliderRelease={handleSliderRelease} lastTouched={lastTouched.current} interactive />
            <div style={{ marginTop: 24 }}>
              {selectedCore.map((v, i) => (
                <div key={v} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i % PALETTE.length] }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a0a2e" }}>{v}</span>
                  </div>
                  <textarea value={descriptions[i] || ""} onChange={(e) => handleDescChange(i, e.target.value)} placeholder={`What does "${v}" mean to you? Why this size?`} style={styles.textarea} rows={2} />
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 4: Select Goals for Each Value</h2>
            <p style={styles.stepDesc}>
              {aiLoading ? "Generating personalized goals..." : "AI generated these goals based on your descriptions. Tap to select the ones you want to pursue."}
              {!aiLoading && <strong style={{ color: "#C9843A" }}> ({totalGoals} selected)</strong>}
            </p>
            {/* Save banner — always visible */}
            {!aiLoading && (
              <div style={{ padding: "12px 16px", background: "rgba(201,132,58,0.08)", border: "1px solid rgba(201,132,58,0.2)", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#6B5B7B" }}>
                  {currentUser ? `☁️ Saving to ${currentUser.email}` : "💾 Save your progress to the cloud"}
                </p>
                <button onClick={async () => {
                  if (currentUser && !currentUser.localOnly) {
                    await supabase.saveProfile(currentUser.email, {
                      step, allValues, selectedTen, selectedCore, percentages,
                      descriptions, selectedGoals, aiGeneratedGoals, weeklyActions, todoItems, identityStatement,
                    });
                    alert("Saved!");
                  } else {
                    setShowRegModal(true);
                  }
                }} style={{ padding: "6px 14px", background: "#C9843A", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                  {currentUser ? "Save Now" : "Save →"}
                </button>
              </div>
            )}
            {aiError && <div style={{ padding: 10, background: "rgba(244,162,97,0.1)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 8, marginBottom: 16 }}><span style={{ fontSize: 12, color: "#C9843A" }}>{aiError}</span></div>}
            {aiLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ display: "inline-block", width: 40, height: 40, border: "3px solid rgba(201,132,58,0.2)", borderTop: "3px solid #2A9D8F", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: "#6B5B7B", fontSize: 13, marginTop: 12 }}>Reading your descriptions and crafting personalized goals...</p>
              </div>
            ) : (
              <>
                {selectedCore.map((v, i) => {
                  const goals = aiGeneratedGoals[v] || COMMON_GOALS[v] || ["Set meaningful objectives", "Build consistent habits", "Track your progress", "Seek accountability"];
                  return (
                    <div key={v} style={{ marginBottom: 28 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: PALETTE[i % PALETTE.length] }} />
                        <h3 style={{ margin: 0, color: "#1a0a2e", fontSize: 16 }}>{v}</h3>
                        <span style={{ fontSize: 12, color: "#8B7B9B", marginLeft: 4 }}>({percentages[i]}%)</span>
                      </div>
                      {descriptions[i]?.trim() ? (
                        <p style={{ fontSize: 11, color: "#8B7B9B", fontStyle: "italic", margin: "0 0 10px 22px" }}>Based on: "{descriptions[i].length > 80 ? descriptions[i].slice(0, 80) + "..." : descriptions[i]}"</p>
                      ) : (
                        <p style={{ fontSize: 11, color: "#9B8BAB", margin: "0 0 10px 22px" }}>Goals scaled to {percentages[i]}% importance</p>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {goals.map((goal) => {
                          const sel = (selectedGoals[v] || []).includes(goal);
                          return (
                            <button key={goal} onClick={() => toggleGoal(v, goal)} style={{ ...styles.goalSelectBtn, background: sel ? "rgba(201,132,58,0.15)" : "rgba(45,27,78,0.04)", borderColor: sel ? "#C9843A" : "rgba(45,27,78,0.1)" }}>
                              <span style={{ width: 20, height: 20, borderRadius: 4, border: sel ? "2px solid #2A9D8F" : "2px solid #475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#C9843A", flexShrink: 0 }}>{sel ? "✓" : ""}</span>
                              <span style={{ fontSize: 13, color: sel ? "#1a0a2e" : "#6B5B7B" }}>{goal}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { setSelectedGoals({}); setAiGeneratedGoals({}); generateAiGoals(); }} style={{ ...styles.btnSecondary, marginTop: 8, fontSize: 12 }}>Regenerate Goals</button>
              </>
            )}
          </div>
        );
      case 4:
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 5: Your Personal Identity Statement</h2>
            <p style={styles.stepDesc}>
              Based on your core values and goals, AI has generated 3 identity statement options. Select the one that resonates most, or regenerate for new options.
            </p>

            {/* Values summary */}
            <div style={{ padding: 16, background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.1)", borderRadius: 12, marginBottom: 24 }}>
              <p style={{ color: "#8B7B9B", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Your Core Values Summary</p>
              {selectedCore.map((v, i) => (
                <div key={v} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a0a2e" }}>{v}</span>
                    <span style={{ fontSize: 12, color: "#8B7B9B", marginLeft: 6 }}>({percentages[i]}%)</span>
                    {descriptions[i] && <p style={{ fontSize: 12, color: "#6B5B7B", fontStyle: "italic", margin: "2px 0 0" }}>&ldquo;{descriptions[i].length > 100 ? descriptions[i].slice(0, 100) + "..." : descriptions[i]}&rdquo;</p>}
                  </div>
                </div>
              ))}
            </div>

            {identityLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ display: "inline-block", width: 40, height: 40, border: "3px solid rgba(201,132,58,0.2)", borderTop: "3px solid #2A9D8F", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#6B5B7B", fontSize: 13, marginTop: 12 }}>Crafting your personal identity statements...</p>
              </div>
            ) : (
              <>
                {identityError && (
                  <div style={{ padding: 10, background: "rgba(244,162,97,0.1)", border: "1px solid rgba(244,162,97,0.2)", borderRadius: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: "#C9843A" }}>{identityError}</span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {identityOptions.map((option, i) => {
                    const selected = identityStatement === option;
                    return (
                      <button key={i} onClick={() => setIdentityStatement(option)}
                        style={{ padding: "18px 20px", borderRadius: 12, border: selected ? "2px solid #2A9D8F" : "1.5px solid rgba(45,27,78,0.15)", background: selected ? "rgba(201,132,58,0.12)" : "rgba(45,27,78,0.04)", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", border: selected ? "2px solid #2A9D8F" : "2px solid #475569", background: selected ? "#C9843A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, marginTop: 2 }}>
                            {selected ? "✓" : (i + 1)}
                          </div>
                          <p style={{ margin: 0, fontSize: 14, color: selected ? "#1a0a2e" : "#6B5B7B", lineHeight: 1.6, fontStyle: "italic" }}>"{option}"</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {identityStatement && (
                  <div style={{ padding: "16px 20px", background: "rgba(201,132,58,0.08)", border: "1px solid rgba(201,132,58,0.2)", borderRadius: 12, marginBottom: 20 }}>
                    <p style={{ color: "#C9843A", fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Your Identity Statement</p>
                    <p style={{ color: "#1a0a2e", fontSize: 15, margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>"{identityStatement}"</p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setIdentityOptions([]); setIdentityStatement(""); generateIdentityStatements(); }}
                    style={{ ...styles.btnSecondary, fontSize: 13 }}>
                    🔄 Regenerate Options
                  </button>
                </div>

                <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.1)", borderRadius: 10 }}>
                  <p style={{ color: "#8B7B9B", fontSize: 12, margin: "0 0 8px" }}>Or write your own:</p>
                  <textarea
                    value={identityStatement}
                    onChange={(e) => setIdentityStatement(e.target.value)}
                    placeholder="I am a..."
                    style={{ ...styles.textarea, minHeight: 80 }}
                    rows={3}
                  />
                </div>

                {/* Book a session CTA */}
                <div style={{ marginTop: 24, padding: "20px 24px", background: "linear-gradient(135deg, rgba(201,132,58,0.12), rgba(38,70,83,0.2))", border: "1px solid rgba(201,132,58,0.25)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Want to explore this further?</p>
                    <p style={{ color: "#6B5B7B", fontSize: 12, margin: 0, lineHeight: 1.5 }}>Book a 1:1 session to discuss your core values and identity statement with a coach.</p>
                  </div>
                  <a href="https://www.paritycoaching.org" target="_blank" rel="noopener noreferrer"
                    style={{ padding: "10px 20px", background: "#C9843A", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0, display: "inline-block" }}>
                    Book a Session →
                  </a>
                </div>
              </>
            )}
          </div>
        );
      case 5: {
        const customGoalsByValue = {};
        selectedCore.forEach((v) => {
          const aiGoals = aiGeneratedGoals[v] || COMMON_GOALS[v] || [];
          customGoalsByValue[v] = (selectedGoals[v] || []).filter((g) => !aiGoals.includes(g));
        });
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 5: Add Your Own Goals</h2>
            <p style={styles.stepDesc}>Have a goal that wasn't in the AI suggestions? Add it here.</p>
            <div style={{ padding: 20, background: "rgba(45,27,78,0.05)", borderRadius: 12, border: "1px solid rgba(45,27,78,0.1)", marginBottom: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 600, margin: 0 }}>Which value does this goal support?</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedCore.map((v, i) => (
                    <button key={v} onClick={() => setCustomGoalValue(v)} style={{ padding: "8px 16px", borderRadius: 8, border: customGoalValue === v ? `2px solid ${PALETTE[i % PALETTE.length]}` : "1.5px solid rgba(45,27,78,0.15)", background: customGoalValue === v ? `${PALETTE[i % PALETTE.length]}22` : "rgba(45,27,78,0.05)", color: customGoalValue === v ? PALETTE[i % PALETTE.length] : "#6B5B7B", fontWeight: customGoalValue === v ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>{v}</button>
                  ))}
                </div>
                <input value={customGoalText} onChange={(e) => setCustomGoalText(e.target.value)} placeholder={customGoalValue ? `Type a goal for "${customGoalValue}"...` : "Select a value first..."} style={{ ...styles.input, marginTop: 4 }} onKeyDown={(e) => e.key === "Enter" && addCustomGoal()} disabled={!customGoalValue} />
                <button onClick={addCustomGoal} disabled={!customGoalText.trim() || !customGoalValue} style={{ ...styles.btnPrimary, alignSelf: "flex-start", opacity: customGoalText.trim() && customGoalValue ? 1 : 0.4, cursor: customGoalText.trim() && customGoalValue ? "pointer" : "not-allowed" }}>+ Add Goal</button>
              </div>
            </div>
            {selectedCore.some((v) => (customGoalsByValue[v] || []).length > 0) && (
              <div>
                <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Your Custom Goals</p>
                {selectedCore.map((v, i) => {
                  const customs = customGoalsByValue[v] || [];
                  if (customs.length === 0) return null;
                  return (
                    <div key={v} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: PALETTE[i % PALETTE.length] }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a0a2e" }}>{v}</span>
                      </div>
                      {customs.map((g, gi) => (
                        <div key={gi} style={{ padding: "8px 14px", background: "rgba(201,132,58,0.1)", border: "1px solid rgba(201,132,58,0.2)", borderRadius: 8, marginBottom: 4, marginLeft: 20, fontSize: 13, color: "#1a0a2e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>{g}</span>
                          <button onClick={() => setSelectedGoals((prev) => ({ ...prev, [v]: (prev[v] || []).filter((x) => x !== g) }))} style={{ background: "none", border: "none", color: "#8B7B9B", cursor: "pointer", fontSize: 16, padding: "2px 6px", fontFamily: "inherit" }}>×</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      case 6:
        return (
          <div>
            <h2 style={styles.stepHeading}>Step 6: Final Review</h2>
            <p style={styles.stepDesc}>Review your core values, their importance, and all associated goals.</p>
            <PieChart values={selectedCore} percentages={percentages} descriptions={descriptions} activeIndex={null} onActiveChange={() => {}} />
            <div style={{ marginTop: 32 }}>
              {selectedCore.map((v, i) => (
                <div key={v} style={{ marginBottom: 28, padding: 20, background: "rgba(45,27,78,0.04)", borderRadius: 12, border: "1px solid rgba(45,27,78,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: PALETTE[i % PALETTE.length] }} />
                    <h3 style={{ margin: 0, color: "#1a0a2e", fontSize: 18 }}>{v}</h3>
                    <span style={{ fontSize: 14, color: PALETTE[i % PALETTE.length], fontWeight: 700 }}>{percentages[i]}%</span>
                  </div>
                  {descriptions[i] && <p style={{ color: "#6B5B7B", fontSize: 13, fontStyle: "italic", marginBottom: 12, paddingLeft: 26 }}>"{descriptions[i]}"</p>}
                  <div style={{ paddingLeft: 26 }}>
                    <p style={{ color: "#8B7B9B", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Selected Goals</p>
                    {(selectedGoals[v] || []).length === 0 ? (
                      <p style={{ color: "#9B8BAB", fontSize: 13 }}>No goals selected.</p>
                    ) : (
                      (selectedGoals[v] || []).map((g, gi) => (
                        <div key={gi} style={{ padding: "6px 12px", background: "rgba(201,132,58,0.08)", borderRadius: 6, marginBottom: 4, fontSize: 13, color: "#4A2D6E" }}>{g}</div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep(2)} style={styles.btnSecondary}>← Edit Pie Chart</button>
              <button onClick={() => setStep(3)} style={styles.btnSecondary}>← Edit Goals</button>
              <button onClick={() => setStep(7)} style={styles.btnPrimary}>Start Weekly Tracker →</button>
            </div>
          </div>
        );
      case 7: {
        const allGoalsFlat = [];
        selectedCore.forEach((v) => { (selectedGoals[v] || []).forEach((g) => allGoalsFlat.push({ value: v, goal: g })); });
        const actionsByValue = {};
        const actionsByGoal = {};
        selectedCore.forEach((v) => { actionsByValue[v] = 0; (selectedGoals[v] || []).forEach((g) => { actionsByGoal[`${v}::${g}`] = 0; }); });
        weeklyActions.forEach((a) => { if (actionsByValue[a.value] !== undefined) actionsByValue[a.value]++; if (a.goal && actionsByGoal[`${a.value}::${a.goal}`] !== undefined) actionsByGoal[`${a.value}::${a.goal}`]++; });
        const totalActions = weeklyActions.length;
        const actualDistribution = selectedCore.map((v) => totalActions > 0 ? Math.round((actionsByValue[v] / totalActions) * 100) : 0);
        const overallAlignment = totalActions > 0 ? Math.max(0, Math.round(100 - selectedCore.reduce((sum, v, i) => sum + Math.abs(actualDistribution[i] - percentages[i]), 0) / selectedCore.length)) : 0;
        const valuesWithActions = selectedCore.filter((v) => actionsByValue[v] > 0).length;
        const totalGoalsCount = allGoalsFlat.length;
        const goalsWithActions = allGoalsFlat.filter((g) => actionsByGoal[`${g.value}::${g.goal}`] > 0).length;

        const addTodoAction = () => {
          if (!newTodoText.trim() || !newTodoValue) return;
          setTodoItems((prev) => [...prev, { id: Date.now(), text: newTodoText.trim(), value: newTodoValue, goal: newTodoGoal, date: newTodoDate || getLocalDate(), done: false, completedDate: null }]);
          setNewTodoText(""); setNewTodoGoal("");
        };
        const completeTodo = (todo) => {
          const today = getLocalDate();
          setTodoItems((prev) => prev.map((t) => t.id === todo.id ? { ...t, done: true, completedDate: today } : t));
          setWeeklyActions((prev) => [...prev, { id: Date.now() + Math.random(), text: todo.text, value: todo.value, goal: todo.goal, date: today, type: "todo" }]);
        };
        const removeAction = (id) => setWeeklyActions((prev) => prev.filter((a) => a.id !== id));

        const actionsByDate = {};
        weeklyActions.forEach((a) => { if (!actionsByDate[a.date]) actionsByDate[a.date] = []; actionsByDate[a.date].push(a); });
        const sortedDates = Object.keys(actionsByDate).sort().reverse();

        const getWeekDates = (centerDate) => {
          const d = new Date(centerDate + "T12:00:00");
          const day = d.getDay();
          const start = new Date(d);
          start.setDate(d.getDate() - day);
          const dates = [];
          for (let i = 0; i < 7; i++) { const dd = new Date(start); dd.setDate(start.getDate() + i); dates.push(toLocalStr(dd)); }
          return dates;
        };
        const weekDates = getWeekDates(calendarDate);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        return (
          <div>
            <h2 style={styles.stepHeading}>Weekly Action Tracker</h2>
            <p style={styles.stepDesc}>Track your weekly actions, then see how well they align with your core values.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 12, textAlign: "center", background: overallAlignment >= 75 ? "rgba(201,132,58,0.1)" : overallAlignment >= 50 ? "rgba(244,162,97,0.1)" : "rgba(91,45,142,0.1)", border: `1px solid ${overallAlignment >= 75 ? "rgba(201,132,58,0.25)" : overallAlignment >= 50 ? "rgba(244,162,97,0.25)" : "rgba(232,93,117,0.25)"}` }}>
                <p style={{ color: "#6B5B7B", fontSize: 10, marginTop: 0, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Alignment</p>
                <p style={{ fontSize: 36, fontWeight: 800, margin: 0, color: overallAlignment >= 75 ? "#C9843A" : overallAlignment >= 50 ? "#C9843A" : "#5B2D8E" }}>{totalActions > 0 ? `${overallAlignment}%` : "—"}</p>
                <p style={{ color: "#8B7B9B", fontSize: 10, margin: "2px 0 0" }}>vs your pie chart</p>
              </div>
              <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 12, textAlign: "center", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.1)" }}>
                <p style={{ color: "#6B5B7B", fontSize: 10, marginTop: 0, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Value Coverage</p>
                <p style={{ fontSize: 36, fontWeight: 800, margin: 0, color: "#1a0a2e" }}>{valuesWithActions}/{selectedCore.length}</p>
                <p style={{ color: "#8B7B9B", fontSize: 10, margin: "2px 0 0" }}>values with actions</p>
              </div>
              <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 12, textAlign: "center", background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.1)" }}>
                <p style={{ color: "#6B5B7B", fontSize: 10, marginTop: 0, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Goal Progress</p>
                <p style={{ fontSize: 36, fontWeight: 800, margin: 0, color: "#1a0a2e" }}>{goalsWithActions}/{totalGoalsCount}</p>
                <p style={{ color: "#8B7B9B", fontSize: 10, margin: "2px 0 0" }}>goals with activity</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(45,27,78,0.05)", borderRadius: 10, padding: 4 }}>
              {[{ key: "manual", label: "Manual Entry" }, { key: "todo", label: "To-Do List" }, { key: "calendar", label: "History" }].map((m) => (
                <button key={m.key} onClick={() => setInputMode(m.key)} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: inputMode === m.key ? "#C9843A" : "transparent", color: inputMode === m.key ? "#fff" : "#8B7B9B", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>{m.label}</button>
              ))}
            </div>

            {inputMode === "manual" && (
              <div style={{ padding: 20, background: "rgba(45,27,78,0.05)", borderRadius: 12, border: "1px solid rgba(45,27,78,0.1)", marginBottom: 24 }}>
                <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>Log an Action</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={newActionText} onChange={(e) => setNewActionText(e.target.value)} placeholder="What did you do? (e.g. Went for a 30-min run)" style={styles.input} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={newActionValue} onChange={(e) => { setNewActionValue(e.target.value); setNewActionGoal(""); }} style={{ ...styles.input, flex: 1, minWidth: 140, cursor: "pointer" }}>
                      <option value="">Value...</option>
                      {selectedCore.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {newActionValue && (selectedGoals[newActionValue] || []).length > 0 && (
                      <select value={newActionGoal} onChange={(e) => setNewActionGoal(e.target.value)} style={{ ...styles.input, flex: 1, minWidth: 140, cursor: "pointer" }}>
                        <option value="">Link to goal (optional)...</option>
                        {(selectedGoals[newActionValue] || []).map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                  </div>
                  <input type="date" value={newActionDate || getLocalDate()} onChange={(e) => setNewActionDate(e.target.value)} style={{ ...styles.input, width: 160 }} />
                  <button onClick={() => { if (!newActionText.trim() || !newActionValue) return; setWeeklyActions((prev) => [...prev, { id: Date.now(), text: newActionText.trim(), value: newActionValue, goal: newActionGoal, date: newActionDate || getLocalDate(), type: "manual" }]); setNewActionText(""); setNewActionGoal(""); }}
                    disabled={!newActionText.trim() || !newActionValue}
                    style={{ ...styles.btnPrimary, alignSelf: "flex-start", opacity: newActionText.trim() && newActionValue ? 1 : 0.4, cursor: newActionText.trim() && newActionValue ? "pointer" : "not-allowed" }}>
                    + Log Action
                  </button>
                </div>
              </div>
            )}

            {inputMode === "todo" && (
              <div style={{ padding: 20, background: "rgba(45,27,78,0.05)", borderRadius: 12, border: "1px solid rgba(45,27,78,0.1)", marginBottom: 24 }}>
                <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>Create Tasks & Check Them Off</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} placeholder="Task description..." style={styles.input} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={newTodoValue} onChange={(e) => { setNewTodoValue(e.target.value); setNewTodoGoal(""); }} style={{ ...styles.input, flex: 1, minWidth: 140, cursor: "pointer" }}>
                      <option value="">Value...</option>
                      {selectedCore.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {newTodoValue && (selectedGoals[newTodoValue] || []).length > 0 && (
                      <select value={newTodoGoal} onChange={(e) => setNewTodoGoal(e.target.value)} style={{ ...styles.input, flex: 1, minWidth: 140, cursor: "pointer" }}>
                        <option value="">Link to goal (optional)...</option>
                        {(selectedGoals[newTodoValue] || []).map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                  </div>
                  <input type="date" value={newTodoDate || getLocalDate()} onChange={(e) => setNewTodoDate(e.target.value)} style={{ ...styles.input, width: 160 }} />
                  <button onClick={addTodoAction} disabled={!newTodoText.trim() || !newTodoValue} style={{ ...styles.btnPrimary, alignSelf: "flex-start", opacity: newTodoText.trim() && newTodoValue ? 1 : 0.4, cursor: newTodoText.trim() && newTodoValue ? "pointer" : "not-allowed" }}>+ Add Task</button>
                </div>
                {todoItems.map((t) => {
                  const vIdx = selectedCore.indexOf(t.value);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: t.done ? "rgba(201,132,58,0.08)" : "rgba(45,27,78,0.04)", borderRadius: 8, border: "1px solid rgba(45,27,78,0.08)", marginBottom: 6 }}>
                      <button onClick={() => !t.done && completeTodo(t)} style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, cursor: t.done ? "default" : "pointer", border: t.done ? "2px solid #2A9D8F" : "2px solid #475569", background: t.done ? "#C9843A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontFamily: "inherit" }}>{t.done ? "✓" : ""}</button>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, color: t.done ? "#8B7B9B" : "#1a0a2e", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                        <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: vIdx >= 0 ? PALETTE[vIdx % PALETTE.length] : "#8B7B9B", fontWeight: 600 }}>{t.value}</span>
                          {t.goal && <span style={{ fontSize: 10, color: "#9B8BAB" }}>→ {t.goal}</span>}
                          <span style={{ fontSize: 10, color: "#9B8BAB" }}>📅 {t.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {inputMode === "calendar" && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ padding: 16, background: "rgba(45,27,78,0.05)", borderRadius: 12, border: "1px solid rgba(45,27,78,0.1)", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <button onClick={() => { const d = new Date(calendarDate + "T12:00:00"); d.setDate(d.getDate() - 7); setCalendarDate(toLocalStr(d)); }} style={{ background: "none", border: "none", color: "#6B5B7B", cursor: "pointer", fontSize: 20, fontFamily: "inherit", padding: "4px 12px" }}>←</button>
                    <span style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 600 }}>Week of {weekDates[0]}</span>
                    <button onClick={() => { const d = new Date(calendarDate + "T12:00:00"); d.setDate(d.getDate() + 7); setCalendarDate(toLocalStr(d)); }} style={{ background: "none", border: "none", color: "#6B5B7B", cursor: "pointer", fontSize: 20, fontFamily: "inherit", padding: "4px 12px" }}>→</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                    {weekDates.map((date, di) => {
                      const dayActs = actionsByDate[date] || [];
                      const isToday = date === getLocalDate();
                      const isSelected = date === selectedCalendarDate;
                      const dotCount = dayActs.length;
                      return (
                        <button key={date} onClick={() => setSelectedCalendarDate(date)} style={{ padding: "8px 4px", borderRadius: 10, minHeight: 72, textAlign: "center", cursor: "pointer", fontFamily: "inherit", border: "none", background: isSelected ? "rgba(201,132,58,0.2)" : isToday ? "rgba(201,132,58,0.08)" : dotCount > 0 ? "rgba(45,27,78,0.05)" : "rgba(255,255,255,0.02)", outline: isSelected ? "2px solid #2A9D8F" : "none", transition: "all 0.15s ease" }}>
                          <p style={{ fontSize: 10, color: "#8B7B9B", margin: "0 0 2px" }}>{dayNames[di]}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: isSelected || isToday ? "#C9843A" : "#1a0a2e", margin: "0 0 4px" }}>{date.split("-")[2]}</p>
                          <div style={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
                            {dayActs.slice(0, 4).map((a, ai) => { const vIdx = selectedCore.indexOf(a.value); return <div key={ai} style={{ width: 7, height: 7, borderRadius: "50%", background: vIdx >= 0 ? PALETTE[vIdx % PALETTE.length] : "#9B8BAB" }} />; })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ padding: 20, background: "rgba(45,27,78,0.05)", borderRadius: 12, border: "1px solid rgba(45,27,78,0.1)" }}>
                  <p style={{ color: "#1a0a2e", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{selectedCalendarDate}</p>
                  {(actionsByDate[selectedCalendarDate] || []).length === 0 ? (
                    <p style={{ color: "#9B8BAB", fontSize: 13 }}>Nothing logged for this day.</p>
                  ) : (
                    (actionsByDate[selectedCalendarDate] || []).map((a) => {
                      const valIdx = selectedCore.indexOf(a.value);
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(45,27,78,0.04)", borderRadius: 8, border: "1px solid rgba(45,27,78,0.08)", marginBottom: 4 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: valIdx >= 0 ? PALETTE[valIdx % PALETTE.length] : "#9B8BAB", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, color: "#1a0a2e" }}>{a.text}</span>
                            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 10, color: valIdx >= 0 ? PALETTE[valIdx % PALETTE.length] : "#8B7B9B", fontWeight: 600 }}>{a.value}</span>
                              {a.goal && <span style={{ fontSize: 10, color: "#9B8BAB" }}>→ {a.goal}</span>}
                            </div>
                          </div>
                          <button onClick={() => removeAction(a.id)} style={{ background: "none", border: "none", color: "#9B8BAB", cursor: "pointer", fontSize: 16, padding: "4px 8px", fontFamily: "inherit" }}>×</button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {weeklyActions.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: "#1a0a2e", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Action Log ({weeklyActions.length})</p>
                {sortedDates.map((date) => (
                  <div key={date} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#8B7B9B", marginBottom: 6, fontWeight: 600 }}>{date}</p>
                    {actionsByDate[date].map((a) => {
                      const valIdx = selectedCore.indexOf(a.value);
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(45,27,78,0.04)", borderRadius: 8, border: "1px solid rgba(45,27,78,0.08)", marginBottom: 4 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: valIdx >= 0 ? PALETTE[valIdx % PALETTE.length] : "#9B8BAB", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, color: "#1a0a2e" }}>{a.text}</span>
                            <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, color: valIdx >= 0 ? PALETTE[valIdx % PALETTE.length] : "#8B7B9B", fontWeight: 600 }}>{a.value}</span>
                              {a.goal && <span style={{ fontSize: 10, color: "#9B8BAB" }}>→ {a.goal}</span>}
                            </div>
                          </div>
                          <button onClick={() => removeAction(a.id)} style={{ background: "none", border: "none", color: "#9B8BAB", cursor: "pointer", fontSize: 16, padding: "4px 8px", fontFamily: "inherit" }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setStep(6)} style={styles.btnSecondary}>← Back to Final Review</button>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div style={{ ...styles.root, position: "relative" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {showWelcomeModal && <WelcomeModal onNewUser={handleNewUser} onLoadUser={handleLoadUser} onNewUserLeadership={handleNewUserLeadership} onLoadUserLeadership={handleLoadUserLeadership} />}
      {showRegModal && <RegistrationModal onComplete={handleRegistrationComplete} onSkip={handleSkipReg} />}

      {showLeadership ? (
        <LeadershipAssessment onBack={() => setShowWelcomeModal(true)} currentUser={currentUser} coreValues={selectedCore} />
      ) : (
      <>
      {/* Top right: user badge */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 20, background: "rgba(201,132,58,0.1)", border: "1px solid rgba(201,132,58,0.25)" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#C9843A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>{currentUser.email[0].toUpperCase()}</span>
            <span style={{ fontSize: 12, color: "#C9843A", fontWeight: 600 }}>{currentUser.email.split("@")[0]}</span>
            {currentUser.localOnly && <span style={{ fontSize: 9, color: "#C9843A", padding: "1px 5px", background: "rgba(244,162,97,0.15)", borderRadius: 4 }}>local</span>}
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#8B7B9B", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowWelcomeModal(true)} style={{ padding: "8px 14px", background: "rgba(201,132,58,0.1)", border: "1px solid rgba(201,132,58,0.25)", borderRadius: 20, color: "#C9843A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
        )}

        <button onClick={handleClearData} title="Clear all data" style={{ padding: "8px 10px", background: "rgba(91,45,142,0.08)", border: "1px solid rgba(232,93,117,0.2)", borderRadius: 20, color: "#5B2D8E", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
      </div>

      <div style={styles.container}>
        <div style={styles.header}>
          <img src="/parity-logo.png" alt="Parity Coaching" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <p style={styles.subtitle}>Core Values to Goals</p>
        </div>

        {/* Auto-save indicator */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#B0A0BF", marginBottom: 8 }}>
          {currentUser && !currentUser.localOnly ? "☁️ Auto-saving to cloud" : "💾 Saving locally"}
        </p>

        {/* Return user banner */}
        {showReturnBanner && currentUser && (
          <ReturnBanner email={currentUser.email} onLoad={handleLoadCloudData} onDismiss={() => setShowReturnBanner(false)} />
        )}

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((step + 1) / 8) * 100}%` }} />
        </div>
        <p style={{ textAlign: "center", color: "#8B7B9B", fontSize: 12, marginBottom: 24 }}>{step + 1} of 8</p>

        {renderStep()}

        <div style={styles.nav}>
          {step > 0 && step < 7 && <button onClick={() => setStep(step - 1)} style={styles.btnSecondary}>← Back</button>}
          {step < 5 && (
            <button onClick={handleNext} disabled={!canNext()} style={{ ...styles.btnPrimary, marginLeft: "auto", opacity: canNext() ? 1 : 0.4, cursor: canNext() ? "pointer" : "not-allowed" }}>
              {nextLabel()}
            </button>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#F9F6F2", fontFamily: "'Raleway', 'Lato', system-ui, sans-serif", color: "#1a0a2e", padding: "20px 0" },
  container: { maxWidth: 600, margin: "0 auto", padding: "0 20px" },
  header: { textAlign: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 800, margin: "0 0 6px", background: "linear-gradient(135deg, #2D1B4E, #5B2D8E, #C9843A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { fontSize: 14, color: "#6B5B7B", margin: 0 },
  progressBar: { height: 4, background: "rgba(45,27,78,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #5B2D8E, #C9843A)", borderRadius: 4, transition: "width 0.4s ease" },
  stepHeading: { fontSize: 22, fontWeight: 800, color: "#1a0a2e", marginBottom: 8 },
  stepDesc: { fontSize: 14, color: "#6B5B7B", marginBottom: 20, lineHeight: 1.5 },
  selectableChip: { padding: "8px 16px", borderRadius: 20, border: "1.5px solid rgba(45,27,78,0.25)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all 0.2s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation", userSelect: "none", background: "#fff", color: "#4A2D6E" },
  input: { padding: "10px 14px", background: "rgba(45,27,78,0.08)", border: "1px solid rgba(45,27,78,0.15)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none" },
  textarea: { width: "100%", padding: "10px 14px", background: "rgba(45,27,78,0.08)", border: "1px solid rgba(45,27,78,0.15)", borderRadius: 8, color: "#1a0a2e", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" },
  goalSelectBtn: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(45,27,78,0.2)", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation", background: "#fff" },
  btnPrimary: { padding: "10px 20px", background: "#C9843A", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" },
  btnSecondary: { padding: "10px 20px", background: "rgba(45,27,78,0.08)", border: "1px solid rgba(45,27,78,0.15)", borderRadius: 8, color: "#6B5B7B", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" },
  nav: { display: "flex", justifyContent: "space-between", marginTop: 32, paddingBottom: 40 },
};
