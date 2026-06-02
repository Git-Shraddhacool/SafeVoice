import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Replace these with your actual Supabase project values
// Found at: supabase.com → Your Project → Settings → API
const SUPABASE_URL = 'https://qcysyrjxbwxaogorctua.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bV_wfYeLGsX9GUzdLVswIQ_9s_ifQz-';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Bullying / Harassment',
  'Teacher Misconduct',
  'Facilities / Infrastructure',
  'Academic Unfairness',
  'Safety Concern',
  'Mental Health',
  'Discrimination',
  'Other',
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#b45309', bg: '#fef3c7' },
  'in-review': { label: 'In Review', color: '#1d4ed8', bg: '#dbeafe' },
  resolved: { label: 'Resolved', color: '#15803d', bg: '#dcfce7' },
  dismissed: { label: 'Dismissed', color: '#6b7280', bg: '#f3f4f6' },
};

function generateRef() {
  return 'CMP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    minHeight: '100vh',
    background:
      'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    color: '#e2e8f0',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '2rem',
    backdropFilter: 'blur(12px)',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '0.75rem 1rem',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: (v = 'primary') => ({
    padding: '0.75rem 1.5rem',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
    ...(v === 'primary'
      ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }
      : v === 'danger'
      ? {
          background: 'rgba(239,68,68,0.15)',
          color: '#f87171',
          border: '1px solid rgba(239,68,68,0.3)',
        }
      : v === 'success'
      ? {
          background: 'rgba(34,197,94,0.15)',
          color: '#4ade80',
          border: '1px solid rgba(34,197,94,0.3)',
        }
      : {
          background: 'rgba(255,255,255,0.08)',
          color: '#94a3b8',
          border: '1px solid rgba(255,255,255,0.1)',
        }),
  }),
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
    display: 'block',
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  badge: (status) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: STATUS_CONFIG[status]?.bg || '#f3f4f6',
    color: STATUS_CONFIG[status]?.color || '#6b7280',
  }),
  priorityBadge: (p) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background:
      p === 'high'
        ? 'rgba(239,68,68,0.15)'
        : p === 'medium'
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(34,197,94,0.15)',
    color: p === 'high' ? '#f87171' : p === 'medium' ? '#fbbf24' : '#4ade80',
  }),
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        background:
          type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)',
        color: '#fff',
        padding: '0.75rem 1.25rem',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {msg}
    </div>
  );
}

// ─── LOADING SPINNER ──────────────────────────────────────────────────────────
function Spinner({ label = 'Loading…' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ user, profile, onLogout, onNav, currentNav }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          🛡️
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            SafeVoice
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
            {profile?.role === 'principal' ? 'Admin Panel' : 'Student Portal'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {profile?.role === 'student' && (
          <>
            <button
              style={s.btn(currentNav === 'submit' ? 'primary' : 'ghost')}
              onClick={() => onNav('submit')}
            >
              ➕ New Complaint
            </button>
            <button
              style={s.btn(currentNav === 'track' ? 'primary' : 'ghost')}
              onClick={() => onNav('track')}
            >
              📋 My Complaints
            </button>
          </>
        )}
        <div
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 8,
            padding: '4px 12px',
            fontSize: 12,
            color: '#a5b4fc',
          }}
        >
          👤 {profile?.full_name || user?.email}
        </div>
        <button style={s.btn('ghost')} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function LandingPage({ onSelect }) {
  return (
    <div
      style={{
        ...s.root,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        minHeight: '100vh',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: 32,
          }}
        >
          🛡️
        </div>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            margin: '0 0 0.5rem',
            background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SafeVoice
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: 0 }}>
          Anonymous Student Complaint Portal
        </p>
        <p style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>
          Your identity is always protected. Speak up safely.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          maxWidth: 560,
          width: '100%',
        }}
      >
        {[
          {
            emoji: '🎓',
            title: 'Student Portal',
            desc: 'Submit and track anonymous complaints',
            role: 'student',
          },
          {
            emoji: '🏫',
            title: 'Principal Dashboard',
            desc: 'Review and manage all complaints',
            role: 'principal',
          },
        ].map(({ emoji, title, desc, role }) => (
          <div
            key={role}
            style={{
              ...s.card,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
            onClick={() => onSelect(role)}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
              {title}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px' }}>
              {desc}
            </p>
            <div
              style={{
                ...s.btn(role === 'student' ? 'primary' : 'ghost'),
                display: 'inline-block',
              }}
            >
              Enter →
            </div>
          </div>
        ))}
      </div>
      <p style={{ color: '#1e293b', fontSize: 12, marginTop: '3rem' }}>
        Backed by Supabase · Row-level security · Fully anonymous
      </p>
    </div>
  );
}

