// ============================================================
// supabaseClient.js
// Drop this file next to your App.jsx
// Fill in your Supabase URL and anon key from:
// https://app.supabase.com → Project Settings → API
// ============================================================

const SUPABASE_URL = "https://spowxgwxglvljpatdtzi.supabase.co";   // <-- replace
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwb3d4Z3d4Z2x2bGpwYXRkdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDY3MjMsImV4cCI6MjA5NDk4MjcyM30.-J4VichpUy_jdfmSJYJ0PqYA54mMzW1eOBBj08ZZ88c";                    // <-- replace

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Prefer": "return=representation",
};

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Supabase error ${res.status}`);
  }
  // 204 No Content → return null
  if (res.status === 204) return null;
  return res.json();
}

// ============================================================
// AUTH — register / login by email only (no password)
// ============================================================

/**
 * Register a new user by email.
 * If the email already exists, returns the existing user (login behaviour).
 * Returns: { id, email, created_at, isNew }
 */
export async function registerOrLoginUser(email) {
  const normalised = email.trim().toLowerCase();

  // Try to find existing user first
  const existing = await sbFetch(
    `/cv_users?email=eq.${encodeURIComponent(normalised)}&select=id,email,created_at`
  );

  if (existing && existing.length > 0) {
    return { ...existing[0], isNew: false };
  }

  // Create new user
  const created = await sbFetch("/cv_users", {
    method: "POST",
    body: JSON.stringify({ email: normalised }),
  });

  return { ...created[0], isNew: true };
}

// ============================================================
// PROFILE — save / load the full exercise state
// ============================================================

/**
 * Load saved profile for a user.
 * Returns the profile object or null if none exists yet.
 */
export async function loadProfile(userId) {
  const data = await sbFetch(
    `/cv_profiles?user_id=eq.${userId}&select=*`
  );
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Save (upsert) the exercise state for a user.
 * Merges with any existing profile.
 */
export async function saveProfile(userId, email, profileData) {
  const payload = {
    user_id: userId,
    email: email.trim().toLowerCase(),
    selected_ten: profileData.selectedTen || [],
    selected_core: profileData.selectedCore || [],
    percentages: profileData.percentages || [],
    descriptions: profileData.descriptions || [],
    selected_goals: profileData.selectedGoals || {},
    identity_statement: profileData.identityStatement || null,
  };

  const data = await sbFetch("/cv_profiles", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });

  return data && data[0] ? data[0] : null;
}

// ============================================================
// ACTIONS — weekly action log
// ============================================================

export async function loadActions(userId) {
  const data = await sbFetch(
    `/cv_actions?user_id=eq.${userId}&select=*&order=action_date.desc,created_at.desc`
  );
  return data || [];
}

export async function addAction(userId, email, action) {
  const payload = {
    user_id: userId,
    email: email.trim().toLowerCase(),
    action_text: action.text,
    value_name: action.value,
    goal_name: action.goal || null,
    action_date: action.date,
    action_type: action.type || "manual",
  };
  const data = await sbFetch("/cv_actions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data && data[0] ? data[0] : null;
}

export async function deleteAction(actionId) {
  await sbFetch(`/cv_actions?id=eq.${actionId}`, { method: "DELETE" });
}

// ============================================================
// TO-DOs
// ============================================================

export async function loadTodos(userId) {
  const data = await sbFetch(
    `/cv_todos?user_id=eq.${userId}&select=*&order=due_date.asc,created_at.asc`
  );
  return data || [];
}

export async function addTodo(userId, email, todo) {
  const payload = {
    user_id: userId,
    email: email.trim().toLowerCase(),
    todo_text: todo.text,
    value_name: todo.value,
    goal_name: todo.goal || null,
    due_date: todo.date || null,
    done: false,
  };
  const data = await sbFetch("/cv_todos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data && data[0] ? data[0] : null;
}

export async function completeTodoInDb(todoId, completedDate) {
  const data = await sbFetch(`/cv_todos?id=eq.${todoId}`, {
    method: "PATCH",
    body: JSON.stringify({ done: true, completed_date: completedDate }),
  });
  return data && data[0] ? data[0] : null;
}

export async function deleteTodo(todoId) {
  await sbFetch(`/cv_todos?id=eq.${todoId}`, { method: "DELETE" });
}
