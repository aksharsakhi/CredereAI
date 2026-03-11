const AUTH_TOKEN_KEY = 'credere_auth_token';
const API_CANDIDATE_BASES = buildCandidateApiBases();

function buildCandidateApiBases() {
  const runtimeBase = (typeof window !== 'undefined' && window.__VITE_API_BASE) ? String(window.__VITE_API_BASE) : '';
  const envBase = (import.meta?.env?.VITE_API_BASE || runtimeBase || '').trim();
  const origin = window.location.origin;
  const host = window.location.hostname;
  const port = window.location.port;
  const fromOrigin = `${origin}/api`;
  const local8000 = `http://${host}:8000/api`;
  const local8001 = `http://${host}:8001/api`;
  const local8013 = `http://${host}:8013/api`;
  const isViteDevPort = /^517\d$/.test(port);

  // Prefer explicit env base when provided, but keep robust fallbacks.
  if (envBase) {
    return Array.from(new Set([
      normalizeBase(envBase),
      normalizeBase(local8013),
      normalizeBase(local8001),
      normalizeBase(local8000),
      normalizeBase(fromOrigin),
    ]));
  }

  // On Vite dev ports, prefer dedicated backend ports before same-origin.
  if (isViteDevPort) {
    return Array.from(new Set([
      normalizeBase(local8001),
      normalizeBase(local8013),
      normalizeBase(local8000),
      normalizeBase(fromOrigin),
    ]));
  }

  // On packaged/backend-served UI, prefer same-origin API first.
  return Array.from(new Set([
    normalizeBase(fromOrigin),
    normalizeBase(local8001),
    normalizeBase(local8013),
    normalizeBase(local8000),
  ]));
}

function normalizeBase(base) {
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function withAuthHeaders(headers = {}) {
  const token = getAuthToken();
  if (!token) {
    return headers;
  }
  return {
    ...headers,
    'X-Auth-Token': token,
  };
}

async function readJsonSafe(res) {
  const raw = await res.text();
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

async function parseResponse(res) {
  const data = await readJsonSafe(res);

  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Upload failed: file is too large. Please use a PDF under 220MB.');
    }
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  // Wrapped API response: { success, message, data }
  if (data && Object.prototype.hasOwnProperty.call(data, 'success')) {
    if (data.success === false) {
      throw new Error(data.message || 'Request failed');
    }
    return data.data;
  }

  // Plain JSON response (non-wrapped endpoints)
  return data;
}

async function apiRequest(path, options = {}, timeoutMs = 180000) {
  let lastError = null;

  for (const base of API_CANDIDATE_BASES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}${path}`, { ...options, signal: controller.signal });
      if (!res.ok && [404, 500, 502, 503].includes(res.status) && base !== API_CANDIDATE_BASES[API_CANDIDATE_BASES.length - 1]) {
        clearTimeout(timer);
        continue;
      }
      clearTimeout(timer);
      return await parseResponse(res);
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const message = String(err?.message || '');
      if (err?.name === 'AbortError') {
        throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s.`);
      }
      if (!message.includes('Failed to fetch') && !message.includes('Load failed')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Unable to reach backend API.');
}

export async function uploadDocument(file, category) {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  return apiRequest('/upload', { method: 'POST', body: form }, 180000);
}

export async function getDocuments() {
  return apiRequest('/documents');
}

export async function deleteDocument(documentId) {
  return apiRequest(`/documents/${documentId}`, { method: 'DELETE' });
}

export async function getCompleteness() {
  return apiRequest('/completeness');
}

export async function getFullAnalysis() {
  return apiRequest('/analysis/full');
}

export async function getDashboardAnalysis() {
  return apiRequest('/analysis/dashboard');
}

export async function getUnderwritingAnalysis() {
  return apiRequest('/analysis/underwriting');
}

export async function getEnterpriseAssessment() {
  return apiRequest('/analysis/enterprise');
}

export async function getRecommendationEngine() {
  return apiRequest('/analysis/recommendation-engine');
}

export async function getReviewWorkflow() {
  return apiRequest('/analysis/review-workflow');
}

export async function submitReview(notes = '') {
  return apiRequest('/analysis/review/submit', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ notes }),
  });
}

export async function approveReview(notes = '') {
  return apiRequest('/analysis/review/approve', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ notes }),
  });
}

