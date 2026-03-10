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
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'gst_filing', label: 'GST Filing' },
  { value: 'rating_report', label: 'Rating Report' },
];

export default function Module1Panel({ user }) {
  const maxUploadMb = 200;
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('annual_report');
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

  async function refresh() {
    const [docs, comp, dash, uw, ent, wf] = await Promise.all([
      getDocuments(),
      getCompleteness(),
      getDashboardAnalysis(),
      getUnderwritingAnalysis(),
      getEnterpriseAssessment(),
      getReviewWorkflow(),
    ]);
    setDocuments(docs || []);
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
  const criticalGapCount = (dashboard?.missingCriticalFields || []).length;
  const riskSignals = Object.values(dashboard?.riskBreakdown || {}).reduce((a, b) => a + b, 0);
  const workflowStage = completenessScore >= 70 ? 'Research Ready' : completenessScore >= 40 ? 'Needs More Docs' : 'Early Intake';
  const documentCategoryCounts = documents.reduce((acc, doc) => {
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
    const fields = completeness?.fields || [];
    return fields.slice(0, 14);
  }, [completeness]);

  return (
    <section className="panel">
      <h2>Financial Intake</h2>

      <div className="module1-layout">
        <div className="module1-left">
          <form onSubmit={handleUpload} className="card form-grid">
            <label>
              Document Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              PDF file
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <button type="submit" disabled={!file || loading}>
              {loading ? 'Processing...' : 'Upload and Process'}
            </button>
          </form>

          <div className="card compact-note ingest-note">
            <strong>Ingestion Rules</strong>
            <p>Supported: Annual Reports, GST Filings, Bank Statements, Financial Statements, Rating Reports.</p>
            <p>Max upload: 200MB | Server hard limit: 220MB</p>
            {file ? <p>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)</p> : null}
          </div>

          <div className="card">
            <h3>Control Actions</h3>
            <div className="actions">
              <button onClick={handleFullAnalysis} disabled={loading}>Run Full Analysis</button>
              <button className="secondary" onClick={refresh} disabled={loading}>Refresh</button>
              <button className="secondary" onClick={handleReset} disabled={loading}>Reset</button>
            </div>
            {historyMessage ? <p className="muted-note">{historyMessage}</p> : null}
          </div>

          <div className="card">
            <h3>Uploaded Documents</h3>
            {documents.length === 0 ? <p>No documents uploaded.</p> : null}
            {documents.slice(0, 12).map((d) => (
              <div key={d.id} className="list-row">
                <span>{d.filename} ({d.pageCount}p)</span>
                <div className="row-actions">
                  <span>{d.category}</span>
                  <button className="danger-btn" onClick={() => handleDeleteDocument(d.id)} disabled={loading}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Data Completeness</h3>
            <CompletenessDial score={completenessScore} />
            <p>{completeness ? `${completenessScore.toFixed(1)}% coverage` : 'No completeness data yet.'}</p>
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

          <div className="module2-tabs">
            {[
              ['overview', 'Overview'],
              ['extraction', 'Extraction'],
              ['trends', 'Trends'],
              ['fraud', 'Fraud Shield'],
              ['ratios', 'Ratios'],
              ['reliability', 'Reliability'],
              ['enterprise', 'Enterprise Ops'],
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

          {error ? <p className="error">{error}</p> : null}

          {!dashboard ? (
            <div className="module2-empty-state">
              <h4>Upload Documents to Begin</h4>
              <p>After ingestion, run analysis to unlock trend, fraud, and underwriting intelligence.</p>
            </div>
          ) : null}

          {dashboard && activeTab === 'overview' ? (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Company</span>
                  <strong className="kpi-value kpi-compact">{dashboard.companyName || 'Unknown Entity'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Financial Year</span>
                  <strong className="kpi-value">{dashboard.financialYear || 'N/A'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Risk Signals</span>
                  <strong className="kpi-value">{riskSignals}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Decision</span>
                  <strong className="kpi-value">{underwriting?.decision || 'Pending'}</strong>
                </div>
              </div>

              <div className="kpi-grid">
                {(dashboard.kpis || []).map((k) => (
                  <div key={k.key} className={`kpi-card status-${(k.status || 'UNKNOWN').toLowerCase()}`}>
                    <span className="kpi-label">{k.label}</span>
                    <strong className="kpi-value">{k.value == null ? 'N/A' : `${k.value.toFixed(2)}${k.unit ? ` ${k.unit}` : ''}`}</strong>
                    <span className="kpi-status">{k.status || 'UNKNOWN'}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3>Explainability Notes</h3>
                <ul className="insight-list">
                  {(dashboard.insights || []).map((i, idx) => (
                    <li key={`${i}-${idx}`}>{i}</li>
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
                    dashboard.missingCriticalFields.map((f) => (
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
                <p>Evidence Sources: {consolidated.sourceCount || documents.length}</p>
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
  return (
    <div className="gauge-wrap">
      <div className="gauge">
        <div className="gauge-inner">
          <strong>{safe.toFixed(1)}</strong>
          <span>%</span>
        </div>
        <div className="gauge-ring" style={{ '--progress': `${safe}%` }} />
      </div>
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
