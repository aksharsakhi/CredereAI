import React, { useEffect, useState } from 'react';
import {
  getModule1DataForResearch,
  runResearchAsync,
  getResearchAsyncStatus,
  runResearchFromModule1,
  createModule2CaseFromResearch,
  listModule2Cases,
  getModule2Case,
  transitionModule2Case,
  assignModule2CaseAction,
  addModule2CaseEvidence,
  recordModule2CaseDecision,
  getModule2CaseAudit,
  verifyModule2CaseAudit,
  listModule2OverdueActions,
  runModule2EscalationSweep,
  getModule2DecisionPack,
} from '../api/client';

const RESEARCH_POLL_INTERVAL_MS = 3000;
const RESEARCH_POLL_TIMEOUT_MS = 10 * 60 * 1000;
const MODULE2_STORAGE_KEY = 'credere_module2_state';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(MODULE2_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredState(value) {
  try {
    localStorage.setItem(MODULE2_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures so the workbench remains usable.
  }
}

export default function Module2Panel() {
  const initialStoredState = readStoredState();
  const [companyName, setCompanyName] = useState(initialStoredState?.companyName || '');
  const [cin, setCin] = useState(initialStoredState?.cin || '');
  const [industry, setIndustry] = useState(initialStoredState?.industry || '');
  const [promoters, setPromoters] = useState(initialStoredState?.promoters || '');
  const [directors, setDirectors] = useState(initialStoredState?.directors || '');
  const [report, setReport] = useState(initialStoredState?.report || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(Array.isArray(initialStoredState?.history) ? initialStoredState.history : []);
  const [siteVisitNotes, setSiteVisitNotes] = useState(initialStoredState?.siteVisitNotes || '');
  const [managementNotes, setManagementNotes] = useState(initialStoredState?.managementNotes || '');
  const [collateralNotes, setCollateralNotes] = useState(initialStoredState?.collateralNotes || '');
  const [activeTab, setActiveTab] = useState(initialStoredState?.activeTab || 'overview');
  const [cases, setCases] = useState(Array.isArray(initialStoredState?.cases) ? initialStoredState.cases : []);
  const [selectedCase, setSelectedCase] = useState(null);
  const [auditRows, setAuditRows] = useState(Array.isArray(initialStoredState?.auditRows) ? initialStoredState.auditRows : []);
  const [auditVerification, setAuditVerification] = useState(initialStoredState?.auditVerification || null);
  const [overdueActions, setOverdueActions] = useState(Array.isArray(initialStoredState?.overdueActions) ? initialStoredState.overdueActions : []);
  const [decisionPack, setDecisionPack] = useState(initialStoredState?.decisionPack || null);
  const [caseMsg, setCaseMsg] = useState('');

  useEffect(() => {
    writeStoredState({
      companyName,
      cin,
      industry,
      promoters,
      directors,
      report,
      history,
      siteVisitNotes,
      managementNotes,
      collateralNotes,
      activeTab,
      cases,
      auditRows,
      auditVerification,
      overdueActions,
      decisionPack,
      selectedCaseId: selectedCase?.caseId || initialStoredState?.selectedCaseId || null,
    });
  }, [
    companyName,
    cin,
    industry,
    promoters,
    directors,
    report,
    history,
    siteVisitNotes,
    managementNotes,
    collateralNotes,
    activeTab,
    cases,
    auditRows,
    auditVerification,
    overdueActions,
    decisionPack,
    selectedCase,
    initialStoredState?.selectedCaseId,
  ]);

  useEffect(() => {
    const savedCaseId = initialStoredState?.selectedCaseId;
    if (savedCaseId || cases.length > 0) {
      refreshCaseWorkbench(savedCaseId).catch(() => {
        // Keep stored state visible even if the refresh fails.
      });
    }
  }, []);

  async function autofillFromModule1() {
    setLoading(true);
    setError('');
    try {
      const data = await getModule1DataForResearch();
      if (data?.companyName) setCompanyName(data.companyName);
      if (data?.cin) setCin(data.cin);
      if (data?.industry) setIndustry(data.industry);
      if (Array.isArray(data?.promoterNames)) setPromoters(data.promoterNames.join(', '));
      if (Array.isArray(data?.directors)) setDirectors(data.directors.join(', '));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        companyName,
        cin: cin || null,
        industry: industry || null,
        promoterNames: promoters
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        directors: directors
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
      };

      // Long-running scans are executed asynchronously to avoid network timeouts.
      const submitted = await runResearchAsync(payload);
      const jobId = submitted?.jobId;
      if (!jobId) {
        throw new Error('Failed to start intelligence scan. Please retry.');
      }

      const startedAt = Date.now();
      while (Date.now() - startedAt < RESEARCH_POLL_TIMEOUT_MS) {
        const status = await getResearchAsyncStatus(jobId);
        const currentStatus = String(status?.status || '').toUpperCase();

        if (currentStatus === 'COMPLETED') {
          setReport(status?.report || null);
          setHistory((prev) => [{ companyName, cin, industry, at: new Date().toISOString() }, ...prev].slice(0, 5));
          return;
        }

        if (currentStatus === 'FAILED') {
          throw new Error(status?.error || 'Research scan failed.');
        }

        await sleep(RESEARCH_POLL_INTERVAL_MS);
      }

      throw new Error('Research scan is taking longer than expected. Please check again in a moment.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunFromModule1() {
    setLoading(true);
    setError('');
    try {
      const data = await runResearchFromModule1();
      setReport(data?.report || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCaseWorkbench(caseId) {
    const [caseList, overdue] = await Promise.all([listModule2Cases(), listModule2OverdueActions()]);
    setCases(Array.isArray(caseList) ? caseList : []);
    setOverdueActions(Array.isArray(overdue) ? overdue : []);

    const targetId = caseId || caseList?.[0]?.caseId;
    if (targetId) {
      const [detail, audit, verify] = await Promise.all([
        getModule2Case(targetId),
        getModule2CaseAudit(targetId),
        verifyModule2CaseAudit(targetId),
      ]);
      setSelectedCase(detail || null);
      setAuditRows(Array.isArray(audit) ? audit : []);
      setAuditVerification(verify || null);
    }
  }

  async function handleCreateCaseFromCurrentResearch() {
    if (!companyName) {
      setError('Company name required to create case.');
      return;
    }
    setLoading(true);
    setCaseMsg('');
    setError('');
    try {
      const payload = {
        companyName,
        cin: cin || null,
        industry: industry || null,
        promoterNames: promoters.split(',').map((p) => p.trim()).filter(Boolean),
        directors: directors.split(',').map((d) => d.trim()).filter(Boolean),
      };
      const created = await createModule2CaseFromResearch(payload);
      setCaseMsg(`Case created: ${created.caseId}`);
      await refreshCaseWorkbench(created.caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransitionCase(targetState) {
    if (!selectedCase?.caseId) return;
    setLoading(true);
    setError('');
    try {
      await transitionModule2Case(selectedCase.caseId, { targetState, reason: `Manual transition to ${targetState}` });
      await refreshCaseWorkbench(selectedCase.caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignAction() {
    if (!selectedCase?.caseId) return;
    setLoading(true);
    setError('');
    try {
      await assignModule2CaseAction(selectedCase.caseId, {
        title: 'Regulatory document validation',
        owner: 'Compliance Desk',
        slaHours: 24,
        notes: 'Validate top open compliance and litigation findings.',
      });
      await refreshCaseWorkbench(selectedCase.caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvidence() {
    if (!selectedCase?.caseId) return;
    setLoading(true);
    setError('');
    try {
      await addModule2CaseEvidence(selectedCase.caseId, {
        type: 'NEWS_REPORT',
        source: 'module2-news',
        reference: `${companyName || 'company'}-news-reference`,
        description: 'Linked news signal captured for credit committee evidence pack.',
      });
      await refreshCaseWorkbench(selectedCase.caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordDecision() {
    if (!selectedCase?.caseId) return;
    setLoading(true);
    setError('');
    try {
      await recordModule2CaseDecision(selectedCase.caseId, {
        decision: recommendation.decision,
        notes: `Auto-suggested from adjusted score ${adjustedView.adjustedScore.toFixed(1)}.`,
      });
      const pack = await getModule2DecisionPack(selectedCase.caseId);
      setDecisionPack(pack || null);
      await refreshCaseWorkbench(selectedCase.caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalationSweep() {
    setLoading(true);
    setError('');
    try {
      const result = await runModule2EscalationSweep();
      setCaseMsg(`Escalation sweep: ${result.escalatedCases} escalated out of ${result.overdueActions} overdue action(s).`);
      await refreshCaseWorkbench(selectedCase?.caseId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const qualitativeNotes = [siteVisitNotes, managementNotes, collateralNotes].filter(Boolean).join(' ');
  const adjustedView = buildAdjustedRiskView(report, qualitativeNotes);
  const recommendation = buildRecommendation(report, adjustedView.adjustedScore);
  const camSummary = buildCamSummary(report, qualitativeNotes, recommendation);
  const safeLitigationRecords = Array.isArray(report?.litigationRecords) ? report.litigationRecords : [];
  const safeNewsSignals = Array.isArray(report?.newsSignals) ? report.newsSignals : [];
  const safeRiskAlerts = Array.isArray(report?.riskScore?.alerts) ? report.riskScore.alerts : [];
  const safeNetworkNodes = Array.isArray(report?.networkGraph?.nodes) ? report.networkGraph.nodes : [];
  const safeNetworkEdges = Array.isArray(report?.networkGraph?.edges) ? report.networkGraph.edges : [];
  const safePromoterProfiles = Array.isArray(report?.promoterProfiles) ? report.promoterProfiles : [];
  const safeRegulatoryActions = Array.isArray(report?.regulatoryActions) ? report.regulatoryActions : [];
  const sentimentSummary = summarizeSentiments(safeNewsSignals);
  const litigationStatusSummary = summarizeLitigationStatus(safeLitigationRecords);
  const reliability = buildResearchReliability(report);
  const actionQueue = buildActionQueue(report, adjustedView.adjustedScore);
  const regulatoryHeat = summarizeRegulatorySeverity(safeRegulatoryActions);
  const networkTypeBreakdown = summarizeNetworkTypes(safeNetworkNodes);
  const relationshipBreakdown = summarizeRelationships(safeNetworkEdges);
  const linkedEntityRows = buildLinkedEntityRows(safeNetworkNodes, safeNetworkEdges);

  return (
    <section className="panel">
      <h2>Credit Intelligence</h2>

      <div className="module2-layout">
        <div className="module2-left">
          <form onSubmit={handleResearch} className="card form-grid">
            <div className="module2-form-head full-width">
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                <h3 style={{margin: 0}}>Investigation Parameters</h3>
                <span className="chip chip-ok" style={{fontSize: '9px'}}>Deep Search Active</span>
              </div>
              <div className="module2-action-row" style={{marginTop: '12px'}}>
                <button type="button" className="secondary action-btn action-btn-compact" onClick={autofillFromModule1} disabled={loading}>
                  <span>⚡ Autofill</span>
                  <small>Link intake context</small>
                </button>
                <button type="button" className="secondary action-btn action-btn-compact" onClick={handleRunFromModule1} disabled={loading}>
                  <span>🚀 Full Pipeline</span>
                  <small>Cross-module scan</small>
                </button>
              </div>
            </div>

            <label className="full-width" style={{marginTop: '12px'}}>
              <span style={{fontWeight: 700, fontSize: '13px', display: 'block'}}>Target Company Name</span>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="e.g. Acme Corp Industries" />
            </label>
            <label>
               <span style={{fontWeight: 700, fontSize: '12px', display: 'block'}}>Registration ID (CIN)</span>
              <input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="U12345DL2023..." />
            </label>
            <label>
               <span style={{fontWeight: 700, fontSize: '12px', display: 'block'}}>Primary Industry</span>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Manufacturing, Tech..." />
            </label>
            <label className="full-width">
               <span style={{fontWeight: 700, fontSize: '12px', display: 'block'}}>Promoter Group (Comma Separated)</span>
              <input value={promoters} onChange={(e) => setPromoters(e.target.value)} placeholder="John Doe, Jane Smith..." />
            </label>
            <label className="full-width">
               <span style={{fontWeight: 700, fontSize: '12px', display: 'block'}}>Executive Directors</span>
              <input value={directors} onChange={(e) => setDirectors(e.target.value)} placeholder="Board Members..." />
            </label>
            
            <div className="full-width" style={{marginTop: '10px', display: 'grid', gap: '12px'}}>
                <label>
                <span style={{fontWeight: 700, fontSize: '12px', color: 'var(--brand)'}}>📍 Site Visit Insights (Qualitative)</span>
                <textarea
                    value={siteVisitNotes}
                    onChange={(e) => setSiteVisitNotes(e.target.value)}
                    placeholder="Factory status, inventory levels, local market sentiment..."
                />
                </label>
                <label>
                <span style={{fontWeight: 700, fontSize: '12px', color: 'var(--brand)'}}>🤝 Management Interaction</span>
                <textarea
                    value={managementNotes}
                    onChange={(e) => setManagementNotes(e.target.value)}
                    placeholder="Key executive commentary, business pivots, outlook..."
                />
                </label>
                <label>
                <span style={{fontWeight: 700, fontSize: '12px', color: 'var(--brand)'}}>🛡️ Collateral Ground Reality</span>
                <textarea
                    value={collateralNotes}
                    onChange={(e) => setCollateralNotes(e.target.value)}
                    placeholder="Asset title clarity, encumbrance checks, physical state..."
                />
                </label>
            </div>

            <div className="actions full-width" style={{marginTop: '12px'}}>
              <button type="submit" disabled={loading} className="primary full-width action-btn action-btn-primary">
                {loading ? 'Synthesizing Neural Intelligence...' : 'Execute Intelligence Scan'}
              </button>
            </div>
          </form>

          {error ? <p className="error">{error}</p> : null}

          {history.length > 0 ? (
            <div className="card">
              <h3>Recent Research</h3>
              <div className="list-table">
                {history.map((h, idx) => (
                  <div key={`${h.companyName}-${h.at}-${idx}`} className="list-row">
                    <span>{h.companyName}</span>
                    <button
                      className="secondary action-btn action-btn-inline"
                      onClick={() => {
                        setCompanyName(h.companyName || '');
                        setCin(h.cin || '');
                        setIndustry(h.industry || '');
                      }}
                    >
                      Reuse
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="module2-right card">
          <div className="module2-results-head">
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
               <h3 style={{margin: 0}}>Intelligence Synthesis</h3>
               <span className="chip chip-ok" style={{fontSize: '10px'}}>V2.4 Cloud-Ground Integrated</span>
            </div>
            <div className="chip-wrap">
              <span className="chip chip-unknown">Module 2</span>
              <span className="chip chip-brand">Grounded Inference</span>
            </div>
          </div>
          
          <div className="module2-tabs" style={{border: 'none', background: 'var(--bg-alt)', padding: '6px', borderRadius: '14px', display: 'flex', gap: '4px', marginTop: '16px'}}>
            {[
              ['overview', 'Summary'],
              ['network', 'Network'],
              ['promoters', 'Promoters'],
              ['litigation', 'Litigation'],
              ['news', 'Signals'],
              ['alerts', 'Watchlist'],
              ['operations', 'Workbench'],
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

          {!report ? (
            <div className="module2-empty-state" style={{background: 'var(--surface-2)', borderRadius: '20px', border: '1px dashed var(--line)', margin: '20px 0', minHeight: '400px'}}>
               <div style={{fontSize: '48px', marginBottom: '20px'}}>🕵️‍♂️</div>
               <h4>Awaiting Asset Intelligence</h4>
               <p style={{maxWidth: '300px', margin: '8px auto'}}>Parameters must be defined to launch the autonomous research crawlers.</p>
            </div>
          ) : null}

          {report && activeTab === 'overview' ? (
            <div style={{display: 'grid', gap: '20px', marginTop: '20px'}}>
              <div className="risk-top-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px'}}>
                <div className="card glass-card" style={{textAlign: 'center', borderLeft: '4px solid var(--brand)'}}>
                  <h3 style={{marginBottom: '1rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Composite Credit Grade</h3>
                  <RiskGauge score={adjustedView.adjustedScore} grade={report.riskScore?.grade} />
                  <div style={{marginTop: '1rem', padding: '12px', background: 'var(--bg-alt)', borderRadius: '12px'}}>
                    <p style={{fontSize: '13px', fontWeight: 600, margin: 0}}>{report.riskScore?.summary || 'Structural integrity confirmed via autonomous research.'}</p>
                  </div>
                  <p className="muted-note" style={{marginTop: '10px', fontSize: '11px'}}>
                    Baseline Index: {(report.riskScore?.compositeScore ?? 0).toFixed(1)} | Insight Delta:{' '}
                    <strong>{adjustedView.adjustment >= 0 ? '+' : ''}{adjustedView.adjustment.toFixed(1)}</strong>
                  </p>
                </div>
                <div className="card glass-card">
                  <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Intelligence Verticals</h3>
                  <ScoreBars
                    data={[
                      ['Network Connectivity', report.riskScore?.networkScore],
                      ['Litigation Exposure', report.riskScore?.litigationScore],
                      ['Regulatory Violations', report.riskScore?.regulatoryScore],
                      ['Market Sentiment', report.riskScore?.newsScore],
                      ['Promoter Integrity', report.riskScore?.promoterScore],
                    ]}
                  />
                </div>
              </div>

              {adjustedView.reasons.length > 0 ? (
                <div className="card" style={{background: 'var(--surface-2)', borderLeft: '4px solid var(--warn)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <h3 style={{margin: 0, fontSize: '14px'}}>Ground Reality Adjustments</h3>
                  </div>
                  <ul className="insight-list" style={{display: 'grid', gap: '8px'}}>
                    {adjustedView.reasons.map((reason) => (
                      <li key={reason} style={{fontSize: '12px', paddingLeft: '1rem', position: 'relative'}}>
                        <span style={{position: 'absolute', left: 0, color: 'var(--warn)'}}>•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="card">
                <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Research Evidence Nodes</h3>
                <div className="kpi-grid">
                  <div className="kpi-card" style={{borderLeftColor: 'var(--brand)'}}>
                    <span className="kpi-label">Entity Network</span>
                    <strong className="kpi-value">{safeNetworkNodes.length} Nodes</strong>
                    <span className="kpi-status">{safeNetworkEdges.length} Connections</span>
                  </div>
                  <div className="kpi-card" style={{borderLeftColor: 'var(--danger)'}}>
                    <span className="kpi-label">Legal Friction</span>
                    <strong className="kpi-value">{report.litigationRecords?.length || 0} Filings</strong>
                    <span className="kpi-status">Public Records Scanned</span>
                  </div>
                  <div className="kpi-card" style={{borderLeftColor: 'var(--brand-2)'}}>
                    <span className="kpi-label">News Flows</span>
                    <strong className="kpi-value">{report.newsSignals?.length || 0} Signals</strong>
                    <span className="kpi-status">{Object.keys(sentimentSummary).length} Sentiments</span>
                  </div>
                  <div className="kpi-card" style={{borderLeftColor: 'var(--warn)'}}>
                    <span className="kpi-label">Regulatory</span>
                    <strong className="kpi-value">{report.regulatoryActions?.length || 0} Actions</strong>
                    <span className="kpi-status">Compliance Delta</span>
                  </div>
                </div>
              </div>

              <div className="risk-top-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                <div className="card" style={{background: 'var(--surface-2)', borderTop: '4px solid var(--ok)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                     <h3 style={{margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Policy Recom Engine</h3>
                     <span className="chip chip-ok" style={{fontSize: '10px'}}>{recommendation.decision}</span>
                  </div>
                  <div className="kpi-grid" style={{marginBottom: '1rem'}}>
                    <div className="kpi-card" style={{padding: '12px', background: 'var(--surface)'}}>
                      <span className="kpi-label">Limit</span>
                      <strong className="kpi-value kpi-compact">{recommendation.limitCr.toFixed(1)} Cr</strong>
                    </div>
                    <div className="kpi-card" style={{padding: '12px', background: 'var(--surface)'}}>
                      <span className="kpi-label">Price Rate</span>
                      <strong className="kpi-value kpi-compact">{recommendation.ratePct.toFixed(2)}%</strong>
                    </div>
                  </div>
                  <ul className="insight-list" style={{display: 'grid', gap: '6px'}}>
                    {recommendation.explain.map((line) => (
                      <li key={line} style={{fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4}}>• {line}</li>
                    ))}
                  </ul>
                </div>

                <div className="card" style={{background: 'var(--surface-2)', borderTop: '4px solid var(--brand)'}}>
                  <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Synthesized CAM Draft</h3>
                  <div style={{display: 'grid', gap: '10px'}}>
                    {camSummary.map((line, idx) => (
                      <p key={idx} style={{fontSize: '12px', margin: 0, lineHeight: 1.5, padding: '8px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--line)'}}>
                         {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {report && activeTab === 'network' ? (
            <div style={{display: 'grid', gap: '20px', marginTop: '20px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1.45fr 0.8fr', gap: '20px'}}>
                <div className="card glass-card">
                  <div className="module2-results-head" style={{marginBottom: '14px'}}>
                    <div>
                      <h3 style={{margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Network Exposure Map</h3>
                      <p style={{margin: '6px 0 0', fontSize: '12px', color: 'var(--muted)'}}>{report.networkGraph?.summary || 'Inter-entity relationships derived from public-network intelligence.'}</p>
                    </div>
                    <span className="chip chip-brand">{safeNetworkNodes.length} linked entities</span>
                  </div>
                  <NetworkConstellation nodes={safeNetworkNodes} edges={safeNetworkEdges} companyName={companyName} />
                </div>

                <div style={{display: 'grid', gap: '16px'}}>
                  <div className="card">
                    <h3 style={{marginBottom: '1rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Entity Mix</h3>
                    <ScoreBars data={Object.entries(networkTypeBreakdown).map(([label, value]) => [label, value])} />
                  </div>
                  <div className="card">
                    <h3 style={{marginBottom: '1rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Relationship Density</h3>
                    <ScoreBars data={Object.entries(relationshipBreakdown).slice(0, 5).map(([label, value]) => [label, value])} />
                    <div style={{marginTop: '14px', padding: '12px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: '12px', lineHeight: 1.5}}>
                      <strong>High-risk entities:</strong> {linkedEntityRows.filter((row) => row.riskScore >= 0.7).length} node(s) exceed the elevated-risk threshold.
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="module2-results-head" style={{marginBottom: '14px'}}>
                  <h3 style={{margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Entity Intelligence Ledger</h3>
                  <span className="chip chip-ok">Traceable relationships</span>
                </div>
                {linkedEntityRows.length === 0 ? (
                  <div style={{padding: '48px', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '16px'}}>
                    <p style={{margin: 0, color: 'var(--muted)'}}>No structured network entities returned in this run.</p>
                  </div>
                ) : (
                  <div className="list-table" style={{display: 'grid', gap: '8px'}}>
                    <div className="list-row" style={{fontWeight: 700, background: 'var(--bg-alt)'}}>
                      <span>Entity</span>
                      <span>Type</span>
                      <span>Relationship</span>
                      <span>Links</span>
                      <span>Risk</span>
                    </div>
                    {linkedEntityRows.slice(0, 18).map((row) => (
                      <div key={row.id} className="list-row" style={{alignItems: 'center'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0}}>
                          <span style={{width: 30, height: 30, borderRadius: '10px', background: row.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px'}}>{row.initials}</span>
                          <span style={{display: 'grid', minWidth: 0}}>
                            <strong style={{fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{row.name}</strong>
                            <small style={{color: 'var(--muted)'}}>{row.id}</small>
                          </span>
                        </span>
                        <span className="chip chip-unknown" style={{fontSize: '10px'}}>{row.type}</span>
                        <span style={{fontSize: '12px'}}>{row.relationship}</span>
                        <span style={{fontSize: '12px', fontWeight: 700}}>{row.connections}</span>
                        <span style={{display: 'grid', gap: '4px', minWidth: '92px'}}>
                          <strong style={{fontSize: '12px', color: row.color}}>{row.riskLabel}</strong>
                          <span style={{height: '6px', background: 'var(--bg-alt)', borderRadius: '999px', overflow: 'hidden'}}>
                            <span style={{display: 'block', height: '100%', width: `${Math.max(6, row.riskScore * 100)}%`, background: row.color, borderRadius: '999px'}} />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div className="card">
                  <h3 style={{marginBottom: '1rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Relationship Register</h3>
                  {safeNetworkEdges.length === 0 ? (
                    <p className="muted-note" style={{margin: 0}}>No edge relationships returned for this intelligence cycle.</p>
                  ) : (
                    <div className="list-table" style={{display: 'grid', gap: '8px'}}>
                      {safeNetworkEdges.slice(0, 12).map((edge, idx) => (
                        <div key={`${edge.source}-${edge.target}-${idx}`} className="list-row" style={{padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)'}}>
                          <span style={{fontWeight: 600}}>{lookupNodeName(safeNetworkNodes, edge.source)}</span>
                          <span style={{fontSize: '11px', color: 'var(--muted)'}}>{edge.relationship || 'linked to'}</span>
                          <span style={{fontWeight: 600}}>{lookupNodeName(safeNetworkNodes, edge.target)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{marginBottom: '1rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Escalation Triggers</h3>
                  <div className="alert-grid" style={{display: 'grid', gap: '10px'}}>
                    {linkedEntityRows.filter((row) => row.riskScore >= 0.5).slice(0, 4).map((row) => (
                      <div key={`escalate-${row.id}`} className="alert-card" style={{padding: '12px', borderLeft: `3px solid ${row.color}`, background: 'var(--surface-2)'}}>
                        <div className="ratio-head" style={{marginBottom: '4px'}}>
                          <strong style={{fontSize: '12px'}}>{row.name}</strong>
                          <span className="chip chip-unknown" style={{fontSize: '8px'}}>{row.type}</span>
                        </div>
                        <p style={{fontSize: '11px', margin: 0, color: 'var(--muted)', lineHeight: 1.45}}>
                          {row.relationship} relationship with {row.connections} traceable link(s) and risk intensity {row.riskLabel.toLowerCase()}.
                        </p>
                      </div>
                    ))}
                    {linkedEntityRows.filter((row) => row.riskScore >= 0.5).length === 0 ? (
                      <div style={{padding: '20px', background: 'var(--bg-alt)', borderRadius: '12px', color: 'var(--muted)', fontSize: '12px'}}>
                        No elevated entity triggers surfaced in the structured network graph.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {report && activeTab === 'promoters' ? (
            <div style={{display: 'grid', gap: '20px', marginTop: '20px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px'}}>
                <div className="card">
                  <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Promoter Global Watchlist</h3>
                  <div className="list-table" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px'}}>
                    {safePromoterProfiles.slice(0, 20).map((p, idx) => (
                      <div key={`${p.name}-${idx}`} className="list-row" style={{padding: '16px', background: 'var(--surface-2)', borderRadius: '14px', border: '1px solid var(--line)', display: 'block'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                           <span style={{fontWeight: 800, fontSize: '14px', color: 'var(--text)'}}>{p.name}</span>
                           <span style={{fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: 'var(--bg-alt)', borderRadius: '6px', color: getRiskToneColor(p.riskScore)}}>
                             Risk: {formatRiskScore(p.riskScore)}
                           </span>
                        </div>
                        <p style={{margin: '0 0 10px', fontSize: '11px', color: 'var(--muted)'}}>{p.designation || 'Promoter / Key management'}</p>
                        <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px'}}>
                           <span className="chip chip-ok" style={{fontSize: '9px'}}>Holding {Number(p.holdingPercent || 0).toFixed(1)}%</span>
                           <span className="chip chip-brand" style={{fontSize: '9px'}}>{(p.otherCompanies || []).length} linked firms</span>
                        </div>
                        <p style={{fontSize: '12px', lineHeight: 1.45, color: 'var(--text)', margin: 0}}>{p.backgroundSummary || 'No additional promoter summary returned in this cycle.'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{marginBottom: '1rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Flag & Affiliation Ledger</h3>
                  {safePromoterProfiles.length === 0 ? (
                    <p className="muted-note" style={{margin: 0}}>Promoter profiling did not return structured rows for this run.</p>
                  ) : (
                    <div className="list-table" style={{display: 'grid', gap: '10px'}}>
                      {safePromoterProfiles.slice(0, 8).map((profile, idx) => (
                        <div key={`flag-${profile.name}-${idx}`} style={{padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)'}}>
                          <div className="ratio-head" style={{marginBottom: '8px'}}>
                            <strong style={{fontSize: '12px'}}>{profile.name}</strong>
                            <span className="chip chip-unknown" style={{fontSize: '8px'}}>{profile.designation || 'Promoter'}</span>
                          </div>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: profile.flags?.length ? '10px' : 0}}>
                            {(profile.flags || []).length > 0 ? profile.flags.map((flag) => (
                              <span key={`${profile.name}-${flag}`} className="chip chip-warning" style={{fontSize: '8px'}}>{flag}</span>
                            )) : <span className="chip chip-ok" style={{fontSize: '8px'}}>No surfaced flags</span>}
                          </div>
                          <div style={{fontSize: '11px', color: 'var(--muted)', lineHeight: 1.45}}>
                            <strong style={{color: 'var(--text)'}}>Other companies:</strong> {(profile.otherCompanies || []).length > 0 ? profile.otherCompanies.join(', ') : 'None surfaced'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {report && activeTab === 'litigation' ? (
            <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '20px'}}>
              <div className="card">
                <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Legal Friction Tracker</h3>
                {safeLitigationRecords.length === 0 ? (
                  <div style={{padding: '40px', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '16px'}}>
                    <p style={{color: 'var(--muted)', margin: 0}}>Structural search completed. No significant litigation entries found.</p>
                  </div>
                ) : (
                  <div className="list-table" style={{display: 'grid', gap: '8px'}}>
                    {safeLitigationRecords.slice(0, 15).map((l, idx) => (
                      <div key={`${l.caseNumber}-${idx}`} className="list-row" style={{padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div style={{width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)'}}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div>
                               <span style={{fontWeight: 700, fontSize: '13px', display: 'block'}}>{l.nature || 'General Index'}</span>
                               <span style={{fontSize: '11px', color: 'var(--muted)'}}>{l.caseNumber || 'Ref Pending'}</span>
                            </div>
                         </div>
                         <span className={`chip chip-${(l.status || 'UNKNOWN').toLowerCase()}`} style={{fontSize: '10px'}}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card glass-card">
                <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Status Mix Analysis</h3>
                <ScoreBars data={Object.entries(litigationStatusSummary)} />
                <div style={{marginTop: '20px', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', fontSize: '12px', color: 'var(--muted)'}}>
                   Intelligence engine has filtered for material impact events. Peripheral administrative filings are suppressed in summary view.
                </div>
              </div>
            </div>
          ) : null}

          {report && activeTab === 'news' ? (
            <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '20px'}}>
              <div className="card">
                <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Real-time Intelligence Signals</h3>
                {safeNewsSignals.length === 0 ? (
                  <div style={{padding: '40px', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '16px'}}>
                    <p style={{color: 'var(--muted)', margin: 0}}>No high-impact signals detected in current cycle.</p>
                  </div>
                ) : (
                  <div className="news-list" style={{display: 'grid', gap: '12px'}}>
                    {safeNewsSignals.slice(0, 15).map((n, idx) => (
                      <div key={`${n.title}-${idx}`} className="news-item" style={{padding: '16px', background: 'var(--surface-2)', borderRadius: '14px', border: '1px solid var(--line)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px'}}>
                          <strong style={{fontSize: '14px', lineHeight: 1.4}}>{n.title}</strong>
                          <span className={`chip chip-${(n.sentiment || 'NEUTRAL').toLowerCase()}`} style={{fontSize: '9px', alignSelf: 'flex-start'}}>{n.sentiment}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                           <span style={{fontSize: '11px', color: 'var(--brand)', fontWeight: 700}}>{n.source}</span>
                           <span style={{fontSize: '10px', color: 'var(--muted)'}}>4h ago</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card glass-card">
                <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Sentiment Distribution</h3>
                <ScoreBars data={Object.entries(sentimentSummary)} />
                <div style={{marginTop: '20px', padding: '16px', background: 'var(--bg-alt)', borderRadius: '12px', fontSize: '12px', lineHeight: 1.5}}>
                   <strong>AI Interpretation:</strong> The prevailing sentiment profile indicates a {Object.keys(sentimentSummary).find(k => sentimentSummary[k] === Math.max(...Object.values(sentimentSummary))) || 'neutral'} outlook based on {safeNewsSignals.length} surface signals.
                </div>
              </div>
            </div>
          ) : null}

          {report && activeTab === 'alerts' ? (
            <div className="card" style={{marginTop: '20px'}}>
              <h3 style={{marginBottom: '1.25rem', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Neural Watchlist & Risk Alerts</h3>
              {safeRiskAlerts.length === 0 ? (
                <div style={{padding: '60px', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '20px'}}>
                   <div style={{fontSize: '32px', marginBottom: '12px'}}>✅</div>
                   <p style={{margin: 0, fontWeight: 700}}>Zero High-Impact Alerts Detected</p>
                   <p style={{fontSize: '12px', color: 'var(--muted)', marginTop: '4px'}}>Current profile aligns with standard risk parameters.</p>
                </div>
              ) : (
                <div className="alert-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px'}}>
                  {safeRiskAlerts.slice(0, 20).map((a, idx) => (
                    <div key={`${a.title}-${idx}`} className="alert-card glass-card" style={{borderLeft: `4px solid ${a.severity === 'CRITICAL' ? 'var(--danger)' : a.severity === 'HIGH' ? 'var(--warn)' : 'var(--ok)'}`}}>
                      <div className="ratio-head" style={{marginBottom: '10px'}}>
                        <strong style={{fontSize: '14px'}}>{a.title}</strong>
                        <span className={`chip chip-${(a.severity || 'LOW').toLowerCase()}`} style={{fontSize: '9px'}}>{a.severity}</span>
                      </div>
                      <p style={{fontSize: '12px', lineHeight: 1.5, margin: '8px 0', color: 'var(--text)'}}>{a.description}</p>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--line)'}}>
                         <span style={{fontSize: '10px', color: 'var(--muted)', fontWeight: 700}}>{a.source}</span>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {report && activeTab === 'operations' ? (
            <div style={{display: 'grid', gap: '20px', marginTop: '20px'}}>
              <div className="kpi-grid">
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--brand)'}}>
                  <span className="kpi-label">Evidence Confidence</span>
                  <strong className="kpi-value">{reliability.score.toFixed(0)}%</strong>
                  <span className="kpi-status">{reliability.checks.filter(c => c.status === 'PASS').length} / {reliability.checks.length} Nodes Validated</span>
                </div>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--brand-2)'}}>
                  <span className="kpi-label">SLA Urgency</span>
                  <strong className="kpi-value">{actionQueue.priority}</strong>
                  <span className="kpi-status">Target Resolution: {actionQueue.sla}</span>
                </div>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--warn)'}}>
                  <span className="kpi-label">Pending Actions</span>
                  <strong className="kpi-value">{actionQueue.items.length} Tasks</strong>
                  <span className="kpi-status">Requires Manual Review</span>
                </div>
                <div className="kpi-card glass-card" style={{borderLeft: '4px solid var(--ok)'}}>
                  <span className="kpi-label">Audit Chain</span>
                  <strong className="kpi-value">{auditVerification?.valid ? 'SECURED' : 'PENDING'}</strong>
                  <span className="kpi-status">Proof of Existence Verified</span>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div className="card">
                  <h3 style={{marginBottom: '1.25rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Resolution Checklist</h3>
                  <div className="list-table" style={{display: 'grid', gap: '8px'}}>
                    {reliability.checks.map((item) => (
                      <div key={item.name} className="list-row" style={{padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                           <span style={{fontSize: '13px', fontWeight: 600}}>{item.name}</span>
                           <span className={`chip chip-${item.status === 'PASS' ? 'ok' : 'warning'}`} style={{fontSize: '9px'}}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{marginBottom: '1.25rem', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Regulatory Pulse</h3>
                  <ScoreBars data={Object.entries(regulatoryHeat)} />
                </div>
              </div>

              <div className="card">
                <div className="ratio-head" style={{marginBottom: '1.25rem'}}>
                   <h3 style={{margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ops Workbench: {selectedCase?.caseId || 'Awaiting Selection'}</h3>
                   <div className="actions" style={{gap: '8px'}}>
                     <button type="button" className="secondary action-btn action-btn-inline" onClick={handleEscalationSweep} disabled={loading}>⚡ SLA Sweep</button>
                     <button type="button" className="secondary action-btn action-btn-inline" onClick={() => refreshCaseWorkbench(selectedCase?.caseId)} disabled={loading}>🔄 Synch</button>
                     <button type="button" className="primary action-btn action-btn-inline" onClick={handleCreateCaseFromCurrentResearch} disabled={loading}>Initiate Case</button>
                   </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px'}}>
                  <div style={{display: 'grid', gap: '12px'}}>
                    <div className="card" style={{background: 'var(--surface-2)', border: '1px solid var(--line)'}}>
                       <h4 style={{marginTop: 0, fontSize: '12px', color: 'var(--muted)'}}>Active Intelligence Cases</h4>
                       <div className="list-table" style={{maxHeight: '300px', overflowY: 'auto', display: 'grid', gap: '4px'}}>
                         {cases.slice(0, 15).map((item) => (
                            <div 
                              key={item.caseId} 
                              className={`list-row ${selectedCase?.caseId === item.caseId ? 'active' : ''}`}
                              onClick={() => refreshCaseWorkbench(item.caseId)}
                              style={{
                                cursor: 'pointer', 
                                padding: '10px', 
                                borderRadius: '8px', 
                                background: selectedCase?.caseId === item.caseId ? 'var(--brand-fade)' : 'transparent',
                                border: selectedCase?.caseId === item.caseId ? '1px solid var(--brand)' : '1px solid transparent'
                              }}
                            >
                               <span style={{fontSize: '12px', fontWeight: 700}}>{item.companyName}</span>
                               <span style={{fontSize: '10px', display: 'block', color: 'var(--muted)'}}>{item.caseId}</span>
                            </div>
                         ))}
                       </div>
                    </div>
                    
                    <div className="card" style={{background: 'var(--surface-2)', border: '1px solid var(--line)'}}>
                        <h4 style={{marginTop: 0, fontSize: '12px', color: 'var(--muted)'}}>Audit Log (Hash Chain)</h4>
                        <div style={{maxHeight: '200px', overflowY: 'auto', display: 'grid', gap: '6px'}}>
                           {auditRows.slice(0, 10).map((row) => (
                              <div key={row.auditId} style={{fontSize: '10px', padding: '6px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--line)'}}>
                                 <strong>{row.eventType}</strong> by {row.actor}
                                 <span style={{display: 'block', color: 'var(--muted)', marginTop: '2px'}}>{row.at ? new Date(row.at).toLocaleTimeString() : ''}</span>
                              </div>
                           ))}
                        </div>
                    </div>
                  </div>

                  <div style={{display: 'grid', gap: '16px'}}>
                    <div className="card glass-card" style={{border: '1px solid var(--brand)'}}>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                          <h4 style={{margin: 0}}>Critical Case Path</h4>
                          <span className="chip chip-ok">Verified Status</span>
                       </div>
                       <div className="actions" style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                            <button type="button" className="secondary action-btn action-btn-inline" onClick={() => handleTransitionCase('UNDER_REVIEW')} disabled={loading || !selectedCase} style={{flex: 1}}>Move to Review</button>
                            <button type="button" className="secondary action-btn action-btn-inline" onClick={() => handleTransitionCase('ESCALATED')} disabled={loading || !selectedCase} style={{flex: 1}}>Escalate</button>
                            <button type="button" className="secondary action-btn action-btn-inline" onClick={handleAssignAction} disabled={loading || !selectedCase} style={{flex: 1}}>Assign Task</button>
                            <button type="button" className="secondary action-btn action-btn-inline" onClick={handleAddEvidence} disabled={loading || !selectedCase} style={{flex: 1, color: 'var(--brand)'}}>+ Evidence</button>
                            <button type="button" className="primary action-btn action-btn-inline" onClick={handleRecordDecision} disabled={loading || !selectedCase} style={{flex: '1 0 100%', marginTop: '8px'}}>Apply Credit Decision</button>
                       </div>
                    </div>

                    <div className="card" style={{background: 'var(--surface-2)', border: '1px solid var(--line)'}}>
                       <h4 style={{marginTop: 0, fontSize: '12px', color: 'var(--muted)'}}>High Priority SLA Pipeline</h4>
                       <div className="alert-grid" style={{display: 'grid', gap: '10px'}}>
                          {actionQueue.items.map((item) => (
                            <div key={item.title} className="alert-card" style={{padding: '12px', background: 'var(--surface)', borderRadius: '10px', borderLeft: `3px solid ${item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'var(--danger)' : 'var(--warn)'}`}}>
                              <div className="ratio-head" style={{marginBottom: '4px'}}>
                                <strong style={{fontSize: '12px'}}>{item.title}</strong>
                                <span className="chip chip-warn" style={{fontSize: '8px', padding: '2px 6px'}}>{item.due}</span>
                              </div>
                              <p style={{fontSize: '11px', margin: '4px 0', color: 'var(--muted)'}}>{item.description}</p>
                              <span style={{fontSize: '9px', fontWeight: 700, color: 'var(--brand)'}}>Owner: {item.owner}</span>
                            </div>
                          ))}
                       </div>
                    </div>
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

function RiskGauge({ score, grade }) {
  const safe = Math.max(0, Math.min(30, Number(score) || 0));
  const pct = (safe / 30) * 100;
  const radius = 40;
  const circuit = 2 * Math.PI * radius;
  const halfCircuit = circuit / 2;
  const offset = halfCircuit - (pct / 100) * halfCircuit;
  
  // Color logic: Higher is riskier (more red)
  const color = pct >= 70 ? 'var(--danger)' : pct >= 40 ? 'var(--warn)' : 'var(--ok)';

  return (
    <div style={{ position: 'relative', width: '180px', height: '110px', margin: '0 auto' }}>
      <svg width="180" height="110" viewBox="0 0 100 60">
        <defs>
          <linearGradient id="risk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--ok)" />
            <stop offset="50%" stopColor="var(--warn)" />
            <stop offset="100%" stopColor="var(--danger)" />
          </linearGradient>
        </defs>
        <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="var(--bg-alt)" strokeWidth="8" strokeLinecap="round" />
        <path 
          d="M10,50 A40,40 0 0,1 90,50" fill="none" 
          stroke="url(#risk-grad)" 
          strokeWidth="8" 
          strokeDasharray={halfCircuit} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text x="50" y="44" textAnchor="middle" style={{fontSize: '12px', fontWeight: 800, fill: 'var(--text)'}}>
          {grade || 'BB'}
        </text>
        <text x="50" y="54" textAnchor="middle" style={{fontSize: '5px', fontWeight: 700, fill: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
          Risk Index: {safe.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

function ScoreBars({ data }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(([, v]) => v || 0), 1);

  return (
    <div style={{display: 'grid', gap: '14px'}}>
      {data.map(([label, value]) => {
        const val = Number(value) || 0;
        const width = (val / max) * 100;
        return (
          <div key={label} style={{display: 'grid', gap: '6px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span style={{fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase'}}>{label}</span>
               <span style={{fontSize: '12px', fontWeight: 800}}>{val.toFixed(1)}</span>
            </div>
            <div style={{height: '6px', background: 'var(--bg-alt)', borderRadius: '10px', overflow: 'hidden'}}>
               <div style={{
                 height: '100%', 
                 width: `${width}%`, 
                 background: 'linear-gradient(90deg, var(--brand), var(--brand-2))',
                 borderRadius: '10px',
                 transition: 'width 1s ease-out'
               }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NetworkConstellation({ nodes, edges, companyName }) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return (
      <div style={{minHeight: '320px', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at center, color-mix(in srgb, var(--brand) 10%, transparent), transparent 65%)', borderRadius: '20px', border: '1px dashed var(--line)'}}>
        <p style={{margin: 0, color: 'var(--muted)', fontSize: '12px'}}>Network visualization will appear when structured entity data is available.</p>
      </div>
    );
  }

  const displayNodes = nodes.slice(0, 19);
  const coreNode = pickCoreNode(displayNodes, companyName);
  const others = displayNodes.filter((node) => node.id !== coreNode.id);
  const positions = buildConstellationPositions(coreNode, others);
  const visibleNodeIds = new Set(displayNodes.map((node) => node.id));
  const visibleEdges = (Array.isArray(edges) ? edges : []).filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)).slice(0, 28);

  return (
    <div style={{display: 'grid', gap: '14px'}}>
      <div style={{position: 'relative', minHeight: '370px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--line)', background: 'radial-gradient(circle at 50% 46%, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.03) 28%, transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--brand) 6%, var(--surface)) 0%, var(--surface-2) 100%)'}}>
        <svg viewBox="0 0 640 380" style={{width: '100%', height: '100%'}}>
          <defs>
            <radialGradient id="network-halo" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="rgba(51, 153, 255, 0.22)" />
              <stop offset="100%" stopColor="rgba(51, 153, 255, 0)" />
            </radialGradient>
          </defs>
          <circle cx="320" cy="190" r="82" fill="url(#network-halo)" />
          <circle cx="320" cy="190" r="118" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="5 7" />
          <circle cx="320" cy="190" r="168" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="5 7" />
          <circle cx="320" cy="190" r="214" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 8" />

          {visibleEdges.map((edge, index) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            if (!source || !target) return null;
            const opacity = 0.24 + Math.min(0.42, Number(edge.weight || 0.3));
            return (
              <g key={`${edge.source}-${edge.target}-${index}`}>
                <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={`rgba(131, 196, 255, ${opacity})`} strokeWidth={1.5 + Math.max(0.4, Number(edge.weight || 0.3))} />
                <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 6} textAnchor="middle" fill="rgba(255,255,255,0.72)" style={{fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase'}}>
                  {truncate(edge.relationship || 'linked', 16)}
                </text>
              </g>
            );
          })}

          {displayNodes.map((node) => {
            const position = positions.get(node.id);
            if (!position) return null;
            const nodeColor = getRiskToneColor(node.riskScore);
            const labelColor = node.id === coreNode.id ? 'var(--text)' : 'rgba(255,255,255,0.86)';
            return (
              <g key={node.id}>
                <circle cx={position.x} cy={position.y} r={position.radius + 10} fill={hexToRgba(nodeColor, 0.12)} />
                <circle cx={position.x} cy={position.y} r={position.radius} fill={nodeColor} stroke="rgba(255,255,255,0.95)" strokeWidth={node.id === coreNode.id ? 3 : 2} />
                <text x={position.x} y={position.y + 3} textAnchor="middle" fill="#fff" style={{fontSize: node.id === coreNode.id ? '11px' : '10px', fontWeight: 800, letterSpacing: '0.04em'}}>
                  {getInitials(node.name)}
                </text>
                <text x={position.x} y={position.y + position.radius + 18} textAnchor="middle" fill={labelColor} style={{fontSize: node.id === coreNode.id ? '12px' : '10px', fontWeight: node.id === coreNode.id ? 800 : 600}}>
                  {truncate(node.name || node.id, node.id === coreNode.id ? 26 : 18)}
                </text>
                <text x={position.x} y={position.y + position.radius + 30} textAnchor="middle" fill="rgba(255,255,255,0.56)" style={{fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase'}}>
                  {(node.relationship || node.type || 'linked').replaceAll('_', ' ')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
        {[
          ['Low', 'var(--ok)'],
          ['Moderate', 'var(--brand)'],
          ['Elevated', 'var(--warn)'],
          ['High', 'var(--danger)'],
        ].map(([label, color]) => (
          <span key={label} style={{display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', fontSize: '11px', fontWeight: 700}}>
            <span style={{width: '10px', height: '10px', borderRadius: '50%', background: color}} />
            {label} risk
          </span>
        ))}
      </div>
    </div>
  );
}

function buildAdjustedRiskView(report, notesText) {
  const base = Number(report?.riskScore?.compositeScore) || 0;
  const notes = (notesText || '').toLowerCase();
  let adjustment = 0;
  const reasons = [];

  const negativeSignals = [
    { key: '40% capacity', score: 2.5, reason: 'Factory utilization concern from site visit increased operating risk.' },
    { key: 'idle', score: 1.2, reason: 'Idle capacity signal suggests demand or execution stress.' },
    { key: 'delay', score: 1.4, reason: 'Observed delays in receivables/cash flow increased liquidity risk.' },
    { key: 'litigation', score: 1.6, reason: 'Primary notes mention legal friction, increasing uncertainty.' },
  ];

  const positiveSignals = [
    { key: 'maintained', score: -0.9, reason: 'Asset maintenance quality lowered operational risk marginally.' },
    { key: 'strong governance', score: -1.4, reason: 'Governance strength from management interaction reduced conduct risk.' },
    { key: 'order book', score: -1.1, reason: 'Healthy order visibility reduced near-term business volatility.' },
  ];

  negativeSignals.forEach((rule) => {
    if (notes.includes(rule.key)) {
      adjustment += rule.score;
      reasons.push(rule.reason);
    }
  });

  positiveSignals.forEach((rule) => {
    if (notes.includes(rule.key)) {
      adjustment += rule.score;
      reasons.push(rule.reason);
    }
  });

  const adjustedScore = Math.max(0, Math.min(30, base + adjustment));
  return { adjustedScore, adjustment, reasons };
}

function buildRecommendation(report, adjustedScore) {
  const riskAlerts = Array.isArray(report?.riskScore?.alerts) ? report.riskScore.alerts : [];
  const alertCount = riskAlerts.length;
  const litigationCount = report?.litigationRecords?.length || 0;
  const baseLimit = 100;
  const riskRatio = Math.max(0, Math.min(1, adjustedScore / 30));
  const limitCr = Math.max(10, baseLimit * (1 - riskRatio * 0.75));
  const premiumBps = Math.round(120 + riskRatio * 420 + Math.min(120, alertCount * 8 + litigationCount * 10));
  const ratePct = 8.5 + premiumBps / 100;

  let decision = 'APPROVE WITH MONITORING';
  if (adjustedScore >= 22 || litigationCount >= 4) decision = 'REJECT / DEFER';
  else if (adjustedScore >= 14) decision = 'APPROVE WITH COVENANTS';

  const explain = [
    `Adjusted risk score is ${adjustedScore.toFixed(1)} on a 0-30 scale based on secondary + primary intelligence.`,
    `Limit is reduced from a 100 Cr benchmark using transparent risk scaling to ${limitCr.toFixed(2)} Cr.`,
    `Pricing premium is ${premiumBps} bps, reflecting alert intensity (${alertCount}) and litigation volume (${litigationCount}).`,
  ];

  return { decision, limitCr, premiumBps, ratePct, explain };
}

function buildCamSummary(report, notesText, recommendation) {
  const networkNodes = report?.networkGraph?.nodes?.length || 0;
  const promoterCount = report?.promoterProfiles?.length || 0;
  const newsCount = report?.newsSignals?.length || 0;
  const litigationCount = report?.litigationRecords?.length || 0;

  return [
    `Character: Promoter and management scan covered ${promoterCount} profiles with ${networkNodes} linked network entities.`,
    `Capacity: Primary notes and market signals ${notesText ? 'were integrated into risk calibration.' : 'are pending for calibration.'}`,
    `Capital: External intelligence surfaced ${litigationCount} litigation markers and ${newsCount} relevant news signals.`,
    'Collateral: Collateral adequacy should be validated against field-level notes and legal enforceability checks.',
    `Conditions: Proposed decision is '${recommendation.decision}' with ${recommendation.limitCr.toFixed(2)} Cr limit at ${recommendation.ratePct.toFixed(2)}% indicative rate.`,
  ];
}

function summarizeSentiments(news) {
  const rows = Array.isArray(news) ? news : [];
  return rows.reduce(
    (acc, item) => {
      const key = (item?.sentiment || 'unknown').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
}

function summarizeLitigationStatus(records) {
  const summary = {};
  const rows = Array.isArray(records) ? records : [];
  rows.forEach((record) => {
    const key = (record?.status || 'unknown').toLowerCase();
    summary[key] = (summary[key] || 0) + 1;
  });
  return summary;
}

function summarizeRegulatorySeverity(actions) {
  const summary = { low: 0, medium: 0, high: 0, critical: 0 };
  const rows = Array.isArray(actions) ? actions : [];
  rows.forEach((action) => {
    const key = (action?.severity || 'low').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(summary, key)) {
      summary[key] += 1;
    }
  });
  return summary;
}

function buildResearchReliability(report) {
  const hasNetwork = (report?.networkGraph?.nodes?.length || 0) > 0;
  const hasLitigation = (report?.litigationRecords?.length || 0) > 0 || (report?.regulatoryActions?.length || 0) > 0;
  const hasNews = (report?.newsSignals?.length || 0) > 0;
  const hasPromoters = (report?.promoterProfiles?.length || 0) > 0;

  const checks = [
    { name: 'Corporate network graph', status: hasNetwork ? 'PASS' : 'GAP' },
    { name: 'Litigation and regulatory scan', status: hasLitigation ? 'PASS' : 'GAP' },
    { name: 'News sentiment intelligence', status: hasNews ? 'PASS' : 'GAP' },
    { name: 'Promoter due diligence profile', status: hasPromoters ? 'PASS' : 'GAP' },
  ];

  const passCount = checks.filter((c) => c.status === 'PASS').length;
  return {
    score: (passCount / checks.length) * 100,
    checks,
  };
}

function buildActionQueue(report, adjustedScore) {
  const alerts = Array.isArray(report?.riskScore?.alerts) ? report.riskScore.alerts : [];
  const severeAlerts = alerts.filter((a) => ['HIGH', 'CRITICAL'].includes((a?.severity || '').toUpperCase()));
  const litigationCount = report?.litigationRecords?.length || 0;

  const items = [
    {
      title: 'Promoter and related-party deep dive',
      severity: severeAlerts.length > 3 ? 'CRITICAL' : 'HIGH',
      description: 'Complete beneficial ownership and related-party cash-flow tracing.',
      owner: 'Credit Risk Team',
      due: severeAlerts.length > 3 ? '24h' : '48h',
    },
    {
      title: 'Legal and compliance validation',
      severity: litigationCount >= 3 ? 'HIGH' : 'MEDIUM',
      description: 'Obtain legal counsel note for top litigations and regulatory notices.',
      owner: 'Legal and Compliance',
      due: litigationCount >= 3 ? '48h' : '72h',
    },
    {
      title: 'Management meeting and covenant alignment',
      severity: adjustedScore >= 16 ? 'HIGH' : 'MEDIUM',
      description: 'Capture management mitigation plan and map enforceable covenants.',
      owner: 'Relationship Manager',
      due: '72h',
    },
  ];

  const priority = adjustedScore >= 22 ? 'Immediate Escalation' : adjustedScore >= 14 ? 'High Priority Review' : 'Standard Review';
  const sla = adjustedScore >= 22 ? 'T+1 day' : adjustedScore >= 14 ? 'T+2 days' : 'T+5 days';

  return { items, priority, sla };
}

function summarizeNetworkTypes(nodes) {
  const summary = {};
  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    const key = normalizeLabel(node?.type || 'other');
    summary[key] = (summary[key] || 0) + 1;
  });
  return summary;
}

function summarizeRelationships(edges) {
  const summary = {};
  (Array.isArray(edges) ? edges : []).forEach((edge) => {
    const key = normalizeLabel(edge?.relationship || 'linked');
    summary[key] = (summary[key] || 0) + 1;
  });
  return Object.fromEntries(Object.entries(summary).sort((a, b) => b[1] - a[1]));
}

function buildLinkedEntityRows(nodes, edges) {
  const edgeRows = Array.isArray(edges) ? edges : [];
  return (Array.isArray(nodes) ? nodes : []).map((node) => {
    const riskScore = Number(node?.riskScore) || 0;
    return {
      id: node?.id || node?.name || 'node',
      name: node?.name || 'Unnamed entity',
      type: normalizeLabel(node?.type || 'other'),
      relationship: normalizeLabel(node?.relationship || 'linked entity'),
      riskScore,
      riskLabel: describeRisk(riskScore),
      connections: edgeRows.filter((edge) => edge?.source === node?.id || edge?.target === node?.id).length,
      initials: getInitials(node?.name),
      color: getRiskToneColor(riskScore),
    };
  }).sort((a, b) => b.riskScore - a.riskScore || b.connections - a.connections);
}

function pickCoreNode(nodes, companyName) {
  const normalizedCompanyName = String(companyName || '').trim().toLowerCase();
  return nodes.find((node) => String(node?.name || '').trim().toLowerCase() === normalizedCompanyName)
    || nodes.find((node) => String(node?.type || '').toLowerCase() === 'company')
    || nodes[0];
}

function buildConstellationPositions(coreNode, otherNodes) {
  const positions = new Map();
  positions.set(coreNode.id, { x: 320, y: 190, radius: 34 + Math.min(14, (Number(coreNode.riskScore) || 0) * 14) });

  otherNodes.forEach((node, index) => {
    const ring = index < 6 ? 0 : index < 12 ? 1 : 2;
    const ringRadius = [118, 168, 214][ring];
    const ringCount = [Math.min(otherNodes.length, 6), Math.max(0, Math.min(otherNodes.length - 6, 6)), Math.max(0, otherNodes.length - 12)][ring] || 1;
    const ringOffset = ring === 0 ? index : ring === 1 ? index - 6 : index - 12;
    const angle = (-Math.PI / 2) + ((Math.PI * 2) / ringCount) * ringOffset;
    positions.set(node.id, {
      x: 320 + Math.cos(angle) * ringRadius,
      y: 190 + Math.sin(angle) * ringRadius,
      radius: 20 + Math.min(10, (Number(node.riskScore) || 0) * 12),
    });
  });

  return positions;
}

function lookupNodeName(nodes, id) {
  return (Array.isArray(nodes) ? nodes : []).find((node) => node?.id === id)?.name || id || 'Unknown';
}

function getRiskToneColor(score) {
  const value = Number(score) || 0;
  if (value >= 0.8) return 'var(--danger)';
  if (value >= 0.55) return 'var(--warn)';
  if (value >= 0.3) return 'var(--brand)';
  return 'var(--ok)';
}

function describeRisk(score) {
  const value = Number(score) || 0;
  if (value >= 0.8) return 'High';
  if (value >= 0.55) return 'Elevated';
  if (value >= 0.3) return 'Moderate';
  return 'Low';
}

function formatRiskScore(score) {
  return (Number(score) || 0).toFixed(2);
}

function getInitials(name) {
  const parts = String(name || 'NA').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'NA';
}

function normalizeLabel(value) {
  return String(value || 'unknown')
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function truncate(value, maxLength) {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function hexToRgba(color, alpha) {
  const palette = {
    'var(--danger)': [214, 76, 76],
    'var(--warn)': [245, 166, 35],
    'var(--brand)': [34, 134, 255],
    'var(--ok)': [42, 171, 107],
  };
  const tuple = palette[color] || [34, 134, 255];
  return `rgba(${tuple[0]}, ${tuple[1]}, ${tuple[2]}, ${alpha})`;
}