// ─── AUTH FORM ────────────────────────────────────────────────────────────────
function AuthForm({ role, onBack, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    grade: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    setError('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (err) throw err;
        onSuccess(data.user);
      } else {
        if (!form.name || !form.grade) {
          setError('All fields are required.');
          setLoading(false);
          return;
        }
        if (form.password !== form.confirm) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const { data, error: err } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              grade: form.grade,
              role: role,
            },
          },
        });
        if (err) throw err;
        onSuccess(data.user);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        ...s.root,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: 420, width: '100%' }}>
        <button
          onClick={onBack}
          style={{
            ...s.btn('ghost'),
            marginBottom: '1.5rem',
            padding: '0.5rem 1rem',
            fontSize: 13,
          }}
        >
          ← Back
        </button>
        <div style={s.card}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              {role === 'principal' ? '🔐' : '🎓'}
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>
              {role === 'principal'
                ? 'Principal Login'
                : mode === 'login'
                ? 'Student Login'
                : 'Create Account'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
              {role === 'principal'
                ? 'Authorized access only'
                : mode === 'login'
                ? 'Welcome back'
                : 'Join the portal'}
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '0.75rem',
                marginBottom: 16,
                color: '#f87171',
                fontSize: 13,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {mode === 'register' && role === 'student' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Full Name</label>
                <input
                  style={s.input}
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Grade / Class</label>
                <input
                  style={s.input}
                  placeholder="10-A"
                  value={form.grade}
                  onChange={(e) => set('grade', e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@school.edu"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div style={{ marginBottom: mode === 'register' ? 14 : 20 }}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          {mode === 'register' && (
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Confirm Password</label>
              <input
                style={s.input}
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          <button
            style={{
              ...s.btn('primary'),
              width: '100%',
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? '⏳ Please wait…'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>

          {role === 'student' && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#64748b',
                marginTop: 16,
              }}
            >
              {mode === 'login' ? 'No account? ' : 'Have an account? '}
              <span
                style={{ color: '#a5b4fc', cursor: 'pointer' }}
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {mode === 'login' ? 'Register here' : 'Sign in'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SUBMIT COMPLAINT ─────────────────────────────────────────────────────────
function SubmitComplaint({ user, onSubmitted }) {
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!form.category || !form.title || !form.description) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('complaints')
        .insert({
          complaint_ref: generateRef(),
          student_id: user.id,
          category: form.category,
          title: form.title,
          description: form.description,
          priority: form.priority,
        })
        .select()
        .single();

      if (err) throw err;
      onSubmitted(data);
    } catch (e) {
      setError(e.message || 'Failed to submit. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <div style={s.card}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>
          Submit a Complaint
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: '2rem' }}>
          Your identity is protected by Supabase Row Level Security — only you
          and the principal can see this.
        </p>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '0.75rem',
              marginBottom: 16,
              color: '#f87171',
              fontSize: 13,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={s.label}>Category *</label>
            <select
              style={s.input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={s.label}>Priority *</label>
            <select
              style={s.input}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High / Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Title / Summary *</label>
          <input
            style={s.input}
            placeholder="Brief summary of your complaint…"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={s.label}>Detailed Description *</label>
          <textarea
            style={{ ...s.input, minHeight: 140, resize: 'vertical' }}
            placeholder="Describe what happened, when it occurred, and how it affected you…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 10,
            padding: '0.75rem 1rem',
            marginBottom: 24,
            fontSize: 12,
            color: '#94a3b8',
          }}
        >
          🔒{' '}
          <strong style={{ color: '#a5b4fc' }}>
            Stored securely in Supabase.
          </strong>{' '}
          Row-level security ensures only you and the principal can access this
          record. Your personal details are never shown to the principal.
        </div>

        <button
          style={{
            ...s.btn('primary'),
            width: '100%',
            padding: '1rem',
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '⏳ Submitting…' : 'Submit Anonymously →'}
        </button>
      </div>
    </div>
  );
}

// ─── SUBMIT SUCCESS ───────────────────────────────────────────────────────────
function SubmitSuccess({ complaint, onNew, onTrack }) {
  return (
    <div style={{ maxWidth: 560, margin: '4rem auto', padding: '0 2rem' }}>
      <div
        style={{
          ...s.card,
          textAlign: 'center',
          borderColor: 'rgba(34,197,94,0.3)',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ margin: '0 0 8px', color: '#4ade80' }}>
          Complaint Submitted!
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 20 }}>
          Stored securely in Supabase. The principal has been notified.
        </p>
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10,
            padding: '1rem',
            display: 'inline-block',
            marginBottom: 24,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            Complaint Reference
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: '#4ade80',
              letterSpacing: '0.1em',
            }}
          >
            {complaint.complaint_ref}
          </p>
        </div>
        <br />
        <button style={s.btn('primary')} onClick={onNew}>
          Submit Another
        </button>
        <button style={{ ...s.btn('ghost'), marginLeft: 8 }} onClick={onTrack}>
          View My Complaints
        </button>
      </div>
    </div>
  );
}

