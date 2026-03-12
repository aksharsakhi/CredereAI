import React, { useEffect, useMemo, useState } from 'react';
import {
  uploadDocument,
  deleteDocument,
  getDocuments,
  getCompleteness,
  getFullAnalysis,
  getDashboardAnalysis,
  getUnderwritingAnalysis,
  getEnterpriseAssessment,
  getReviewWorkflow,
  submitReview,
  approveReview,
  resetModule1,
  saveAnalysisHistory,
} from '../api/client';

const categories = [
  { value: 'auto_detect', label: '✨ Auto-Detect (AI)' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'gst_filing', label: 'GST Filing' },
  { value: 'rating_report', label: 'Rating Report' },
];

export default function Module1Panel({ user }) {
  const maxUploadMb = 200;
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('auto_detect');
  const [documents, setDocuments] = useState([]);
  const [completeness, setCompleteness] = useState(null);
  const [fullAnalysis, setFullAnalysis] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [underwriting, setUnderwriting] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyMessage, setHistoryMessage] = useState('');
  const [enterprise, setEnterprise] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  function toDocumentList(value) {
    return Array.isArray(value) ? value : [];
  }

  async function refresh() {
    const [docs, comp, dash, uw, ent, wf] = await Promise.all([
      getDocuments(),
      getCompleteness(),
      getDashboardAnalysis(),
      getUnderwritingAnalysis(),
      getEnterpriseAssessment(),
      getReviewWorkflow(),
    ]);
    setDocuments(toDocumentList(docs));
    setCompleteness(comp?.completeness || null);
    setDashboard(dash || null);
    setUnderwriting(uw || null);
    setEnterprise(ent || null);
    setWorkflow(wf || null);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    if (file.size > maxUploadMb * 1024 * 1024) {
      setError(`Selected file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max allowed is ${maxUploadMb}MB.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await uploadDocument(file, category);
      setFile(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFullAnalysis() {
    setLoading(true);
    setError('');
    setHistoryMessage('');
    try {
      const [full, dash, uw, ent, wf] = await Promise.all([
        getFullAnalysis(),
        getDashboardAnalysis(),
        getUnderwritingAnalysis(),
        getEnterpriseAssessment(),
        getReviewWorkflow(),
      ]);
      setFullAnalysis(full);
      setDashboard(dash);
      setUnderwriting(uw);
      setEnterprise(ent || null);
      setWorkflow(wf || null);

      if (user) {
        await saveAnalysisHistory({
          fullAnalysis: full,
          dashboard: dash,
          underwriting: uw,
          documentCount: documents.length,
        });
        setHistoryMessage('Analysis snapshot saved to History.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    setError('');
    try {
      await resetModule1();
      setFullAnalysis(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDocument(id) {
    setLoading(true);
    setError('');
    try {
      await deleteDocument(id);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview() {
    setLoading(true);
    setError('');
    try {
      const wf = await submitReview(reviewNotes);
      setWorkflow(wf);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveReview() {
    setLoading(true);
    setError('');
    try {
      const wf = await approveReview(reviewNotes);
      setWorkflow(wf);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const completenessScore = completeness?.completenessScore ?? 0;
  const missingCriticalFields = Array.isArray(dashboard?.missingCriticalFields) ? dashboard.missingCriticalFields : [];
  const criticalGapCount = missingCriticalFields.length;
  const riskSignals = Object.values(dashboard?.riskBreakdown || {}).reduce((a, b) => a + b, 0);
  const workflowStage = completenessScore >= 70 ? 'Research Ready' : completenessScore >= 40 ? 'Needs More Docs' : 'Early Intake';
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const documentCategoryCounts = safeDocuments.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {});

  const consolidated = fullAnalysis?.consolidatedData || {};
  const confidence = Number.isFinite(consolidated?.confidence) ? consolidated.confidence : null;
  const warnings = Array.isArray(consolidated?.warnings) ? consolidated.warnings : [];
  const gst = Number(consolidated?.gstRevenue || 0);
  const bankInflow = Number(consolidated?.bankInflow || 0);
  const fraudDeviation = gst > 0 ? (Math.abs(bankInflow - gst) / gst) * 100 : null;

  const completenessPreview = useMemo(() => {
    const fields = Array.isArray(completeness?.fields) ? completeness.fields : [];
    return fields.slice(0, 14);
  }, [completeness]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Financial IQ & Intake</h2>
          <p className="muted-note">High-fidelity extraction and automated fraud detection for enterprise credit assets.</p>
        </div>
        <div className="actions">
          <button onClick={handleFullAnalysis} disabled={loading} className="primary action-btn action-btn-primary">
            {loading ? 'Analyzing...' : 'Run Full Synthesis'}
          </button>
          <button className="secondary action-btn action-btn-inline" onClick={refresh} disabled={loading}>Refresh All</button>
          <button className="secondary action-btn action-btn-inline action-btn-danger-soft" onClick={handleReset} disabled={loading}>Reset</button>
        </div>
      </div>

      <div className="module1-layout">
        <div className="module1-left">
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={{margin: 0}}>Intake Pipeline</h3>
              <span className="chip chip-ok" style={{fontSize: '10px'}}>Active</span>
            </div>
            
            <form onSubmit={handleUpload} className="form-grid">
              <label className="full-width">
                <span style={{fontWeight: 700, fontSize: '13px', marginBottom: '8px', display: 'block'}}>Document Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {category === 'auto_detect' && (
                  <p style={{fontSize: '11px', color: 'var(--brand)', marginTop: '8px', fontWeight: 600}}>
                    ✨ AI-Intelligence enabled: Automated structure recognition.
                  </p>
                )}
              </label>

              <div className="full-width">
                <span style={{fontWeight: 700, fontSize: '13px', marginBottom: '10px', display: 'block'}}>Source Asset (PDF)</span>
                <div className={`dropzone-container ${file ? 'active' : ''}`}>
                  <div className="dropzone-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <p style={{margin: 0, fontWeight: 600}}>Click to browse or drag & drop</p>
                  <p className="muted-note" style={{fontSize: '11px', marginTop: '4px'}}>Maximum size: {maxUploadMb}MB</p>
                  <input 
                    type="file" 
                    className="file-input-hidden" 
                    accept="application/pdf" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  />
                  
                  {file && (
                    <div className="selected-file-info">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={!file || loading} className="full-width primary action-btn action-btn-primary" style={{marginTop: '12px'}}>
                {loading ? 'Executing Pipeline...' : 'Process Document'}
              </button>
            </form>

            <div className="ingest-note" style={{marginTop: '2rem', padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: '16px', border: '1px solid var(--line)'}}>
              <strong style={{fontSize: '13px', display: 'block', marginBottom: '8px'}}>Pipeline Status:</strong>
              <div style={{display: 'grid', gap: '8px', fontSize: '12px'}}>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}><span style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)'}}></span> Multi-page OCR Engaged</div>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}><span style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)'}}></span> Table Extraction (Tabula) Enabled</div>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}><span style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)'}}></span> Grounding Guardrails Active</div>
              </div>
              {historyMessage ? <p style={{marginTop: '1rem', color: 'var(--brand)', fontWeight: 600, fontSize: '11px'}}>{historyMessage}</p> : null}
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom: '1rem'}}>Indexed Assets</h3>
            {safeDocuments.length === 0 ? <p className="muted-note">No documents present in current session.</p> : null}
            <div style={{display: 'grid', gap: '10px'}}>
              {safeDocuments.slice(0, 8).map((d) => (
                <div key={d.id} className="list-row" style={{padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)'}}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <div style={{fontWeight: 700, fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{d.filename}</div>
                      <div style={{fontSize: '11px', color: 'var(--muted)'}}>{d.pageCount} pages • {d.category}</div>
                    </div>
                  </div>
                  <button className="secondary" style={{padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none'}} onClick={() => handleDeleteDocument(d.id)} disabled={loading}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{textAlign: 'center'}}>
            <h3 style={{marginBottom: '1rem'}}>Data Coverage</h3>
            <CompletenessDial score={completenessScore} />
            <div style={{marginTop: '1rem'}}>
              <strong style={{fontSize: '24px'}}>{completenessScore.toFixed(1)}%</strong>
              <p className="muted-note" style={{fontSize: '12px'}}>Target: {completenessScore >= 80 ? 'Threshold Met' : '85% for Committee'}</p>
            </div>
          </div>
        </div>

        <div className="module1-right card">
          <div className="module2-results-head">
            <h3>Analysis Dashboard</h3>
            <div className="chip-wrap">
              <span className="chip chip-unknown">Stage: {workflowStage}</span>
              <span className="chip chip-warning">Critical Gaps: {criticalGapCount}</span>
            </div>
          </div>

          <div className="module2-tabs" style={{border: 'none', background: 'var(--bg-alt)', padding: '6px', borderRadius: '14px', display: 'flex', gap: '4px'}}>
            {[
              ['overview', 'Summary'],
              ['extraction', 'IQ Assets'],
              ['trends', 'Signals'],
              ['fraud', 'Shield'],
              ['ratios', 'Metrics'],
              ['reliability', 'Evidence'],
              ['enterprise', 'Ops'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeTab === key ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab(key)}
                style={{flex: 1, padding: '10px 4px', borderRadius: '10px', fontSize: '11px', fontWeight: 700}}
              >
                {label}
              </button>
            ))}
          </div>

          {error ? <p className="error">{error}</p> : null}

          {!dashboard ? (
            <div className="module2-empty-state" style={{background: 'var(--surface-2)', borderRadius: '20px', border: '1px dashed var(--line)', margin: '20px 0'}}>
              <div style={{fontSize: '48px', marginBottom: '20px'}}>📊</div>
              <h4>Orchestration Ready</h4>
              <p style={{maxWidth: '300px', margin: '8px auto'}}>Index your governance and financial assets to unlock real-time synthesis.</p>
            </div>
          ) : null}

          {dashboard && activeTab === 'overview' ? (
            <>
              <div className="kpi-grid" style={{marginBottom: '20px'}}>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--brand)'}}>
                  <span className="kpi-label">Legal Name</span>
                  <strong className="kpi-value kpi-compact" style={{color: 'var(--brand)'}}>{dashboard.companyName || 'Unindexed Entity'}</strong>
                </div>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--brand-2)'}}>
                  <span className="kpi-label">Assessment FY</span>
                  <strong className="kpi-value">{dashboard.financialYear || 'N/A'}</strong>
                </div>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--warn)'}}>
                  <span className="kpi-label">Anomaly Count</span>
                  <strong className="kpi-value">{riskSignals}</strong>
                </div>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--ok)'}}>
                  <span className="kpi-label">Policy Match</span>
                  <strong className="kpi-value">{underwriting?.decision || 'Reviewing'}</strong>
                </div>
              </div>

              <div className="kpi-grid" style={{gap: '12px'}}>
                {(dashboard.kpis || []).map((k) => (
                  <div key={k.key} className={`kpi-card status-${(k.status || 'UNKNOWN').toLowerCase()}`}>
                    <span className="kpi-label">{k.label}</span>
                    <div style={{display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                       <strong className="kpi-value">{k.value == null ? 'N/A' : k.value.toFixed(2)}</strong>
                       {k.unit && <span style={{fontSize: '11px', fontWeight: 700, color: 'var(--muted)'}}>{k.unit}</span>}
                    </div>
                    <span className="kpi-status" style={{marginTop: '4px'}}>{k.status || 'STABLE'}</span>
                  </div>
                ))}
              </div>

              <div className="card" style={{marginTop: '20px', background: 'var(--surface-2)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                   <h3 style={{margin: 0}}>AI Synthesis Insights</h3>
                </div>
                <ul className="insight-list" style={{display: 'grid', gap: '10px'}}>
                  {(dashboard.insights || []).map((i, idx) => (
                    <li key={`${i}-${idx}`} style={{padding: '12px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '13px', lineHeight: 1.5}}>
                       {i}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {dashboard && activeTab === 'extraction' ? (
            <div className="insight-layout">
              <div className="card">
                <h3>Document Mix by Category</h3>
                <CategoryBars data={documentCategoryCounts} />
              </div>
              <div className="card">
                <h3>Completeness by Priority</h3>
                <PriorityBars data={dashboard.completenessByPriority || {}} />
                <h4>Missing Critical Fields</h4>
                <div className="chip-wrap">
                  {(dashboard.missingCriticalFields || []).length === 0 ? (
                    <span className="chip chip-ok">None</span>
                  ) : (
                    missingCriticalFields.map((f) => (
                      <span key={f} className="chip chip-alert">{f}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="card full-width">
                <h3>Field Readiness Checklist</h3>
                <div className="list-table">
                  {completenessPreview.map((f) => (
                    <div key={`${f.field}-${f.priority}`} className="list-row">
                      <span>{f.field} ({f.priority})</span>
                      <span className={f.present ? 'chip chip-ok' : 'chip chip-warning'}>{f.present ? 'Present' : 'Missing'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {dashboard && activeTab === 'trends' ? (
            <div className="card">
              <h3>Trend Intelligence</h3>
              <TrendChart series={dashboard.trendSeries || []} />
            </div>
          ) : null}

          {dashboard && activeTab === 'fraud' ? (
            <div className="insight-layout">
              <div className="card">
                <h3>Fraud Signal Distribution</h3>
                <RiskBreakdownChart data={dashboard.riskBreakdown || {}} />
              </div>
              <div className="card">
                <h3>GST vs Bank Deviation</h3>
                <p className="ratio-value">
                  {fraudDeviation == null ? 'N/A' : `${fraudDeviation.toFixed(1)}%`}
                </p>
                <p>
                  {fraudDeviation == null
                    ? 'Run full analysis with GST + bank files to enable mismatch detection.'
                    : fraudDeviation > 35
                      ? 'High mismatch detected. Potential circular trading or revenue inflation signal.'
                      : fraudDeviation > 20
                        ? 'Moderate mismatch detected. Requires additional verification.'
                        : 'Mismatch within acceptable monitoring range.'}
                </p>
                {fullAnalysis?.crossVerification ? (
                  <>
                    <p>{fullAnalysis.crossVerification.summary}</p>
                    <p>Total Alerts: {fullAnalysis.crossVerification.totalAlerts}</p>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {dashboard && activeTab === 'ratios' ? (
            <div className="card">
              <h3>Financial Ratios</h3>
              {fullAnalysis?.ratioAnalysis?.ratios ? <RatioCards ratios={fullAnalysis.ratioAnalysis.ratios} /> : <p>Run full analysis to compute ratios.</p>}
            </div>
          ) : null}

          {dashboard && activeTab === 'reliability' ? (
            <div className="insight-layout">
              <div className="card">
                <h3>Extraction Reliability</h3>
                <p className="ratio-value">{confidence == null ? 'N/A' : `${(confidence * 100).toFixed(0)}%`}</p>
                <p>Average confidence from consolidated evidence and parser/LLM agreement.</p>
                <p>Evidence Sources: {consolidated.sourceCount || safeDocuments.length}</p>
              </div>
              <div className="card">
                <h3>Reliability Warnings</h3>
                {warnings.length === 0 ? <p>No active reliability warnings.</p> : null}
                <ul className="insight-list">
                  {warnings.slice(0, 12).map((w, idx) => (
                    <li key={`${w}-${idx}`}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="card full-width">
                <div className="ratio-head">
                  <h3>Audit Payload Snapshot</h3>
                  <button className="secondary" onClick={() => setShowRaw((v) => !v)}>
                    {showRaw ? 'Hide Raw JSON' : 'Show Raw JSON'}
                  </button>
                </div>
                {showRaw ? <pre>{JSON.stringify(fullAnalysis, null, 2)}</pre> : <p>Raw payload hidden for executive view.</p>}
              </div>
            </div>
          ) : null}

          {dashboard && activeTab === 'enterprise' ? (
            <div className="insight-layout">
              <div className="card">
                <h3>Internal Credit Grade</h3>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Risk Score (1-100)</span>
                    <strong className="kpi-value">{enterprise?.internalRiskScore ?? 'N/A'}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Internal Rating</span>
                    <strong className="kpi-value">{enterprise?.rating || 'N/A'}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">1Y PD</span>
                    <strong className="kpi-value">
                      {Number.isFinite(enterprise?.probabilityOfDefault1Y)
                        ? `${(enterprise.probabilityOfDefault1Y * 100).toFixed(2)}%`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Expected Loss</span>
                    <strong className="kpi-value">
                      {Number.isFinite(enterprise?.expectedLossPct) ? `${enterprise.expectedLossPct.toFixed(2)}%` : 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3>Stress Test Scenarios</h3>
                {(enterprise?.stressScenarios || []).length === 0 ? <p>No stress scenarios available.</p> : null}
                <div className="list-table">
                  {(enterprise?.stressScenarios || []).map((s) => (
                    <div key={s.scenario} className="ratio-card">
                      <div className="ratio-head">
                        <strong>{s.scenario}</strong>
                        <span className={`chip chip-${(s.riskImpact || 'unknown').toLowerCase()}`}>{s.riskImpact}</span>
                      </div>
                      <p>Projected Profit: {Number.isFinite(s.projectedProfitCr) ? `${s.projectedProfitCr.toFixed(2)} Cr` : 'N/A'}</p>
                      <p>Projected D/E: {Number.isFinite(s.projectedDebtToEquity) ? s.projectedDebtToEquity.toFixed(2) : 'N/A'}</p>
                      <p>{s.commentary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card full-width">
                <h3>Maker-Checker Workflow</h3>
                <div className="chip-wrap">
                  <span className="chip chip-unknown">Status: {workflow?.status || 'DRAFT'}</span>
                  {workflow?.submittedBy ? <span className="chip chip-low">Maker: {workflow.submittedBy}</span> : null}
                  {workflow?.approvedBy ? <span className="chip chip-ok">Checker: {workflow.approvedBy}</span> : null}
                </div>

                <label>
                  Credit Notes
                  <textarea
                    placeholder="Document key assumptions, caveats, and approval notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </label>

                <div className="actions">
                  <button type="button" onClick={handleSubmitReview} disabled={loading}>Submit for Approval</button>
                  <button type="button" className="secondary" onClick={handleApproveReview} disabled={loading}>
                    Approve Decision
                  </button>
                </div>

                <div className="insight-layout">
                  <div className="card">
                    <h4>Controls</h4>
                    <ul className="insight-list">
                      {(enterprise?.controls || []).map((c, idx) => (
                        <li key={`${c}-${idx}`}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="card">
                    <h4>Recommendations</h4>
                    <ul className="insight-list">
                      {(enterprise?.recommendations || []).map((r, idx) => (
                        <li key={`${r}-${idx}`}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CompletenessDial({ score }) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 45;
  const circuit = 2 * Math.PI * radius;
  const offset = circuit - (safe / 100) * circuit;
  const color = safe >= 80 ? 'var(--ok)' : safe >= 50 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
      <svg width="160" height="160" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--brand-2)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg-alt)" strokeWidth="8" />
        <circle 
          cx="50" cy="50" r={radius} fill="none" 
          stroke="url(#gauge-grad)" 
          strokeWidth="8" 
          strokeDasharray={circuit} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" style={{fontSize: '18px', fontWeight: 800, fill: 'var(--text)'}}>
          {safe.toFixed(0)}%
        </text>
        <text x="50" y="68" textAnchor="middle" style={{fontSize: '6px', fontWeight: 700, fill: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Coverage
        </text>
      </svg>
    </div>
  );
}

function TrendChart({ series }) {
  const [hoverPoint, setHoverPoint] = useState(null);
  if (!series.length) return <p>No trend series available.</p>;

  const selected = series.slice(0, 4);
  const palette = ['#2d8dd6', '#20a39e', '#f59e0b', '#ef4444'];

  const chartW = 560;
  const chartH = 220;
  const padLeft = 40;
  const padRight = 14;
  const padTop = 12;
  const padBottom = 24;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  const allValues = selected.flatMap((item) => (item.points || []).map((p) => p.value || 0));
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = (max - min) || 1;
  const longest = Math.max(...selected.map((s) => (s.points || []).length), 2);
  const baseline = Math.min(0, min);
  const baselineY = padTop + ((max - baseline) / span) * innerH;

  const yTicks = Array.from({ length: 5 }, (_, i) => min + (span * (4 - i)) / 4);
  const xLabels = (() => {
    const points = selected[0]?.points || [];
    if (!points.length) return Array.from({ length: longest }, (_, i) => `P${i + 1}`);
    return points.map((p, idx) => p.year || `P${idx + 1}`);
  })();

  const metricChange = selected.map((item) => {
    const points = item.points || [];
    if (points.length < 2) return { metric: item.metric, change: null, trend: item.trend || 'stable' };
    const first = points[0].value || 0;
    const last = points[points.length - 1].value || 0;
    const change = first === 0 ? null : ((last - first) / Math.abs(first)) * 100;
    const latest = points[points.length - 1]?.value;
    const delta = last - first;
    return { metric: item.metric, change, latest, delta, trend: item.trend || 'stable' };
  });

  const strongestSignal = metricChange
    .filter((m) => Number.isFinite(m.change))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];

  const momentumIndex = metricChange
    .filter((m) => Number.isFinite(m.change))
    .reduce((acc, m) => acc + m.change, 0);

  const momentumLabel = momentumIndex > 20 ? 'Expansion' : momentumIndex < -20 ? 'Contraction' : 'Mixed';

  return (
    <div className="trend-advanced">
      <div className="trend-summary-strip">
        <div className="trend-summary-card">
          <small>Momentum Index</small>
          <strong>{Number.isFinite(momentumIndex) ? `${momentumIndex.toFixed(1)}%` : 'N/A'}</strong>
          <span className={`trend-pill trend-${momentumLabel.toLowerCase()}`}>{momentumLabel}</span>
        </div>
        <div className="trend-summary-card">
          <small>Strongest Signal</small>
          <strong>{strongestSignal?.metric || 'N/A'}</strong>
          <span>{Number.isFinite(strongestSignal?.change) ? `${strongestSignal.change.toFixed(1)}%` : 'No baseline'}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="trend-main-chart" aria-label="Financial trend comparison chart">
        <defs>
          {selected.map((item, idx) => (
            <linearGradient key={`grad-${item.metric}`} id={`trend-grad-${idx}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={palette[idx % palette.length]} stopOpacity="0.25" />
              <stop offset="100%" stopColor={palette[idx % palette.length]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {yTicks.map((tick) => {
          const y = padTop + ((max - tick) / span) * innerH;
          return (
            <g key={`tick-${tick}`}>
              <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} className="trend-grid-line" />
              <text x={6} y={y + 4} className="trend-axis-label">{tick.toFixed(0)}</text>
            </g>
          );
        })}

        {xLabels.map((label, idx) => {
          const x = padLeft + (idx / Math.max(1, longest - 1)) * innerW;
          return (
            <g key={`x-${label}-${idx}`}>
              <line x1={x} y1={padTop} x2={x} y2={chartH - padBottom} className="trend-grid-line trend-grid-v" />
              <text x={x} y={chartH - 6} textAnchor="middle" className="trend-axis-label">{label}</text>
            </g>
          );
        })}

        <line x1={padLeft} y1={baselineY} x2={chartW - padRight} y2={baselineY} className="trend-baseline" />

        {selected.map((item, sIdx) => {
          const points = item.points || [];
          if (points.length < 2) return null;
          const linePath = points
            .map((p, idx) => {
              const x = padLeft + (idx / Math.max(1, longest - 1)) * innerW;
              const y = padTop + ((max - (p.value || 0)) / span) * innerH;
              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');

          const firstX = padLeft;
          const lastX = padLeft + ((points.length - 1) / Math.max(1, longest - 1)) * innerW;
          const areaPath = `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

          return (
            <g key={item.metric}>
              <path d={areaPath} fill={`url(#trend-grad-${sIdx})`} />
              <path d={linePath} fill="none" stroke={palette[sIdx % palette.length]} strokeWidth="3" strokeLinecap="round" />
              {points.map((p, idx) => {
                const cx = padLeft + (idx / Math.max(1, longest - 1)) * innerW;
                const cy = padTop + ((max - (p.value || 0)) / span) * innerH;
                return (
                  <circle
                    key={`${item.metric}-${idx}`}
                    cx={cx}
                    cy={cy}
                    r={hoverPoint?.metric === item.metric && hoverPoint?.index === idx ? 5 : 3}
                    fill={palette[sIdx % palette.length]}
                    onMouseEnter={() => setHoverPoint({
                      metric: item.metric,
                      index: idx,
                      year: p.year || `P${idx + 1}`,
                      value: p.value || 0,
                      color: palette[sIdx % palette.length],
                    })}
                    onMouseLeave={() => setHoverPoint(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {hoverPoint ? (
          <g>
            <line x1={padLeft + (hoverPoint.index / Math.max(1, longest - 1)) * innerW} y1={padTop} x2={padLeft + (hoverPoint.index / Math.max(1, longest - 1)) * innerW} y2={chartH - padBottom} className="trend-crosshair" />
          </g>
        ) : null}
      </svg>

      {hoverPoint ? (
        <div className="trend-tooltip" style={{ borderColor: hoverPoint.color }}>
          <strong>{hoverPoint.metric}</strong>
          <span>{hoverPoint.year}</span>
          <span>{hoverPoint.value.toFixed(2)}</span>
        </div>
      ) : null}

      <div className="trend-legend">
        {selected.map((item, idx) => (
          <div key={`legend-${item.metric}`} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: palette[idx % palette.length] }} />
            <span>{item.metric}</span>
            <span className={`trend-pill trend-${item.trend || 'stable'}`}>{item.trend || 'stable'}</span>
          </div>
        ))}
      </div>

      <div className="trend-metric-cards">
        {metricChange.map((m) => (
          <div key={`metric-${m.metric}`} className="trend-item">
            <div className="trend-head">
              <strong>{m.metric}</strong>
              <span className={`trend-pill trend-${m.trend}`}>{m.trend}</span>
            </div>
            <p className="trend-latest-value">Latest: {m.latest == null ? 'N/A' : m.latest.toFixed(2)}</p>
            <p className="trend-delta-value">Delta: {Number.isFinite(m.delta) ? `${m.delta >= 0 ? '+' : ''}${m.delta.toFixed(2)}` : 'N/A'}</p>
            <p className="trend-change-value">
              {m.change == null ? 'No baseline' : `${m.change >= 0 ? '+' : ''}${m.change.toFixed(1)}%`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBars({ data }) {
  const entries = Object.entries(data);
  if (!entries.length) return <p>No missing field data.</p>;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="priority-bars">
      {entries.map(([k, v]) => (
        <div key={k} className="bar-row">
          <span>{k}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}

function RatioCards({ ratios }) {
  const cards = [
    ratios.debtToEquity,
    ratios.interestCoverage,
    ratios.currentRatio,
    ratios.profitMargin,
    ratios.revenueGrowth,
  ].filter(Boolean);

  return (
    <div className="ratio-grid">
      {cards.map((r) => (
        <div key={r.name} className="ratio-card">
          <div className="ratio-head">
            <strong>{r.name}</strong>
            <span className={`chip chip-${(r.health || 'UNKNOWN').toLowerCase()}`}>{r.health}</span>
          </div>
          <p className="ratio-value">{r.value == null ? 'N/A' : r.value.toFixed(2)}</p>
          <p>{r.interpretation}</p>
        </div>
      ))}
    </div>
  );
}

function CategoryBars({ data }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <p>No category spread yet. Upload more files for synthesis depth.</p>;
  const max = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <div className="priority-bars">
      {entries.map(([name, count]) => (
        <div key={name} className="bar-row">
          <span>{name.replaceAll('_', ' ')}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

function RiskBreakdownChart({ data }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <p>No risk alerts in the current extracted dataset.</p>;
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <div className="risk-breakdown-list">
      {entries.map(([label, value]) => {
        const pct = (value / total) * 100;
        return (
          <div key={label} className="risk-breakdown-item">
            <div className="risk-breakdown-head">
              <strong>{label}</strong>
              <span>{pct.toFixed(1)}%</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
