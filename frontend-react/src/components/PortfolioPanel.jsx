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
      const payload = await getPortfolioData();
      setData({
        segments: Array.isArray(payload?.segments) ? payload.segments : [],
        activePipeline: Array.isArray(payload?.activePipeline) ? payload.activePipeline : [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const segments = useMemo(() => {
    if (Array.isArray(data?.segments) && data.segments.length > 0) return data.segments;
    // Fallback if backend returns empty but we want some UI structure
    return [
      { segmentId: 'all', label: 'Entire Portfolio', count: 0, totalOutstandingsCr: 0, avgRiskScore: 0, highRiskAlerts: 0, health: { healthyPct: 100, watchPct: 0, nplPct: 0 } }
    ];
  }, [data?.segments]);

  const currentData = useMemo(() => 
    segments.find(s => s.segmentId === activeSegment) || segments[0], 
  [activeSegment, segments]);

  const filteredPipeline = useMemo(() => {
    // In a real sophisticated version, we'd filter the pipeline from backend too, 
    // but here we just show all if 'all' is selected.
    return Array.isArray(data?.activePipeline) ? data.activePipeline : [];
  }, [data?.activePipeline, activeSegment]);

  const portfolioMix = useMemo(() => {
    const safeHealth = currentData?.health || {};
    return [
      { label: 'Healthy', value: Number(safeHealth.healthyPct) || 0, color: 'var(--ok)' },
      { label: 'Watch', value: Number(safeHealth.watchPct) || 0, color: 'var(--warn)' },
      { label: 'Impaired', value: Number(safeHealth.nplPct) || 0, color: 'var(--danger)' },
    ];
  }, [currentData]);

  const segmentComparison = useMemo(() => {
    const totalExposure = segments.reduce((sum, segment) => sum + (Number(segment.totalOutstandingsCr) || 0), 0) || 1;
    return segments.map((segment) => ({
      segmentId: segment.segmentId,
      label: segment.label,
      exposure: Number(segment.totalOutstandingsCr) || 0,
      sharePct: ((Number(segment.totalOutstandingsCr) || 0) / totalExposure) * 100,
      avgRiskScore: Number(segment.avgRiskScore) || 0,
      highRiskAlerts: Number(segment.highRiskAlerts) || 0,
      count: Number(segment.count) || 0,
    })).sort((a, b) => b.exposure - a.exposure);
  }, [segments]);

  const stageMix = useMemo(() => {
    return filteredPipeline.reduce((acc, item) => {
      const key = item?.stage || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [filteredPipeline]);

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
      <button className="secondary action-btn action-btn-inline" style={{marginTop: '1rem'}} onClick={fetchData}>Retry</button>
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
          <button className="secondary action-btn action-btn-inline">Risk Register (CSV)</button>
          <button className="primary action-btn action-btn-primary" onClick={fetchData}>Refresh Engine</button>
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

         <div style={{display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '20px', alignItems: 'center'}}>
          <PortfolioCompositionRing items={portfolioMix} />
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

      <div style={{display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', marginTop: '2rem'}}>
        <div className="card">
          <div className="module2-results-head">
            <h3>Segment Exposure Ladder</h3>
            <span className="chip chip-brand">{segmentComparison.length} live segments</span>
          </div>
          <div style={{display: 'grid', gap: '14px', marginTop: '16px'}}>
            {segmentComparison.map((segment) => (
              <div key={segment.segmentId} style={{display: 'grid', gap: '6px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px'}}>
                  <strong>{segment.label}</strong>
                  <span style={{color: 'var(--muted)'}}>₹ {segment.exposure.toLocaleString()} Cr</span>
                </div>
                <div style={{height: '10px', background: 'var(--bg-alt)', borderRadius: '999px', overflow: 'hidden'}}>
                  <div style={{height: '100%', width: `${Math.max(6, segment.sharePct)}%`, background: 'linear-gradient(90deg, var(--brand), var(--brand-2))', borderRadius: '999px'}} />
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px', color: 'var(--muted)'}}>
                  <span>{segment.sharePct.toFixed(1)}% of portfolio</span>
                  <span>Risk {segment.avgRiskScore.toFixed(1)} / 10 | Alerts {segment.highRiskAlerts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card glass-card">
          <div className="module2-results-head">
            <h3>Workflow Throughput</h3>
            <span className="chip chip-ok">Operational lens</span>
          </div>
          <ScoreBars
            data={Object.entries(stageMix).map(([label, value]) => [label, value])}
          />
          <div style={{marginTop: '16px', padding: '12px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '12px', lineHeight: 1.5}}>
            <strong>Readout:</strong> {filteredPipeline.length === 0 ? 'No active appraisal items are currently in motion.' : `${filteredPipeline.length} active appraisal item(s) are distributed across ${Object.keys(stageMix).length} workflow stage(s).`}
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop: '2rem'}}>
        <div className="module2-results-head">
          <h3>Segment Intelligence Table</h3>
          <span className="chip chip-unknown">Exposure vs risk</span>
        </div>
        <div className="list-table" style={{marginTop: '1rem'}}>
          <div className="list-row" style={{fontWeight: 700, background: 'var(--bg-alt)'}}>
            <span>Segment</span>
            <span>Accounts</span>
            <span>Exposure</span>
            <span>Share</span>
            <span>Avg Risk</span>
            <span>Alerts</span>
          </div>
          {segmentComparison.map((segment) => (
            <div key={`segment-row-${segment.segmentId}`} className="list-row">
              <span style={{fontWeight: 600}}>{segment.label}</span>
              <span>{segment.count}</span>
              <span>₹ {segment.exposure.toLocaleString()} Cr</span>
              <span>{segment.sharePct.toFixed(1)}%</span>
              <span>
                <span className="chip chip-unknown" style={{color: segment.avgRiskScore >= 7.5 ? 'var(--danger)' : segment.avgRiskScore >= 5 ? 'var(--warn)' : 'var(--ok)'}}>
                  {segment.avgRiskScore.toFixed(1)} / 10
                </span>
              </span>
              <span>{segment.highRiskAlerts}</span>
            </div>
          ))}
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

function PortfolioCompositionRing({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let currentOffset = 0;

  return (
    <div style={{display: 'grid', justifyItems: 'center', gap: '14px'}}>
      <div style={{position: 'relative', width: '220px', height: '220px'}}>
        <svg viewBox="0 0 220 220" style={{width: '100%', height: '100%'}}>
          <circle cx="110" cy="110" r="72" fill="none" stroke="var(--bg-alt)" strokeWidth="24" />
          {items.map((item) => {
            const segmentLength = (item.value / total) * 452.39;
            const dashOffset = 452.39 - currentOffset;
            currentOffset += segmentLength;
            return (
              <circle
                key={item.label}
                cx="110"
                cy="110"
                r="72"
                fill="none"
                stroke={item.color}
                strokeWidth="24"
                strokeDasharray={`${segmentLength} 452.39`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 110 110)"
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center'}}>
          <div>
            <strong style={{display: 'block', fontSize: '26px'}}>{Math.round(total)}%</strong>
            <span style={{fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Portfolio health mapped</span>
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gap: '8px', width: '100%'}}>
        {items.map((item) => (
          <div key={`mix-${item.label}`} style={{display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px'}}>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
              <span style={{width: '10px', height: '10px', borderRadius: '50%', background: item.color}} />
              {item.label}
            </span>
            <strong>{item.value.toFixed(0)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBars({ data }) {
  if (!data || data.length === 0) return <p className="muted-note" style={{margin: 0}}>No workflow metrics available.</p>;
  const max = Math.max(...data.map(([, value]) => Number(value) || 0), 1);

  return (
    <div style={{display: 'grid', gap: '12px', marginTop: '16px'}}>
      {data.map(([label, value]) => {
        const safeValue = Number(value) || 0;
        return (
          <div key={label} style={{display: 'grid', gap: '6px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
              <span style={{fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase'}}>{label}</span>
              <strong>{safeValue}</strong>
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
