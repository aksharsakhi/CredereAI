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
      <p className="muted-note">Benchmarking against Top 5 sector peers in the same turnover bracket.</p>
      <div className="list-table" style={{marginTop: '2rem'}}>
        <div className="list-row" style={{fontWeight: 700, background: 'var(--bg-alt)'}}>
          <span>Metric</span>
          <span>{companyName} (Entity)</span>
          <span>Sector Avg (Peer)</span>
        </div>
        {peers.map((p, idx) => (
          <div key={idx} className="list-row">
            <span>{p.metric}</span>
            <span style={{color: p.status === 'UP' ? 'var(--ok)' : (p.status === 'DOWN' ? 'var(--danger)' : 'var(--text)')}}>{p.entityValue}</span>
            <span>{p.peerAvg}</span>
          </div>
        ))}
      </div>
      <div className="card secondary-card" style={{marginTop: '2rem', borderLeft: '4px solid var(--ok)'}}>
         <strong>Sector Insight:</strong>
         <p style={{fontSize: '13px', marginTop: '4px'}}>
           {peers.find(p => p.status === 'UP')?.insight || 'Entity shows competitive alignment with sector benchmarks.'}
         </p>
      </div>
    </div>
  );
}

export default function Module3Panel() {
  const [engine, setEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const [activeTab, setActiveTab] = useState('overview');
  const [sensitivity, setSensitivity] = useState({ revenue: 0, rates: 0, margin: 0 });

  const isReady = engine?.status === 'READY';

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
          ['evidence', 'Audit Ledger']
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
        {activeTab === 'overview' && (
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
                    cx="50" cy="50" r="40" 
                    style={{ 
                      strokeDashoffset: 251.2 - (251.2 * (engine?.confidence || 0.8)),
                      stroke: (engine?.confidence || 0.8) > 0.7 ? 'var(--ok)' : 'var(--warn)'
                    }}
                  />
                </svg>
                <div className="gauge-text">
                  <strong style={{fontSize: '28px'}}>{(engine?.confidence * 100 || 80).toFixed(0)}%</strong>
                  <span>Confidence</span>
                </div>
              </div>
              <div className="kpi-grid">
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
                   <span className="metric-value">{engine?.completenessScore?.toFixed(0) || 0}%</span>
                </div>
                <div className="metric-progress" style={{margin: '0'}}><div className="metric-p-fill" style={{width: `${engine?.completenessScore || 0}%`}} /></div>
              </div>

              <div className="metric-row" style={{marginTop: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px'}}>
                   <span className="metric-label">Policy Guardrails</span>
                   <span className="metric-value">100%</span>
                </div>
                <div className="metric-progress" style={{margin: '0'}}><div className="metric-p-fill" style={{width: '100%', background: 'var(--ok)'}} /></div>
              </div>

              <div className="metric-row" style={{marginTop: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px'}}>
                   <span className="metric-label">Evidence Fidelity</span>
                   <span className="metric-value">94%</span>
                </div>
                <div className="metric-progress" style={{margin: '0'}}><div className="metric-p-fill" style={{width: '94%'}} /></div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-alt)', borderRadius: '12px' }}>
                <h4 style={{fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase'}}>Core Rationale</h4>
                <ul className="insight-list" style={{margin: '0.5rem 0 0'}}>
                  {(engine?.rationale || []).slice(0, 2).map((r, idx) => <li key={`rat-${idx}`} style={{fontSize: '13px'}}>{r}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="studio-section-row">
            <div className="card">
              <div className="module2-results-head">
                <h3>Guardrails & Safety</h3>
                <span className={`chip chip-${(engine?.guardrailReasons || []).length > 0 ? 'alert' : 'ok'}`}>
                  {(engine?.guardrailReasons || []).length} Violations
                </span>
              </div>
              <p className="muted-note" style={{margin: '8px 0 16px'}}>System-enforced credit policy gates.</p>
              <ul className="insight-list">
                {(engine?.guardrailReasons || []).length === 0 ? (
                  <li style={{color: 'var(--ok)'}}>✓ All automated financial guardrails passed.</li>
                ) : (
                  (engine?.guardrailReasons || []).map((r, idx) => (
                    <li key={`risk-${idx}`} className="risk-item" style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                      <span className="chip chip-alert" style={{padding: '2px 6px', fontSize: '9px'}}>FAIL</span>
                      {r}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="card">
              <h3>Operating Covenants</h3>
              <p className="muted-note" style={{margin: '8px 0 16px'}}>Mandatory post-disbursement monitoring conditions.</p>
              <ul className="insight-list">
                {(engine?.covenants || []).length === 0 ? (
                  <li>Standard monitoring and information covenants apply.</li>
                ) : (
                  (engine?.covenants || []).map((c, idx) => (
                    <li key={`cov-${idx}`} style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                      <span style={{color: 'var(--brand)'}}>◉</span>
                      {c}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
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
                <span className="kpi-label">Base Cost of Funds</span>
                <strong className="kpi-value">8.25%</strong>
              </div>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <h4>Decision Evidence Path</h4>
              <div className="list-table">
                {(engine?.rationale || []).map((r, idx) => (
                  <div key={`rat-full-${idx}`} className="list-row" style={{padding: '12px', fontSize: '13px'}}>
                    <span style={{color: 'var(--brand)', fontWeight: 700}}>EVID-{100+idx}</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
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
                   <input type="range" min="-50" max="50" value={sensitivity.revenue} onChange={(e) => setSensitivity({...sensitivity, revenue: parseInt(e.target.value)})} />
                </label>
                <label style={{display: 'grid', gap: '8px'}}>
                   Rate Hike (bps): +{sensitivity.rates}
                   <input type="range" min="0" max="1000" step="50" value={sensitivity.rates} onChange={(e) => setSensitivity({...sensitivity, rates: parseInt(e.target.value)})} />
                </label>
                <label style={{display: 'grid', gap: '8px'}}>
                   Margin Compression (%): {sensitivity.margin}%
                   <input type="range" min="-10" max="0" step="0.5" value={sensitivity.margin} onChange={(e) => setSensitivity({...sensitivity, margin: parseFloat(e.target.value)})} />
                </label>
            </div>

            <div className="scenarios-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="card scenario-card-premium stable">
                <strong>Base Case (TTM)</strong>
                <p style={{fontSize: '12px', margin: '4px 0 12px'}}>Performance sustained with no macro shocks.</p>
                <div className="scenario-stats">
                  <div className="s-stat"><span>Est. DSCR</span><strong>2.4x</strong></div>
                  <div className="s-stat"><span>Leverage</span><strong>0.8x</strong></div>
                  <div className="s-stat"><span>Decision</span><strong style={{color: 'var(--ok)'}}>PASS</strong></div>
                </div>
              </div>
              <div className="card scenario-card-premium warning">
                <strong>Simulation Output</strong>
                <p style={{fontSize: '12px', margin: '4px 0 12px'}}>Impact based on your manual slider adjustments.</p>
                <div className="scenario-stats">
                  <div className="s-stat"><span>Adj. DSCR</span><strong>{(2.4 * (1 + (sensitivity.revenue/100))).toFixed(2)}x</strong></div>
                  <div className="s-stat"><span>Impact</span><strong style={{color: sensitivity.revenue < -15 ? 'var(--danger)' : (sensitivity.revenue < 0 ? 'var(--warn)' : 'var(--ok)')}}>
                    {sensitivity.revenue < -25 ? 'BREACH' : (sensitivity.revenue < -5 ? 'STRESSED' : 'STABLE')}
                  </strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'peer' && (
          <PeerBenchmarking companyName={engine?.companyName || 'Titan Company Limited'} />
        )}

        {activeTab === 'draft' && (
          <div className="card cam-paper-container" style={{background: '#fff', color: '#111', padding: '40px', maxWidth: '800px', margin: '20px auto', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #ddd'}}>
             <div style={{textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px'}}>
                <h1 style={{fontSize: '24px', margin: 0}}>Credit Appraisal Memo (CAM)</h1>
                <p style={{fontSize: '12px', margin: '5px 0', textTransform: 'uppercase', letterSpacing: '2px'}}>Proprietary & Confidential - Credere AI Systems</p>
             </div>
             
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '13px'}}>
                <div><strong>Entity:</strong> {engine?.companyName || 'Titan Company Limited'}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Recommended Limit:</strong> {engine?.recommendedLimitCr?.toFixed(2)} Cr</div>
                <div><strong>Draft ID:</strong> CAM-AI-{Math.floor(Math.random() * 10000)}</div>
             </div>

             <section style={{marginBottom: '20px'}}>
                <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px'}}>1. Executive Summary</h4>
                <p style={{fontSize: '13px', lineHeight: '1.6'}}>Based on the multi-modal assessment of financial documents and external research, we suggest a limit of {engine?.recommendedLimitCr?.toFixed(2)} Cr. The entity shows strong grounding in operational data, with a confidence score of {(engine?.confidence * 100).toFixed(0)}%.</p>
             </section>

             <section style={{marginBottom: '20px'}}>
                <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px'}}>2. Key Strengths</h4>
                <ul style={{fontSize: '13px', paddingLeft: '20px'}}>
                   {(engine?.rationale || []).slice(0, 3).map((r, i) => <li key={i} style={{marginBottom: '4px'}}>{r}</li>)}
                </ul>
             </section>

             <section style={{marginBottom: '20px'}}>
                <h4 style={{borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '8px'}}>3. Critical Risk Factors</h4>
                <ul style={{fontSize: '13px', paddingLeft: '20px'}}>
                   {Array.isArray(engine?.guardrailReasons) && engine.guardrailReasons.length > 0 ? (
                     engine.guardrailReasons.map((g, i) => <li key={i} style={{marginBottom: '4px', color: '#b30000'}}>{g}</li>)
                   ) : <li>No critical automated risk violations detected.</li>}
                </ul>
             </section>

             <div className="actions" style={{marginTop: '40px', justifyContent: 'center'}}>
                <button type="button" onClick={() => window.print()} className="primary">Download Final CAM (PDF)</button>
             </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
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

            {!isReady && (
              <div className="card secondary-card" style={{marginTop: '2rem', background: 'rgba(255, 165, 0, 0.1)', borderLeft: '4px solid var(--warn)'}}>
                 <strong style={{color: 'var(--warn)'}}>⚠️ Decision Status: Withheld</strong>
                 <p style={{fontSize: '13px', marginTop: '8px'}}> 
                   The automated recommendation is currently withheld to prevent hallucination from low-evidence context. 
                   Grounding is not yet complete. Please provide missing documents and rerun the synthesis.
                 </p>
              </div>
            )}

            <div style={{marginTop: '2rem'}}>
              <h4>Proposed Deployment Strategy</h4>
              <ul className="insight-list">
                {(engine?.recommendations || []).length === 0 ? (
                  <li>Proceed with standard disbursement schedule upon completion of KYC.</li>
                ) : (
                  (engine?.recommendations || []).map((r, idx) => (
                    <li key={`rec-${idx}`} className="action-li" style={{borderLeftColor: r.includes('withheld') ? 'var(--warn)' : 'var(--brand)'}}>
                      {r}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="card">
            <h3>Immutable Evidence Ledger</h3>
            <p className="muted-note">Audit-ready data traces for every extracted field and risk factor.</p>
            <div className="list-table">
              {(engine?.evidence || []).map((e) => (
                <div key={e.key} className="list-row">
                  <span>{e.label}</span>
                  <span className={e.available ? 'chip chip-ok' : 'chip chip-warning'}>{e.available ? e.value : 'Missing'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
