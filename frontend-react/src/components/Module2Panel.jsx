import React, { useState } from 'react';
import {
  getModule1DataForResearch,
  runResearch,
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

export default function Module2Panel() {
  const [companyName, setCompanyName] = useState('');
  const [cin, setCin] = useState('');
  const [industry, setIndustry] = useState('');
  const [promoters, setPromoters] = useState('');
  const [directors, setDirectors] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [siteVisitNotes, setSiteVisitNotes] = useState('');
  const [managementNotes, setManagementNotes] = useState('');
  const [collateralNotes, setCollateralNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [auditRows, setAuditRows] = useState([]);
  const [auditVerification, setAuditVerification] = useState(null);
  const [overdueActions, setOverdueActions] = useState([]);
  const [decisionPack, setDecisionPack] = useState(null);
  const [caseMsg, setCaseMsg] = useState('');

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
      const data = await runResearch(payload);
      setReport(data?.report || null);
      setHistory((prev) => [{ companyName, cin, industry, at: new Date().toISOString() }, ...prev].slice(0, 5));
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
    setCases(caseList || []);
    setOverdueActions(overdue || []);

    const targetId = caseId || caseList?.[0]?.caseId;
    if (targetId) {
      const [detail, audit, verify] = await Promise.all([
        getModule2Case(targetId),
        getModule2CaseAudit(targetId),
        verifyModule2CaseAudit(targetId),
      ]);
      setSelectedCase(detail || null);
      setAuditRows(audit || []);
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
  const sentimentSummary = summarizeSentiments(report?.newsSignals || []);
  const litigationStatusSummary = summarizeLitigationStatus(report?.litigationRecords || []);
  const reliability = buildResearchReliability(report);
  const actionQueue = buildActionQueue(report, adjustedView.adjustedScore);
  const regulatoryHeat = summarizeRegulatorySeverity(report?.regulatoryActions || []);

  return (
    <section className="panel">
      <h2>Credit Intelligence</h2>

      <div className="module2-layout">
        <div className="module2-left">
          <form onSubmit={handleResearch} className="card form-grid">
            <div className="module2-form-head full-width">
              <h3>Company and Promoter Details</h3>
              <div className="module2-action-row">
                <button type="button" className="secondary action-btn" onClick={autofillFromModule1} disabled={loading}>
                  <span>Autofill from Financial Intake</span>
                  <small>Pull extracted company context</small>
                </button>
                <button type="button" className="secondary action-btn" onClick={handleRunFromModule1} disabled={loading}>
                  <span>Run Linked Intake Pipeline</span>
                  <small>Launch full linked investigation</small>
                </button>
              </div>
            </div>

            <label>
              Company Name
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </label>
            <label>
              CIN
              <input value={cin} onChange={(e) => setCin(e.target.value)} />
            </label>
            <label>
              Industry
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </label>
            <label>
              Promoters (comma separated)
              <input value={promoters} onChange={(e) => setPromoters(e.target.value)} />
            </label>
            <label>
              Directors (comma separated)
              <input value={directors} onChange={(e) => setDirectors(e.target.value)} />
            </label>
            <label className="full-width">
              Site Visit Notes
              <textarea
                value={siteVisitNotes}
                onChange={(e) => setSiteVisitNotes(e.target.value)}
                placeholder="Example: Factory operating at 40% capacity, high idle inventory observed."
              />
            </label>
            <label className="full-width">
              Management Interview Notes
              <textarea
                value={managementNotes}
                onChange={(e) => setManagementNotes(e.target.value)}
                placeholder="Example: CFO indicates delayed receivables from top distributor."
              />
            </label>
            <label className="full-width">
              Collateral and Ground Reality Notes
              <textarea
                value={collateralNotes}
                onChange={(e) => setCollateralNotes(e.target.value)}
                placeholder="Example: Plant assets appear maintained; title clarity pending."
              />
            </label>
            <div className="actions full-width">
              <button type="submit" disabled={loading}>
                {loading ? 'Researching...' : 'Run Research Investigation'}
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
                      className="secondary"
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
            <h3>Research Findings</h3>
            <div className="chip-wrap">
              <span className="chip chip-unknown">Java Backend</span>
              <span className="chip chip-ok">Hybrid Intelligence</span>
            </div>
          </div>
          <div className="module2-tabs">
            {[
              ['overview', 'Overview'],
              ['network', 'Network'],
              ['promoters', 'Promoters'],
              ['litigation', 'Litigation'],
              ['news', 'News Signals'],
              ['alerts', 'Alerts'],
              ['operations', 'Operations'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeTab === key ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {!report ? (
            <div className="module2-empty-state">
              <h4>Run Research Investigation to Begin</h4>
              <p>Use company details or intake pipeline data to generate external intelligence findings.</p>
            </div>
          ) : null}

          {report && activeTab === 'overview' ? (
            <>
          <div className="risk-top-grid">
            <div className="card">
              <h3>Composite Risk</h3>
              <RiskGauge score={adjustedView.adjustedScore} grade={report.riskScore?.grade} />
              <p>{report.riskScore?.summary || 'No summary available'}</p>
              <p className="muted-note">
                Base score: {(report.riskScore?.compositeScore ?? 0).toFixed(1)} | Primary insight adjustment:{' '}
                {adjustedView.adjustment >= 0 ? '+' : ''}
                {adjustedView.adjustment.toFixed(1)}
              </p>
            </div>
            <div className="card">
              <h3>Category Scores</h3>
              <ScoreBars
                data={[
                  ['Network', report.riskScore?.networkScore],
                  ['Litigation', report.riskScore?.litigationScore],
                  ['Regulatory', report.riskScore?.regulatoryScore],
                  ['News', report.riskScore?.newsScore],
                  ['Promoter', report.riskScore?.promoterScore],
                ]}
              />
            </div>
          </div>

          {adjustedView.reasons.length > 0 ? (
            <div className="card">
              <h3>Primary Insight Impact</h3>
              <ul className="insight-list">
                {adjustedView.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card">
            <h3>Research Highlights</h3>
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Network Nodes</span>
                <strong className="kpi-value">{report.networkGraph?.nodes?.length || 0}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Network Edges</span>
                <strong className="kpi-value">{report.networkGraph?.edges?.length || 0}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Litigations</span>
                <strong className="kpi-value">{report.litigationRecords?.length || 0}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Regulatory Actions</span>
                <strong className="kpi-value">{report.regulatoryActions?.length || 0}</strong>
              </div>
            </div>
          </div>

          <div className="insight-layout">
            <div className="card">
              <h3>News Sentiment Distribution</h3>
              <ScoreBars data={Object.entries(sentimentSummary)} />
            </div>
            <div className="card">
              <h3>Litigation Status Mix</h3>
              <ScoreBars data={Object.entries(litigationStatusSummary)} />
            </div>
          </div>

          <div className="risk-top-grid">
            <div className="card">
              <h3>Recommendation Engine (Prototype)</h3>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Decision</span>
                  <strong className="kpi-value">{recommendation.decision}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Suggested Limit</span>
                  <strong className="kpi-value">{recommendation.limitCr.toFixed(2)} Cr</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Suggested Rate</span>
                  <strong className="kpi-value">{recommendation.ratePct.toFixed(2)}%</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Risk Premium</span>
                  <strong className="kpi-value">{recommendation.premiumBps} bps</strong>
                </div>
              </div>
              <ul className="insight-list">
                {recommendation.explain.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>CAM Narrative Draft</h3>
              <ul className="insight-list">
                {camSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
            </>
          ) : null}

          {report && activeTab === 'network' ? (
            <div className="card">
              <h3>Network Entities</h3>
              <div className="list-table">
                {(report.networkGraph?.nodes || []).slice(0, 25).map((n) => (
                  <div key={n.id} className="list-row">
                    <span>{n.name}</span>
                    <span>{n.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {report && activeTab === 'promoters' ? (
            <div className="card">
              <h3>Promoter Watchlist</h3>
              <div className="list-table">
                {(report.promoterProfiles || []).slice(0, 20).map((p, idx) => (
                  <div key={`${p.name}-${idx}`} className="list-row">
                    <span>{p.name}</span>
                    <span>{(p.riskScore ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {report && activeTab === 'litigation' ? (
            <div className="insight-layout">
              <div className="card">
                <h3>Litigation Tracker</h3>
                {(report.litigationRecords || []).length === 0 ? (
                  <p>No major records found.</p>
                ) : (
                  <div className="list-table">
                    {report.litigationRecords.slice(0, 15).map((l, idx) => (
                      <div key={`${l.caseNumber}-${idx}`} className="list-row">
                        <span>{l.nature || 'case'}</span>
                        <span>{l.status || 'unknown'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <h3>Litigation Status Mix</h3>
                <ScoreBars data={Object.entries(litigationStatusSummary)} />
              </div>
            </div>
          ) : null}

          {report && activeTab === 'news' ? (
            <div className="insight-layout">
              <div className="card">
                <h3>News Flow</h3>
                {(report.newsSignals || []).length === 0 ? (
                  <p>No recent high-relevance news found.</p>
                ) : (
                  <div className="news-list">
                    {report.newsSignals.slice(0, 15).map((n, idx) => (
                      <div key={`${n.title}-${idx}`} className="news-item">
                        <strong>{n.title}</strong>
                        <p>{n.source} | {n.sentiment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <h3>News Sentiment Distribution</h3>
                <ScoreBars data={Object.entries(sentimentSummary)} />
              </div>
            </div>
          ) : null}

          {report && activeTab === 'alerts' ? (
            <div className="card">
              <h3>Risk Alerts</h3>
              {(report.riskScore?.alerts || []).length === 0 ? (
                <p>No active alerts found.</p>
              ) : (
                <div className="alert-grid">
                  {report.riskScore.alerts.slice(0, 20).map((a, idx) => (
                    <div key={`${a.title}-${idx}`} className="alert-card">
                      <div className="ratio-head">
                        <strong>{a.title}</strong>
                        <span className={`chip chip-${(a.severity || 'LOW').toLowerCase()}`}>{a.severity}</span>
                      </div>
                      <p>{a.description}</p>
                      <small>{a.source}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {report && activeTab === 'operations' ? (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Research Reliability</span>
                  <strong className="kpi-value">{reliability.score.toFixed(0)}%</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Case Priority</span>
                  <strong className="kpi-value">{actionQueue.priority}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Open Actions</span>
                  <strong className="kpi-value">{actionQueue.items.length}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Escalation SLA</span>
                  <strong className="kpi-value">{actionQueue.sla}</strong>
                </div>
              </div>

              <div className="insight-layout">
                <div className="card">
                  <h3>Control Assurance Checklist</h3>
                  <div className="list-table">
                    {reliability.checks.map((item) => (
                      <div key={item.name} className="list-row">
                        <span>{item.name}</span>
                        <span className={`chip chip-${item.status === 'PASS' ? 'ok' : 'warning'}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3>Regulatory Heat</h3>
                  <ScoreBars data={Object.entries(regulatoryHeat)} />
                </div>
              </div>

              <div className="card">
                <h3>Case Action Queue</h3>
                <div className="alert-grid">
                  {actionQueue.items.map((item) => (
                    <div key={item.title} className="alert-card">
                      <div className="ratio-head">
                        <strong>{item.title}</strong>
                        <span className={`chip chip-${item.severity.toLowerCase()}`}>{item.severity}</span>
                      </div>
                      <p>{item.description}</p>
                      <p className="muted-note">Owner: {item.owner} | Due: {item.due}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="ratio-head">
                  <h3>Case Workbench</h3>
                  <div className="actions">
                    <button type="button" onClick={handleCreateCaseFromCurrentResearch} disabled={loading}>Create Case</button>
                    <button type="button" className="secondary" onClick={() => refreshCaseWorkbench(selectedCase?.caseId)} disabled={loading}>Refresh</button>
                    <button type="button" className="secondary" onClick={handleEscalationSweep} disabled={loading}>Run Escalation Sweep</button>
                  </div>
                </div>
                {caseMsg ? <p className="muted-note">{caseMsg}</p> : null}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Cases</span>
                    <strong className="kpi-value">{cases.length}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Overdue Actions</span>
                    <strong className="kpi-value">{overdueActions.length}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Selected Case</span>
                    <strong className="kpi-value kpi-compact">{selectedCase?.caseId || 'N/A'}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Audit Integrity</span>
                    <strong className="kpi-value">{auditVerification?.valid ? 'VALID' : 'UNVERIFIED'}</strong>
                  </div>
                </div>

                <div className="actions">
                  <button type="button" className="secondary" onClick={() => handleTransitionCase('UNDER_REVIEW')} disabled={loading || !selectedCase}>Move to Review</button>
                  <button type="button" className="secondary" onClick={() => handleTransitionCase('ESCALATED')} disabled={loading || !selectedCase}>Escalate</button>
                  <button type="button" className="secondary" onClick={() => handleTransitionCase('CLOSED')} disabled={loading || !selectedCase}>Close Case</button>
                  <button type="button" className="secondary" onClick={handleAssignAction} disabled={loading || !selectedCase}>Assign Action</button>
                  <button type="button" className="secondary" onClick={handleAddEvidence} disabled={loading || !selectedCase}>Add Evidence</button>
                  <button type="button" onClick={handleRecordDecision} disabled={loading || !selectedCase}>Record Decision</button>
                </div>

                <div className="insight-layout">
                  <div className="card">
                    <h4>Recent Cases</h4>
                    <div className="list-table">
                      {cases.slice(0, 8).map((item) => (
                        <div key={item.caseId} className="list-row">
                          <span>{item.caseId} | {item.companyName}</span>
                          <button className="secondary" onClick={() => refreshCaseWorkbench(item.caseId)}>Open</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <h4>Overdue SLA Actions</h4>
                    <div className="list-table">
                      {overdueActions.slice(0, 8).map((item) => (
                        <div key={`${item.caseId}-${item.actionId}`} className="list-row">
                          <span>{item.caseId} | {item.title}</span>
                          <span>{item.overdueHours}h overdue</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h4>Immutable Audit Trail</h4>
                  <p className="muted-note">
                    Verification: {auditVerification?.message || 'Run case refresh to verify hash chain.'}
                    {auditVerification?.failureAtAuditId ? ` (break at ${auditVerification.failureAtAuditId})` : ''}
                  </p>
                  <div className="list-table">
                    {auditRows.slice(0, 10).map((row) => (
                      <div key={row.auditId} className="list-row">
                        <span>{row.eventType} | {row.actor}</span>
                        <span>{row.at ? new Date(row.at).toLocaleString() : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {decisionPack ? (
                  <div className="card">
                    <div className="ratio-head">
                      <h4>Decision Pack Snapshot</h4>
                      <span className="chip chip-ok">Generated</span>
                    </div>
                    <pre>{JSON.stringify(decisionPack, null, 2)}</pre>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
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
  const alertCount = report?.riskScore?.alerts?.length || 0;
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

function RiskGauge({ score, grade }) {
  const value = Number.isFinite(score) ? Math.max(0, Math.min(30, score)) : 0;
  const percent = (value / 30) * 100;
  return (
    <div className="gauge-wrap">
      <div className="gauge">
        <div className="gauge-inner">
          <strong>{value.toFixed(1)}</strong>
          <span>/ 30</span>
        </div>
        <div className="gauge-ring" style={{ '--progress': `${percent}%` }} />
      </div>
      <p>
        Grade <strong>{grade || 'N/A'}</strong>
      </p>
    </div>
  );
}

function ScoreBars({ data }) {
  const values = data.map(([, v]) => (Number.isFinite(v) ? v : 0));
  const max = Math.max(...values, 1);
  return (
    <div className="priority-bars">
      {data.map(([label, value]) => {
        const num = Number.isFinite(value) ? value : 0;
        return (
          <div key={label} className="bar-row">
            <span>{label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(num / max) * 100}%` }} />
            </div>
            <strong>{num.toFixed(1)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function summarizeSentiments(news) {
  return (news || []).reduce(
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
  (records || []).forEach((record) => {
    const key = (record?.status || 'unknown').toLowerCase();
    summary[key] = (summary[key] || 0) + 1;
  });
  return summary;
}

function summarizeRegulatorySeverity(actions) {
  const summary = { low: 0, medium: 0, high: 0, critical: 0 };
  (actions || []).forEach((action) => {
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
  const alerts = report?.riskScore?.alerts || [];
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