// ─── MY COMPLAINTS (Student) ──────────────────────────────────────────────────
function MyComplaints({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      setComplaints(data || []);
      setLoading(false);
    }
    load();

    // Real-time subscription
    const channel = supabase
      .channel('my-complaints')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `student_id=eq.${user.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user.id]);

  if (loading) return <Spinner label="Loading your complaints…" />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>
        My Complaints
      </h2>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: '1.5rem' }}>
        Real-time updates from Supabase · {complaints.length} record(s)
      </p>

      {complaints.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: '#64748b' }}>No complaints submitted yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.map((c) => (
            <div key={c.id} style={{ ...s.card, padding: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      fontFamily: 'monospace',
                    }}
                  >
                    {c.complaint_ref}
                  </span>
                  <h3
                    style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600 }}
                  >
                    {c.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={s.priorityBadge(c.priority)}>{c.priority}</span>
                  <span style={s.badge(c.status)}>
                    {STATUS_CONFIG[c.status]?.label}
                  </span>
                </div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '8px 0' }}>
                {c.description.slice(0, 120)}…
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: '#475569' }}>
                  📂 {c.category} · 🕐 {timeAgo(c.created_at)}
                </span>
                {c.admin_note && (
                  <div
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: 12,
                      color: '#a5b4fc',
                      maxWidth: 260,
                    }}
                  >
                    💬 {c.admin_note.slice(0, 60)}
                    {c.admin_note.length > 60 ? '…' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRINCIPAL DASHBOARD ──────────────────────────────────────────────────────
function PrincipalDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [adminNote, setAdminNote] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    loadComplaints();

    const channel = supabase
      .channel('all-complaints')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => loadComplaints()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadComplaints() {
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setSaving(true);
    const { error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', id);
    if (error) {
      showToast('Failed to update status.', 'error');
    } else {
      showToast('Status updated.');
      setSelected((p) => (p ? { ...p, status } : p));
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }
    setSaving(false);
  }

  async function saveNote(id) {
    setSaving(true);
    const { error } = await supabase
      .from('complaints')
      .update({ admin_note: adminNote })
      .eq('id', id);
    if (error) {
      showToast('Failed to save note.', 'error');
    } else {
      showToast('Note saved.');
      setSelected((p) => (p ? { ...p, admin_note: adminNote } : p));
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, admin_note: adminNote } : c))
      );
    }
    setSaving(false);
  }

  async function getAiInsight(complaint) {
    setAiLoading(true);
    setAiResponse('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are a school counselor assistant helping a principal handle student complaints professionally.

Category: ${complaint.category}
Title: ${complaint.title}
Description: ${complaint.description}
Priority: ${complaint.priority}

Provide:
1. A brief empathy statement for the student
2. Recommended immediate action steps (2-3 points)
3. A suggested response message the principal can send back
4. Any policy or safeguarding considerations

Keep the tone professional, warm, and solution-focused.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiResponse(
        data.content?.map((b) => b.text || '').join('') ||
          'No response generated.'
      );
    } catch {
      setAiResponse('Unable to generate AI insight. Please try again.');
    }
    setAiLoading(false);
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    inReview: complaints.filter((c) => c.status === 'in-review').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  const filtered = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCat !== 'all' && c.category !== filterCat) return false;
    return true;
  });

  if (loading) return <Spinner label="Loading complaints from Supabase…" />;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Sidebar */}
      <div
        style={{
          width: 220,
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: '1.5rem',
          }}
        >
          {[
            ['Total', stats.total, '#a5b4fc'],
            ['Pending', stats.pending, '#fbbf24'],
            ['Review', stats.inReview, '#60a5fa'],
            ['Done', stats.resolved, '#4ade80'],
          ].map(([l, v, c]) => (
            <div
              key={l}
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: '0.75rem',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: c }}>
                {v}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b' }}>{l}</p>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 11,
            color: '#475569',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Filter
        </p>
        {['all', 'pending', 'in-review', 'resolved', 'dismissed'].map((st) => (
          <button
            key={st}
            style={{
              ...s.btn(filterStatus === st ? 'primary' : 'ghost'),
              textAlign: 'left',
              marginBottom: 4,
              padding: '0.5rem 0.75rem',
              fontSize: 12,
            }}
            onClick={() => {
              setFilterStatus(st);
              setSelected(null);
            }}
          >
            {st === 'all'
              ? '📋 All'
              : st === 'pending'
              ? '⏳ Pending'
              : st === 'in-review'
              ? '🔍 In Review'
              : st === 'resolved'
              ? '✅ Resolved'
              : '🚫 Dismissed'}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!selected ? (
          <div style={{ padding: '2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h2
                  style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}
                >
                  All Complaints
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                  {filtered.length} result(s) · Live sync via Supabase Realtime
                </p>
              </div>
              <select
                style={{ ...s.input, width: 'auto', minWidth: 200 }}
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p style={{ color: '#64748b' }}>
                  No complaints match the current filter.
                </p>
              </div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      ...s.card,
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      setSelected(c);
                      setAdminNote(c.admin_note || '');
                      setAiResponse('');
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: '#475569',
                            }}
                          >
                            {c.complaint_ref}
                          </span>
                          <span style={s.badge(c.status)}>
                            {STATUS_CONFIG[c.status]?.label}
                          </span>
                          <span style={s.priorityBadge(c.priority)}>
                            {c.priority}
                          </span>
                        </div>
                        <h3
                          style={{
                            margin: '0 0 4px',
                            fontSize: 15,
                            fontWeight: 600,
                          }}
                        >
                          {c.title}
                        </h3>
                        <p
                          style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}
                        >
                          {c.description.slice(0, 110)}…
                        </p>
                      </div>
                      <div
                        style={{
                          textAlign: 'right',
                          marginLeft: 16,
                          flexShrink: 0,
                        }}
                      >
                        <p
                          style={{ margin: 0, fontSize: 12, color: '#475569' }}
                        >
                          {timeAgo(c.created_at)}
                        </p>
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 11,
                            color: '#334155',
                          }}
                        >
                          {c.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '2rem', maxWidth: 800 }}>
            <button
              style={{
                ...s.btn('ghost'),
                marginBottom: '1.5rem',
                fontSize: 13,
              }}
              onClick={() => {
                setSelected(null);
                setAiResponse('');
              }}
            >
              ← Back to List
            </button>

            <div style={s.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: '#475569',
                    }}
                  >
                    {selected.complaint_ref}
                  </span>
                  <h2
                    style={{
                      margin: '6px 0 4px',
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {selected.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    {selected.category} · submitted{' '}
                    {timeAgo(selected.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={s.priorityBadge(selected.priority)}>
                    {selected.priority}
                  </span>
                  <span style={s.badge(selected.status)}>
                    {STATUS_CONFIG[selected.status]?.label}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#cbd5e1',
                  }}
                >
                  {selected.description}
                </p>
              </div>

              {/* Status Update */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={s.label}>Update Status</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(STATUS_CONFIG).map(([st, cfg]) => (
                    <button
                      key={st}
                      style={{
                        ...s.btn(selected.status === st ? 'primary' : 'ghost'),
                        fontSize: 12,
                        padding: '0.5rem 1rem',
                        opacity: saving ? 0.6 : 1,
                      }}
                      onClick={() => updateStatus(selected.id, st)}
                      disabled={saving}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Note */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={s.label}>Response / Internal Note</label>
                <textarea
                  style={{ ...s.input, minHeight: 90, resize: 'vertical' }}
                  placeholder="Write a response that the student will see in their portal…"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
                <button
                  style={{
                    ...s.btn('success'),
                    marginTop: 8,
                    fontSize: 13,
                    opacity: saving ? 0.6 : 1,
                  }}
                  onClick={() => saveNote(selected.id)}
                  disabled={saving}
                >
                  {saving ? '⏳ Saving…' : '💾 Save & Send to Student'}
                </button>
              </div>

              {/* AI Insight */}
              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  paddingTop: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                      ✨ AI Assistant
                    </h3>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: '#64748b',
                      }}
                    >
                      Claude-powered guidance for handling this complaint
                    </p>
                  </div>
                  <button
                    style={{
                      ...s.btn('primary'),
                      fontSize: 13,
                      opacity: aiLoading ? 0.7 : 1,
                    }}
                    onClick={() => getAiInsight(selected)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? '⏳ Analyzing…' : '🤖 Get AI Guidance'}
                  </button>
                </div>
                {aiLoading && (
                  <div
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      borderRadius: 10,
                      padding: '1.5rem',
                      textAlign: 'center',
                    }}
                  >
                    <Spinner label="Generating AI recommendations…" />
                  </div>
                )}
                {aiResponse && (
                  <div
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 10,
                      padding: '1.25rem',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 8px',
                        fontSize: 12,
                        color: '#a5b4fc',
                        fontWeight: 600,
                      }}
                    >
                      AI GUIDANCE
                    </p>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.8,
                        color: '#cbd5e1',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────────────

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('landing'); // landing | auth
  const [authRole, setAuthRole] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState('submit');
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    if (
      SUPABASE_URL.includes('YOUR_PROJECT_ID') ||
      SUPABASE_ANON_KEY.includes('YOUR_ANON')
    ) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setScreen('landing');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(uid) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setScreen('landing');
    setSubmittedComplaint(null);
    setNav('submit');
  }

  // ── Config Error Screen ───────────────────────────────────────────────────
  if (configError) {
    return (
      <div
        style={{
          ...s.root,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 580, width: '100%' }}>
          <div style={{ ...s.card, borderColor: 'rgba(251,191,36,0.4)' }}>
            <div
              style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}
            >
              ⚙️
            </div>
            <h2
              style={{
                textAlign: 'center',
                margin: '0 0 1rem',
                color: '#fbbf24',
              }}
            >
              Supabase Not Configured
            </h2>
            <p
              style={{
                color: '#94a3b8',
                fontSize: 14,
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              Replace the placeholder values at the top of this file with your
              actual Supabase credentials.
            </p>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: 13,
                color: '#a5b4fc',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ color: '#64748b', marginBottom: 6 }}>
                // Line 9-10 in this file:
              </div>
              <div>
                const SUPABASE_URL ={' '}
                <span style={{ color: '#4ade80' }}>
                  "https://xxxx.supabase.co"
                </span>
                ;
              </div>
              <div>
                const SUPABASE_ANON_KEY ={' '}
                <span style={{ color: '#4ade80' }}>"eyJh..."</span>;
              </div>
            </div>
            <div
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                padding: '1rem',
                fontSize: 13,
                color: '#94a3b8',
              }}
            >
              <strong style={{ color: '#a5b4fc' }}>Where to find these:</strong>
              <br />
              1. Go to <span style={{ color: '#60a5fa' }}>supabase.com</span> →
              Your Project
              <br />
              2. Settings → API
              <br />
              3. Copy <strong style={{ color: '#e2e8f0' }}>
                Project URL
              </strong>{' '}
              and <strong style={{ color: '#e2e8f0' }}>anon public</strong> key
              <br />
              4. Also run the{' '}
              <strong style={{ color: '#e2e8f0' }}>
                supabase_setup.sql
              </strong>{' '}
              file in your SQL Editor
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div
        style={{
          ...s.root,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spinner label="Connecting to Supabase…" />
      </div>
    );

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    if (screen === 'landing')
      return (
        <LandingPage
          onSelect={(role) => {
            setAuthRole(role);
            setScreen('auth');
          }}
        />
      );
    if (screen === 'auth')
      return (
        <AuthForm
          role={authRole}
          onBack={() => setScreen('landing')}
          onSuccess={(u) => {
            setUser(u);
          }}
        />
      );
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  const isPrincipal = profile?.role === 'principal';

  return (
    <div
      style={{
        ...s.root,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header
        user={user}
        profile={profile}
        onLogout={handleLogout}
        onNav={(n) => {
          setNav(n);
          setSubmittedComplaint(null);
        }}
        currentNav={nav}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isPrincipal ? (
          <PrincipalDashboard />
        ) : submittedComplaint ? (
          <SubmitSuccess
            complaint={submittedComplaint}
            onNew={() => setSubmittedComplaint(null)}
            onTrack={() => {
              setSubmittedComplaint(null);
              setNav('track');
            }}
          />
        ) : nav === 'submit' ? (
          <SubmitComplaint
            user={user}
            onSubmitted={(c) => setSubmittedComplaint(c)}
          />
        ) : (
          <MyComplaints user={user} />
        )}
      </div>
    </div>
  );
}