export async function getSystemLlmProvider() {
  return apiRequest('/system/llm-provider');
}

export async function getSystemLlmProviderSettings() {
  return apiRequest('/system/llm-provider/settings');
}

export async function updateSystemLlmProviderSettings(provider, model) {
  return apiRequest('/system/llm-provider/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model }),
  });
}

export async function loginBankUser(username, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(data?.token || '');
  return data;
}

export async function getCurrentUser() {
  return apiRequest('/auth/me', {
    headers: withAuthHeaders(),
  });
}

export async function logoutBankUser() {
  const data = await apiRequest('/auth/logout', {
    method: 'POST',
    headers: withAuthHeaders(),
  });
  setAuthToken('');
  return data;
}

export async function saveAnalysisHistory(payload) {
  return apiRequest('/history', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function getAnalysisHistory(limit = 25) {
  return apiRequest(`/history?limit=${encodeURIComponent(limit)}`, {
    headers: withAuthHeaders(),
  });
}

export async function getHistoryById(id) {
  return apiRequest(`/history/${id}`, {
    headers: withAuthHeaders(),
  });
}

export async function resetModule1() {
  return apiRequest('/reset', { method: 'POST' });
}

export async function runResearch(payload) {
  return apiRequest('/module2/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function runResearchAsync(payload) {
  return apiRequest('/module2/research/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getResearchAsyncStatus(jobId) {
  return apiRequest(`/module2/research/async/${jobId}`);
}

export async function getModule1DataForResearch() {
  return apiRequest('/module2/module1-data');
}

export async function runResearchFromModule1() {
  return apiRequest('/module2/research/from-module1', {
    method: 'POST',
  });
}

export async function createModule2Case(payload) {
  return apiRequest('/module2/cases', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function createModule2CaseFromResearch(payload) {
  return apiRequest('/module2/cases/from-research', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function listModule2Cases() {
  return apiRequest('/module2/cases', {
    headers: withAuthHeaders(),
  });
}

export async function getModule2Case(caseId) {
  return apiRequest(`/module2/cases/${caseId}`, {
    headers: withAuthHeaders(),
  });
}

export async function transitionModule2Case(caseId, payload) {
  return apiRequest(`/module2/cases/${caseId}/state`, {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function assignModule2CaseAction(caseId, payload) {
  return apiRequest(`/module2/cases/${caseId}/actions`, {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function updateModule2CaseAction(caseId, actionId, payload) {
  return apiRequest(`/module2/cases/${caseId}/actions/${actionId}`, {
    method: 'PATCH',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function addModule2CaseEvidence(caseId, payload) {
  return apiRequest(`/module2/cases/${caseId}/evidence`, {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function recordModule2CaseDecision(caseId, payload) {
  return apiRequest(`/module2/cases/${caseId}/decision`, {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export async function getModule2CaseAudit(caseId) {
  return apiRequest(`/module2/cases/${caseId}/audit`, {
    headers: withAuthHeaders(),
  });
}

export async function verifyModule2CaseAudit(caseId) {
  return apiRequest(`/module2/cases/${caseId}/audit/verify`, {
    headers: withAuthHeaders(),
  });
}

export async function listModule2OverdueActions() {
  return apiRequest('/module2/cases/actions/overdue', {
    headers: withAuthHeaders(),
  });
}

export async function runModule2EscalationSweep() {
  return apiRequest('/module2/cases/escalation/sweep', {
    method: 'POST',
    headers: withAuthHeaders(),
  });
}

export async function getModule2DecisionPack(caseId) {
  return apiRequest(`/module2/cases/${caseId}/decision-pack`, {
    headers: withAuthHeaders(),
  });
}

/**
 * Portfolio & Knowledge Hub APIs
 */
export async function getPortfolioData() {
  return apiRequest('/analytics/portfolio', {
    headers: withAuthHeaders(),
  });
}

export async function getKnowledgeHubResponse(query) {
  return apiRequest('/analytics/knowledge/query', {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query }),
  });
}

export async function getPeerBenchmarking(companyName) {
  return apiRequest(`/analytics/peer-benchmarking?companyName=${encodeURIComponent(companyName)}`, {
    headers: withAuthHeaders(),
  });
}
