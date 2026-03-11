import React, { useState, useEffect, useMemo } from 'react';
import { getPortfolioData } from '../api/client';

export default function PortfolioPanel() {
  const [activeSegment, setActiveSegment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ segments: [], activePipeline: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const data = await getPortfolioData();
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const segments = useMemo(() => {
    if (data.segments.length > 0) return data.segments;
    // Fallback if backend returns empty but we want some UI structure
    return [
      { segmentId: 'all', label: 'Entire Portfolio', count: 0, totalOutstandingsCr: 0, avgRiskScore: 0, highRiskAlerts: 0, health: { healthyPct: 100, watchPct: 0, nplPct: 0 } }
    ];
  }, [data.segments]);

  const currentData = useMemo(() => 
    segments.find(s => s.segmentId === activeSegment) || segments[0], 
  [activeSegment, segments]);

  const filteredPipeline = useMemo(() => {
    // In a real sophisticated version, we'd filter the pipeline from backend too, 
    // but here we just show all if 'all' is selected.
    return data.activePipeline || [];
  }, [data.activePipeline, activeSegment]);

  if (loading) return (
    <div className="module2-empty-state">
      <div className="spinner" />
      <p>Analyzing portfolio concentration...</p>
    </div>
  );

  if (error) return (
    <div className="module2-empty-state">
      <h4 className="error">Analytics Offline</h4>
      <p>{error}</p>
      <button className="secondary" style={{marginTop: '1rem'}} onClick={fetchData}>Retry</button>
    </div>
  );

  return (
    <section className="panel portfolio-panel">
      <div className="panel-header">
        <div>
          <h2>Portfolio Intelligence</h2>
          <p className="muted-note">Real-time aggregate exposure oversight and risk concentration mapping.</p>
        </div>
        <div className="actions">
          <button className="secondary">Risk Register (CSV)</button>
          <button className="primary" onClick={fetchData}>Refresh Engine</button>
        </div>
      </div>

      <div className="module2-tabs" style={{marginBottom: '2rem'}}>
        {segments.map(s => (
          <button
            key={s.segmentId}
            type="button"
            className={activeSegment === s.segmentId ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveSegment(s.segmentId)}
          >
            {s.label} <span className="tab-count">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <span className="kpi-label">Active Exposure</span>
          <strong className="kpi-value">₹ {currentData.totalOutstandingsCr.toLocaleString()} Cr</strong>
          <span className="kpi-trend pos">↑ Live Matrix</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Risk Proxy (1-10)</span>
          <strong className="kpi-value">{currentData.avgRiskScore}</strong>
          <div className="p-mini-bar"><div className="p-mini-fill" style={{width: `${(currentData.avgRiskScore / 10) * 100}%`, background: currentData.avgRiskScore > 7.5 ? 'var(--danger)' : 'var(--ok)'}} /></div>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Live Pipeline</span>
          <strong className="kpi-value">{filteredPipeline.length}</strong>
          <span className="muted-note">Active appraisals</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Aggregated Alerts</span>
          <strong className="kpi-value" style={{color: currentData.highRiskAlerts > 0 ? 'var(--danger)' : 'var(--text)'}}>{currentData.highRiskAlerts}</strong>
          <span className="muted-note">Anomalies detected</span>
        </div>
      </div>

      <div className="studio-grid-2" style={{marginTop: '2rem'}}>
        <div className="card glass-card">
          <div className="module2-results-head">
            <h3>Asset Quality Distribution</h3>
            <span className="chip chip-ok">Live Confidence Matrix</span>
          </div>
          <p className="muted-note" style={{marginBottom: '1.5rem'}}>Composition based on extraction validation and scoring.</p>
          
          <div className="health-viz-premium" style={{display: 'grid', gap: '1.5rem'}}>
             <div className="metric-row">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span className="metric-label">Healthy (Standard Assets)</span>
                    <strong>{currentData.health.healthyPct}%</strong>
                </div>
                <div className="metric-progress"><div className="metric-p-fill" style={{width: `${currentData.health.healthyPct}%`, background: 'var(--ok)'}} /></div>
             </div>
             <div className="metric-row">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span className="metric-label">Watchlist (SMA-1/2)</span>
                    <strong>{currentData.health.watchPct}%</strong>
                </div>
                <div className="metric-progress"><div className="metric-p-fill" style={{width: `${currentData.health.watchPct}%`, background: 'var(--warn)'}} /></div>
             </div>
             <div className="metric-row">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span className="metric-label">Impaired (NPL)</span>
                    <strong>{currentData.health.nplPct}%</strong>
                </div>
                <div className="metric-progress"><div className="metric-p-fill" style={{width: `${currentData.health.nplPct}%`, background: 'var(--danger)'}} /></div>
             </div>
          </div>
        </div>

        <div className="card">
          <h3>Concentration Intelligence</h3>
          <p className="muted-note">Exposure limits and entity-wise concentration risks.</p>
          
          <div className="insight-grid" style={{marginTop: '1.5rem', display: 'grid', gap: '1rem'}}>
             <div className="card secondary-card" style={{padding: '12px', borderLeft: '4px solid var(--brand)'}}>
                <strong style={{fontSize: '12px', textTransform: 'uppercase', color: 'var(--brand)'}}>Top Exposure Group</strong>
                <p style={{margin: '4px 0', fontSize: '14px'}}>Manufacturing remains the anchor segment with dominant corporate outstandings.</p>
             </div>
             <div className="card secondary-card" style={{padding: '12px', borderLeft: '4px solid var(--warn)'}}>
                <strong style={{fontSize: '12px', textTransform: 'uppercase', color: 'var(--warn)'}}>Liquidity Signal</strong>
                <p style={{margin: '4px 0', fontSize: '14px'}}>Utilization rates tracked against benchmark pricing thresholds.</p>
             </div>
          </div>
          
          <div style={{marginTop: '2rem', padding: '1rem', background: 'var(--bg-alt)', borderRadius: '12px'}}>
             <h4 style={{fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px'}}>Market Outlook</h4>
             <p style={{fontSize: '13px', lineHeight: '1.5'}}>
                Rising benchmark rates impact debt-servicing for the <strong>{currentData.label}</strong> segment. 
                Maintain DSCR buffers of &gt;1.5x for all current appraisals.
             </p>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop: '2rem'}}>
        <div className="module2-results-head">
          <h3>Active Appraisal Workflow</h3>
          <span className="chip chip-unknown">{filteredPipeline.length} Entities</span>
        </div>
        <div className="list-table" style={{marginTop: '1.5rem'}}>
           <div className="list-row" style={{fontWeight: 700, borderBottom: '2px solid var(--line)', paddingBottom: '12px'}}>
              <span>Entity Name</span>
              <span>Proxy Exposure</span>
              <span>AI Confidence</span>
              <span>Stage</span>
           </div>
           {filteredPipeline.length === 0 ? (
             <div className="list-row" style={{justifyContent: 'center', padding: '40px'}}><p className="muted-note">No active appraisals in this segment.</p></div>
           ) : (
             filteredPipeline.map((item, idx) => (
               <div key={idx} className="list-row" style={{animation: `fadeIn 0.3s ease forwards ${idx * 0.1}s`}}>
                  <span style={{fontWeight: 600}}>{item.companyName}</span>
                  <span>₹ {item.exposureCr.toFixed(1)} Cr</span>
                  <span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                       <div className="metric-progress" style={{width: '60px', height: '6px', margin: '0'}}><div className="metric-p-fill" style={{width: `${item.confidence}%`}} /></div>
                       <span style={{fontSize: '12px'}}>{item.confidence}%</span>
                    </div>
                  </span>
                  <span className={`chip chip-unknown`}>
                    {item.stage}
                  </span>
               </div>
             ))
           )}
        </div>
      </div>
    </section>
  );
}
