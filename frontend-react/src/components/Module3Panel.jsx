import React, { useEffect, useState } from 'react';
import { getRecommendationEngine, getPeerBenchmarking } from '../api/client';

function PeerBenchmarking({ companyName }) {
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPeers() {
      try {
        setLoading(true);
        const data = await getPeerBenchmarking(companyName);
        setPeers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPeers();
  }, [companyName]);

  if (loading) return <div className="spinner" />;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card">
      <h3>Peer Intelligence & Sector Comparison</h3>
      <p className="muted-note">Benchmarking against top sector peers in the same turnover bracket.</p>
      <div className="list-table" style={{marginTop: '2rem'}}>
        <div className="list-row" style={{fontWeight: 700, background: 'var(--bg-alt)'}}>
          <span>Metric</span>
          <span>{companyName} (Entity)</span>
          <span>Sector Avg (Peer)</span>
        </div>
        {peers.map((peer, idx) => (
          <div key={idx} className="list-row">
            <span>{peer.metric}</span>
            <span style={{color: peer.status === 'UP' ? 'var(--ok)' : (peer.status === 'DOWN' ? 'var(--danger)' : 'var(--text)')}}>{peer.entityValue}</span>
            <span>{peer.peerAvg}</span>
          </div>
        ))}
      </div>
      <div className="card secondary-card" style={{marginTop: '2rem', borderLeft: '4px solid var(--ok)'}}>
        <strong>Sector Insight:</strong>
        <p style={{fontSize: '13px', marginTop: '4px'}}>
          {peers.find((peer) => peer.status === 'UP')?.insight || 'Entity shows competitive alignment with sector benchmarks.'}
        </p>
      </div>
    </div>
  );
}

