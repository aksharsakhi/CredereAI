import React, { useEffect, useState } from 'react';
import { getAnalysisHistory, getHistoryById } from '../api/client';

export default function HistoryPanel() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const list = await getAnalysisHistory(50);
      setItems(list || []);
      if (list?.length && !selected) {
        const detail = await getHistoryById(list[0].id);
        setSelected(detail);
      }
    } catch (err) {
      setError(err.message || 'Unable to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openRecord(id) {
    setLoading(true);
    setError('');
    try {
      const detail = await getHistoryById(id);
      setSelected(detail);
    } catch (err) {
      setError(err.message || 'Unable to load history record');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Analysis History</h2>
      <div className="history-layout">
        <div className="card">
          <div className="ratio-head">
            <h3>Recent Runs</h3>
            <button className="secondary" onClick={refresh} disabled={loading}>
              Refresh
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}
          {!items.length ? <p>No saved analysis yet. Run a full Financial Intake analysis first.</p> : null}

          <div className="history-list">
            {items.map((item) => (
              <button key={item.id} className="history-item" type="button" onClick={() => openRecord(item.id)}>
                <strong>{item.companyName || 'Unknown Company'}</strong>
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown time'}</span>
                <div className="chip-wrap">
                  <span className="chip chip-unknown">Decision: {item.decision || 'N/A'}</span>
                  <span className="chip chip-warning">Risk: {item.riskBand || 'N/A'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Record Detail</h3>
          {!selected ? <p>Select a record to view details.</p> : null}
          {selected ? (
            <>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Company</span>
                  <strong className="kpi-value kpi-compact">{selected.companyName || 'N/A'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Decision</span>
                  <strong className="kpi-value">{selected.decision || 'N/A'}</strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Completeness</span>
                  <strong className="kpi-value">
                    {Number.isFinite(selected.completenessScore) ? `${selected.completenessScore.toFixed(1)}%` : 'N/A'}
                  </strong>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Confidence</span>
                  <strong className="kpi-value">
                    {Number.isFinite(selected.confidence) ? `${(selected.confidence * 100).toFixed(0)}%` : 'N/A'}
                  </strong>
                </div>
              </div>

              <p>{selected.summary || 'No summary available.'}</p>
              <pre>{JSON.stringify(selected.snapshot || {}, null, 2)}</pre>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
