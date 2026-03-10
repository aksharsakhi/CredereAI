import React, { useEffect, useState } from 'react';
import { getRecommendationEngine } from '../api/client';

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

  const isReady = engine?.status === 'READY';

  return (
    <section className="panel">
      <h2>Decision Studio</h2>

      <div className="card stage-card">
        <div>
          <h3>Comprehensive Credit Appraisal Memo Drafting</h3>
          <p>
            This workspace produces an evidence-grounded recommendation only when data quality guardrails pass.
            No synthetic numbers are used.
          </p>
        </div>
        <div className="workflow-lane">
          <span>Score</span>
          <span>Explain</span>
          <span>Price</span>
          <span>Recommend</span>
        </div>
      </div>

      <div className="card">
        <div className="actions">
          <button type="button" onClick={refreshRecommendation} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Recommendation'}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Decision</span>
          <strong className="kpi-value">{engine?.decision || 'N/A'}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Recommended Limit</span>
          <strong className="kpi-value">
            {Number.isFinite(engine?.recommendedLimitCr) ? `${engine.recommendedLimitCr.toFixed(2)} Cr` : 'WITHHELD'}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Risk Premium</span>
          <strong className="kpi-value">
            {Number.isFinite(engine?.pricingSpreadBps) ? `${engine.pricingSpreadBps.toFixed(0)} bps` : 'WITHHELD'}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Indicative Rate</span>
          <strong className="kpi-value">
            {Number.isFinite(engine?.indicativeRatePct) ? `${engine.indicativeRatePct.toFixed(2)}%` : 'WITHHELD'}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Grounded Output</span>
          <strong className="kpi-value">{engine?.grounded ? 'YES' : 'NO'}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Completeness</span>
          <strong className="kpi-value">{Number.isFinite(engine?.completenessScore) ? `${engine.completenessScore.toFixed(1)}%` : 'N/A'}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Extraction Confidence</span>
          <strong className="kpi-value">{Number.isFinite(engine?.confidence) ? `${(engine.confidence * 100).toFixed(0)}%` : 'N/A'}</strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Internal Rating</span>
          <strong className="kpi-value">{engine?.internalRating || 'N/A'}</strong>
        </div>
      </div>

      <div className="risk-top-grid">
        <div className="card">
          <h3>Guardrails and Explainability</h3>
          {isReady ? null : <p className="muted-note">Recommendation is withheld until quality gates are met.</p>}
          <ul className="insight-list">
            {(engine?.guardrailReasons || []).length === 0 ? (
              <li>No active guardrail violations.</li>
            ) : (
              (engine?.guardrailReasons || []).map((r, idx) => <li key={`${r}-${idx}`}>{r}</li>)
            )}
          </ul>
        </div>

        <div className="card">
          <h3>Recommendation Actions</h3>
          <ul className="insight-list">
            {(engine?.recommendations || []).length === 0 ? (
              <li>No recommendation actions available yet.</li>
            ) : (
              (engine?.recommendations || []).map((r, idx) => <li key={`${r}-${idx}`}>{r}</li>)
            )}
          </ul>
        </div>
      </div>

      <div className="risk-top-grid">
        <div className="card">
          <h3>Covenants</h3>
          <ul className="insight-list">
            {(engine?.covenants || []).length === 0 ? (
              <li>No covenants generated.</li>
            ) : (
              (engine?.covenants || []).map((c, idx) => <li key={`${c}-${idx}`}>{c}</li>)
            )}
          </ul>
        </div>
        <div className="card">
          <h3>Decision Rationale</h3>
          <ul className="insight-list">
            {(engine?.rationale || []).length === 0 ? (
              <li>No rationale generated.</li>
            ) : (
              (engine?.rationale || []).map((r, idx) => <li key={`${r}-${idx}`}>{r}</li>)
            )}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Evidence Ledger (No Mock Data)</h3>
        <div className="list-table">
          {(engine?.evidence || []).map((e) => (
            <div key={e.key} className="list-row">
              <span>{e.label}</span>
              <span className={e.available ? 'chip chip-ok' : 'chip chip-warning'}>{e.available ? e.value : 'Missing'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