export default function Module3Panel() {
  const [engine, setEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sensitivity, setSensitivity] = useState({ revenue: 0, rates: 0, margin: 0 });

  async function refreshRecommendation() {
    setLoading(true);
    setError('');
    try {
      const data = await getRecommendationEngine();
      setEngine(data || null);
    } catch (e) {
      setError(e.message || 'Failed to fetch recommendation engine output.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshRecommendation();
  }, []);

  const isReady = engine?.status === 'READY';
  const safeEvidence = Array.isArray(engine?.evidence) ? engine.evidence : [];
  const safeGuardrails = Array.isArray(engine?.guardrailReasons) ? engine.guardrailReasons : [];
  const safeRationale = Array.isArray(engine?.rationale) ? engine.rationale : [];
  const safeRecommendations = Array.isArray(engine?.recommendations) ? engine.recommendations : [];
  const safeCovenants = Array.isArray(engine?.covenants) ? engine.covenants : [];
  const resolvedCompanyName = String(engine?.companyName || '').trim();
  const hasCompanyName = resolvedCompanyName.length > 0;
  const policyReadinessPct = safeGuardrails.length === 0 ? 100 : Math.max(20, 100 - (safeGuardrails.length * 20));
  const evidenceCoverage = safeEvidence.length > 0
    ? (safeEvidence.filter((item) => item?.available).length / safeEvidence.length) * 100
    : 0;
  const decisionSignals = [
    ['Confidence', (Number(engine?.confidence) || 0) * 100],
    ['Completeness', Number(engine?.completenessScore) || 0],
    ['Evidence coverage', evidenceCoverage],
    ['Policy readiness', isReady ? 100 : Math.max(35, evidenceCoverage)],
  ];
  const scenarioMetrics = buildScenarioMetrics(engine, sensitivity);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Decision Studio</h2>
          <p className="muted-note">Evidence-grounded credit appraisal memo synthesis and stress testing.</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary">Export to Excel</button>
          <button type="button" onClick={refreshRecommendation} disabled={loading} className="primary">
            {loading ? 'Generating Memo...' : 'Refresh Recommendation'}
          </button>
        </div>
      </div>

      <div className="card stage-card">
        <div>
          <h3>Credit Decision Engine</h3>
          <p>
            Synthesis is based on cross-validated intakes from Module 1 and external intelligence from Module 2.
            Quality gates must pass for final grounding.
          </p>
          <div className="chip-wrap" style={{ marginTop: '0.5rem' }}>
            <span className={`chip chip-${isReady ? 'ok' : 'warning'}`}>Status: {engine?.status || 'PENDING'}</span>
            <span className="chip chip-unknown">Grounded: {engine?.grounded ? 'YES' : 'NO'}</span>
          </div>
        </div>
        <div className="workflow-lane">
          <div className="workflow-connector">
            <div className="connector-fill" style={{ width: isReady ? '100%' : '50%' }} />
          </div>
          <div className={`workflow-step ${isReady ? 'completed' : 'active'}`}>
            <div className="step-node">1</div>
            <span className="step-label">Inference</span>
          </div>
          <div className={`workflow-step ${isReady ? 'completed' : 'active'}`}>
            <div className="step-node">2</div>
            <span className="step-label">Policy</span>
          </div>
          <div className={`workflow-step ${isReady ? 'completed' : 'active'}`}>
            <div className="step-node">3</div>
            <span className="step-label">Stress</span>
          </div>
          <div className={`workflow-step ${isReady ? 'completed' : ''}`}>
            <div className="step-node">4</div>
            <span className="step-label">Memo</span>
          </div>
        </div>
      </div>

      <div className="module2-tabs">
        {[
          ['overview', 'Overview'],
          ['risk', 'Risk Factors'],
          ['metrics', 'Metrics & Yield'],
          ['scenarios', 'Stress Lab'],
          ['peer', 'Peer Comparison'],
          ['draft', 'CAM Drafting'],
          ['recommendations', 'Decision'],
          ['evidence', 'Audit Ledger'],
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

      {error ? <div className="card error-card"><p className="error">{error}</p></div> : null}

      <div className="studio-sections">
        {activeTab === 'overview' ? (
          <div className="studio-grid-2">
            <div className="card glass-card">
              <div className="module2-results-head">
                <h3>Executive Insight</h3>
                <span className={`chip chip-${isReady ? 'ok' : 'warning'}`}>{engine?.status || 'PENDING'}</span>
              </div>
              <div className="risk-summary-gauge" style={{margin: '2rem auto'}}>
                <svg className="gauge-svg" viewBox="0 0 100 100">
                  <circle className="gauge-bg" cx="50" cy="50" r="40" />
                  <circle
                    className="gauge-fill"
                    cx="50"
                    cy="50"
                    r="40"
                    style={{
                      strokeDashoffset: 251.2 - (251.2 * (Number(engine?.confidence) || 0)),
                      stroke: (Number(engine?.confidence) || 0) > 0.7 ? 'var(--ok)' : 'var(--warn)',
                    }}
                  />
                </svg>
                <div className="gauge-text">
                  <strong style={{fontSize: '28px'}}>{((Number(engine?.confidence) || 0) * 100).toFixed(0)}%</strong>
                  <span>Confidence</span>
                </div>
              </div>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Entity</span>
                  <strong className="kpi-value">{hasCompanyName ? resolvedCompanyName : 'Not indexed yet'}</strong>
                </div>
                <div className="kpi-card highlight">
                  <span className="kpi-label">Decision</span>
                  <strong className="kpi-value">{engine?.decision || 'WITHHELD'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Internal Rating</span>
                  <strong className="kpi-value">{engine?.internalRating || '---'}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Synthesis & Policy Match</h3>
              <p className="muted-note" style={{marginBottom: '1.5rem'}}>Grounded analysis of financial health and statutory compliance.</p>

              <div className="metric-row">
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px'}}>
                  <span className="metric-label">Data Grounding</span>
                  <span className="metric-value">{Number(engine?.completenessScore || 0).toFixed(0)}%</span>
                </div>
                <div className="metric-progress" style={{margin: '0'}}><div className="metric-p-fill" style={{width: `${Number(engine?.completenessScore || 0)}%`}} /></div>
              </div>

              <div className="metric-row" style={{marginTop: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px'}}>
                  <span className="metric-label">Policy Guardrails</span>
                  <span className="metric-value">{policyReadinessPct.toFixed(0)}%</span>
                </div>
                <div className="metric-progress" style={{margin: '0'}}><div className="metric-p-fill" style={{width: `${policyReadinessPct}%`, background: safeGuardrails.length === 0 ? 'var(--ok)' : 'var(--warn)'}} /></div>
              </div>

              <div className="metric-row" style={{marginTop: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px'}}>
                  <span className="metric-label">Evidence Fidelity</span>
                  <span className="metric-value">{evidenceCoverage.toFixed(0)}%</span>
                </div>
                <div className="metric-progress" style={{margin: '0'}}><div className="metric-p-fill" style={{width: `${evidenceCoverage}%`}} /></div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-alt)', borderRadius: '12px' }}>
                <h4 style={{fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase'}}>Core Rationale</h4>
                <ul className="insight-list" style={{margin: '0.5rem 0 0'}}>
                  {safeRationale.slice(0, 2).map((reason, idx) => <li key={`rat-${idx}`} style={{fontSize: '13px'}}>{reason}</li>)}
                </ul>
              </div>
            </div>

            <div className="card glass-card">
              <div className="module2-results-head">
                <h3>Decision Signal Stack</h3>
                <span className="chip chip-brand">Live scoring</span>
              </div>
              <ScoreBars data={decisionSignals} />
              <div style={{marginTop: '18px', padding: '14px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', gap: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                  <span>PD 1Y</span>
                  <strong>{Number.isFinite(engine?.probabilityOfDefault1Y) ? `${(engine.probabilityOfDefault1Y * 100).toFixed(2)}%` : 'N/A'}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                  <span>Expected loss</span>
                  <strong>{Number.isFinite(engine?.expectedLossPct) ? `${engine.expectedLossPct.toFixed(2)}%` : 'N/A'}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                  <span>Spread</span>
                  <strong>{Number.isFinite(engine?.pricingSpreadBps) ? `${engine.pricingSpreadBps.toFixed(0)} bps` : 'N/A'}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'risk' ? (
          <div className="studio-section-row">
            <div className="card">
              <div className="module2-results-head">
                <h3>Guardrails & Safety</h3>
                <span className={`chip chip-${safeGuardrails.length > 0 ? 'alert' : 'ok'}`}>{safeGuardrails.length} Violations</span>
              </div>
              <p className="muted-note" style={{margin: '8px 0 16px'}}>System-enforced credit policy gates.</p>
              <ul className="insight-list">
                {safeGuardrails.length === 0 ? (
                  <li style={{color: 'var(--ok)'}}>All automated financial guardrails passed.</li>
                ) : (
                  safeGuardrails.map((reason, idx) => (
                    <li key={`risk-${idx}`} className="risk-item" style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                      <span className="chip chip-alert" style={{padding: '2px 6px', fontSize: '9px'}}>FAIL</span>
                      {reason}
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="card">
              <h3>Operating Covenants</h3>
              <p className="muted-note" style={{margin: '8px 0 16px'}}>Mandatory post-disbursement monitoring conditions.</p>
              <ul className="insight-list">
                {safeCovenants.length === 0 ? (
                  <li>Standard monitoring and information covenants apply.</li>
                ) : (
                  safeCovenants.map((covenant, idx) => (
                    <li key={`cov-${idx}`} style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                      <span style={{color: 'var(--brand)'}}>O</span>
                      {covenant}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ) : null}

        {activeTab === 'metrics' ? (
          <div style={{display: 'grid', gap: '20px'}}>
            <div className="card">
              <h3>Pricing & Yield Metrics</h3>
              <div className="kpi-grid studio-metrics">
                <div className="kpi-card highlight">
                  <span className="kpi-label">Recommended Limit</span>
                  <strong className="kpi-value">{Number.isFinite(engine?.recommendedLimitCr) ? `${engine.recommendedLimitCr.toFixed(2)} Cr` : 'WITHHELD'}</strong>
                </div>
                <div className="kpi-card highlight">
                  <span className="kpi-label">Indicative Rate</span>
                  <strong className="kpi-value">{Number.isFinite(engine?.indicativeRatePct) ? `${engine.indicativeRatePct.toFixed(2)}%` : 'WITHHELD'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Risk Premium</span>
                  <strong className="kpi-value">{Number.isFinite(engine?.pricingSpreadBps) ? `${engine.pricingSpreadBps.toFixed(0)} bps` : 'N/A'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Grounded Fields</span>
                  <strong className="kpi-value">{safeEvidence.filter((item) => item.available).length}</strong>
                </div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div className="card">
                <h3>Loss & Probability Table</h3>
                <div className="list-table" style={{marginTop: '1rem'}}>
                  <div className="list-row" style={{fontWeight: 700, background: 'var(--bg-alt)'}}>
                    <span>Metric</span>
                    <span>Value</span>
                    <span>Interpretation</span>
                  </div>
                  <div className="list-row">
                    <span>Probability of Default</span>
                    <span>{Number.isFinite(engine?.probabilityOfDefault1Y) ? `${(engine.probabilityOfDefault1Y * 100).toFixed(2)}%` : 'N/A'}</span>
                    <span>1-year default likelihood</span>
                  </div>
                  <div className="list-row">
                    <span>Expected Loss</span>
                    <span>{Number.isFinite(engine?.expectedLossPct) ? `${engine.expectedLossPct.toFixed(2)}%` : 'N/A'}</span>
                    <span>Loss adjusted for severity assumptions</span>
                  </div>
                  <div className="list-row">
                    <span>Confidence</span>
                    <span>{((Number(engine?.confidence) || 0) * 100).toFixed(0)}%</span>
                    <span>Extraction and synthesis strength</span>
                  </div>
                  <div className="list-row">
                    <span>Completeness</span>
                    <span>{Number(engine?.completenessScore || 0).toFixed(0)}%</span>
                    <span>Document coverage against policy needs</span>
                  </div>
                </div>
              </div>

              <div className="card glass-card">
                <h3>Decision Evidence Path</h3>
                <div className="list-table" style={{marginTop: '1rem'}}>
                  {safeRationale.map((reason, idx) => (
                    <div key={`rat-full-${idx}`} className="list-row" style={{padding: '12px', fontSize: '13px'}}>
                      <span style={{color: 'var(--brand)', fontWeight: 700}}>EVID-{100 + idx}</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'scenarios' ? (
          <div className="card">
            <div className="module2-results-head">
              <h3>Interactive Stress Lab</h3>
              <div className="chip-wrap">
                <span className="chip chip-ok">Real-time Simulation</span>
              </div>
            </div>
            <p className="muted-note" style={{margin: '8px 0 20px'}}>Manually adjust macro parameters to see impact on recommended limit and risk grade.</p>

            <div className="simulation-controls card secondary-card" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem'}}>
              <label style={{display: 'grid', gap: '8px'}}>
                Revenue Delta (%): {sensitivity.revenue}%
                <input type="range" min="-50" max="50" value={sensitivity.revenue} onChange={(e) => setSensitivity({...sensitivity, revenue: parseInt(e.target.value, 10)})} />
              </label>
              <label style={{display: 'grid', gap: '8px'}}>
                Rate Hike (bps): +{sensitivity.rates}
                <input type="range" min="0" max="1000" step="50" value={sensitivity.rates} onChange={(e) => setSensitivity({...sensitivity, rates: parseInt(e.target.value, 10)})} />
              </label>
              <label style={{display: 'grid', gap: '8px'}}>
                Margin Compression (%): {sensitivity.margin}%
                <input type="range" min="-10" max="0" step="0.5" value={sensitivity.margin} onChange={(e) => setSensitivity({...sensitivity, margin: parseFloat(e.target.value)})} />
              </label>
            </div>

            <div className="scenarios-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="card scenario-card-premium stable">
                <strong>Base Case (Current Recommendation)</strong>
                <p style={{fontSize: '12px', margin: '4px 0 12px'}}>Production view anchored on the current recommendation engine output.</p>
                <div className="scenario-stats">
                  <div className="s-stat"><span>Limit</span><strong>{Number.isFinite(engine?.recommendedLimitCr) ? `${engine.recommendedLimitCr.toFixed(2)} Cr` : 'N/A'}</strong></div>
                  <div className="s-stat"><span>Rate</span><strong>{Number.isFinite(engine?.indicativeRatePct) ? `${engine.indicativeRatePct.toFixed(2)}%` : 'N/A'}</strong></div>
                  <div className="s-stat"><span>PD</span><strong>{Number.isFinite(engine?.probabilityOfDefault1Y) ? `${(engine.probabilityOfDefault1Y * 100).toFixed(2)}%` : 'N/A'}</strong></div>
                </div>
              </div>
              <div className={`card scenario-card-premium ${scenarioMetrics.statusTone}`}>
                <strong>Simulation Output</strong>
                <p style={{fontSize: '12px', margin: '4px 0 12px'}}>Impact based on the current slider configuration.</p>
                <div className="scenario-stats">
                  <div className="s-stat"><span>Adj. Limit</span><strong>{scenarioMetrics.adjustedLimit}</strong></div>
                  <div className="s-stat"><span>Adj. Rate</span><strong>{scenarioMetrics.adjustedRate}</strong></div>
                  <div className="s-stat"><span>Status</span><strong style={{color: scenarioMetrics.statusColor}}>{scenarioMetrics.status}</strong></div>
                </div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
              <div className="card">
                <h4 style={{marginTop: 0}}>Impact Bars</h4>
                <ScoreBars data={scenarioMetrics.impactBars} />
              </div>
              <div className="card">
                <h4 style={{marginTop: 0}}>Stress Notes</h4>
                <ul className="insight-list" style={{display: 'grid', gap: '8px'}}>
                  {scenarioMetrics.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'peer' ? (
          hasCompanyName ? (
            <PeerBenchmarking companyName={resolvedCompanyName} />
          ) : (
            <div className="card">
              <h3>Peer Intelligence & Sector Comparison</h3>
              <p className="muted-note">Upload and process documents in Module 1, then refresh Module 3 to benchmark the current entity.</p>
            </div>
          )
        ) : null}

        {activeTab === 'draft' ? (
          <div className="card cam-paper-container" style={{background: '#fff', color: '#111', padding: '40px', maxWidth: '800px', margin: '20px auto', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #ddd'}}>
            <div style={{textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px'}}>
              <h1 style={{fontSize: '24px', margin: 0}}>Credit Appraisal Memo (CAM)</h1>
              <p style={{fontSize: '12px', margin: '5px 0', textTransform: 'uppercase', letterSpacing: '2px'}}>Proprietary & Confidential - Credere AI Systems</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '13px'}}>
              <div><strong>Entity:</strong> {hasCompanyName ? resolvedCompanyName : 'Not indexed yet'}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Recommended Limit:</strong> {Number.isFinite(engine?.recommendedLimitCr) ? `${engine.recommendedLimitCr.toFixed(2)} Cr` : 'WITHHELD'}</div>
              <div><strong>Memo Status:</strong> {engine?.status || 'PENDING'}</div>
            </div>

            <section style={{marginBottom: '20px'}}>
              <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px'}}>1. Executive Summary</h4>
              <p style={{fontSize: '13px', lineHeight: '1.6'}}>Based on the multi-modal assessment of financial documents and external research, the current recommendation suggests {Number.isFinite(engine?.recommendedLimitCr) ? `${engine.recommendedLimitCr.toFixed(2)} Cr` : 'a withheld limit'}, with a synthesis confidence of {((Number(engine?.confidence) || 0) * 100).toFixed(0)}%.</p>
            </section>

            <section style={{marginBottom: '20px'}}>
              <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px'}}>2. Key Strengths</h4>
              <ul style={{fontSize: '13px', paddingLeft: '20px'}}>
                {safeRationale.slice(0, 3).map((reason, index) => <li key={index} style={{marginBottom: '4px'}}>{reason}</li>)}
              </ul>
            </section>

            <section style={{marginBottom: '20px'}}>
              <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px'}}>3. Critical Risk Factors</h4>
              <ul style={{fontSize: '13px', paddingLeft: '20px'}}>
                {safeGuardrails.length > 0 ? safeGuardrails.map((reason, index) => <li key={index} style={{marginBottom: '4px', color: '#b30000'}}>{reason}</li>) : <li>No critical automated risk violations detected.</li>}
              </ul>
            </section>

            <div className="actions" style={{marginTop: '40px', justifyContent: 'center'}}>
              <button type="button" onClick={() => window.print()} className="primary">Download Final CAM (PDF)</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'recommendations' ? (
          <div className="card recommendation-section">
            <div className="module2-results-head">
              <h3>Final Credit Committee Recommendation</h3>
              <div className="chip-wrap">
                <span className="chip chip-unknown">Memo Generated</span>
                <span className={`chip chip-${isReady ? 'ok' : 'warning'}`}>{isReady ? 'Signed: Algorithmic' : 'Review Required'}</span>
              </div>
            </div>

            <div className="recommendation-impact">
              <div className="s-stat">
                <span>Final Limit</span>
                <strong style={{fontSize: '20px', color: engine?.recommendedLimitCr ? 'var(--text)' : 'var(--muted)'}}>
                  {engine?.recommendedLimitCr ? `${engine.recommendedLimitCr.toFixed(2)} Cr` : 'TBD'}
                </strong>
              </div>
              <div className="s-stat">
                <span>Final Rate</span>
                <strong style={{fontSize: '20px', color: engine?.indicativeRatePct ? 'var(--text)' : 'var(--muted)'}}>
                  {engine?.indicativeRatePct ? `${engine.indicativeRatePct.toFixed(2)}%` : 'TBD'}
                </strong>
              </div>
              <div className="s-stat">
                <span>Rating</span>
                <strong style={{fontSize: '20px'}}>{engine?.internalRating || '---'}</strong>
              </div>
            </div>

            {!isReady ? (
              <div className="card secondary-card" style={{marginTop: '2rem', background: 'rgba(255, 165, 0, 0.1)', borderLeft: '4px solid var(--warn)'}}>
                <strong style={{color: 'var(--warn)'}}>Decision Status: Withheld</strong>
                <p style={{fontSize: '13px', marginTop: '8px'}}>
                  The automated recommendation is currently withheld to prevent hallucination from low-evidence context. Grounding is not yet complete. Please provide missing documents and rerun the synthesis.
                </p>
              </div>
            ) : null}

            <div style={{marginTop: '2rem'}}>
              <h4>Proposed Deployment Strategy</h4>
              <ul className="insight-list">
                {safeRecommendations.length === 0 ? (
                  <li>Proceed with standard disbursement schedule upon completion of KYC.</li>
                ) : (
                  safeRecommendations.map((recommendation, idx) => (
                    <li key={`rec-${idx}`} className="action-li" style={{borderLeftColor: recommendation.includes('withheld') ? 'var(--warn)' : 'var(--brand)'}}>
                      {recommendation}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ) : null}

        {activeTab === 'evidence' ? (
          <div style={{display: 'grid', gap: '20px'}}>
            <div className="card">
              <h3>Immutable Evidence Ledger</h3>
              <p className="muted-note">Audit-ready data traces for every extracted field and risk factor.</p>
              <div className="list-table">
                <div className="list-row" style={{fontWeight: 700, background: 'var(--bg-alt)'}}>
                  <span>Label</span>
                  <span>Status</span>
                  <span>Value</span>
                </div>
                {safeEvidence.map((item) => (
                  <div key={item.key} className="list-row">
                    <span>{item.label}</span>
                    <span className={item.available ? 'chip chip-ok' : 'chip chip-warning'}>{item.available ? 'Available' : 'Missing'}</span>
                    <span>{item.available ? item.value : 'Missing'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
              <div className="card glass-card">
                <h3>Evidence Coverage</h3>
                <ScoreBars data={safeEvidence.map((item) => [item.label, item.available ? 100 : 0]).slice(0, 8)} />
              </div>
              <div className="card">
                <h3>Guardrail Readiness</h3>
                <div style={{padding: '18px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', gap: '10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                    <span>Available evidence points</span>
                    <strong>{safeEvidence.filter((item) => item.available).length} / {safeEvidence.length}</strong>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                    <span>Guardrail violations</span>
                    <strong>{safeGuardrails.length}</strong>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                    <span>Recommendation state</span>
                    <strong>{engine?.status || 'PENDING'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ScoreBars({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(([, value]) => Number(value) || 0), 1);

  return (
    <div style={{display: 'grid', gap: '12px', marginTop: '16px'}}>
      {data.map(([label, value]) => {
        const safeValue = Number(value) || 0;
        return (
          <div key={label} style={{display: 'grid', gap: '6px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px'}}>
              <span style={{fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase'}}>{label}</span>
              <strong>{safeValue.toFixed(0)}%</strong>
            </div>
            <div style={{height: '8px', background: 'var(--bg-alt)', borderRadius: '999px', overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${(safeValue / max) * 100}%`, background: 'linear-gradient(90deg, var(--brand), var(--brand-2))', borderRadius: '999px'}} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildScenarioMetrics(engine, sensitivity) {
  const baseLimit = Number(engine?.recommendedLimitCr) || 0;
  const baseRate = Number(engine?.indicativeRatePct) || 0;
  const basePd = Number(engine?.probabilityOfDefault1Y) || 0;

  const revenueFactor = 1 + (Number(sensitivity?.revenue) || 0) / 100;
  const marginPenalty = Math.abs(Number(sensitivity?.margin) || 0) / 100;
  const ratePenalty = (Number(sensitivity?.rates) || 0) / 10000;

  const adjustedLimitValue = Math.max(0, baseLimit * Math.max(0.35, revenueFactor - marginPenalty - ratePenalty * 0.8));
  const adjustedRateValue = baseRate + ratePenalty * 100 + marginPenalty * 8;
  const adjustedPdValue = Math.max(0, basePd + Math.max(0, -((Number(sensitivity?.revenue) || 0) / 100)) * 0.06 + ratePenalty * 0.5 + marginPenalty * 0.4);

  let status = 'Stable';
  let statusTone = 'stable';
  let statusColor = 'var(--ok)';
  if (adjustedPdValue >= 0.12 || adjustedLimitValue < baseLimit * 0.55) {
    status = 'Breach';
    statusTone = 'alert';
    statusColor = 'var(--danger)';
  } else if (adjustedPdValue >= 0.07 || adjustedLimitValue < baseLimit * 0.8) {
    status = 'Stressed';
    statusTone = 'warning';
    statusColor = 'var(--warn)';
  }

  return {
    adjustedLimit: Number.isFinite(adjustedLimitValue) ? `${adjustedLimitValue.toFixed(2)} Cr` : 'N/A',
    adjustedRate: Number.isFinite(adjustedRateValue) ? `${adjustedRateValue.toFixed(2)}%` : 'N/A',
    status,
    statusTone,
    statusColor,
    impactBars: [
      ['Revenue stress', Math.abs(Number(sensitivity?.revenue) || 0) * 2],
      ['Funding stress', Math.min(100, (Number(sensitivity?.rates) || 0) / 10)],
      ['Margin stress', Math.abs(Number(sensitivity?.margin) || 0) * 10],
      ['Adjusted PD', Math.min(100, adjustedPdValue * 100)],
    ],
    notes: [
      `Recommendation limit compresses to ${Number.isFinite(adjustedLimitValue) ? adjustedLimitValue.toFixed(2) : '0.00'} Cr under the selected macro assumptions.`,
      `Indicative rate shifts to ${Number.isFinite(adjustedRateValue) ? adjustedRateValue.toFixed(2) : '0.00'}% after applying funding and margin stress.`,
      `Derived 1-year PD moves to ${(adjustedPdValue * 100).toFixed(2)}%, which drives the ${status.toLowerCase()} scenario classification.`,
    ],
  };
}
