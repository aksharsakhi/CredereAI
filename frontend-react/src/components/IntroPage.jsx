import React from 'react';

export default function IntroPage({ onGetStarted }) {
  return (
    <section className="intro-page">
      <div className="intro-hero card">
        <p className="intro-kicker">Credere AI</p>
        <h1>Credit Intelligence Platform for Real-World Banks</h1>
        <p>
          A professional-grade Credit Intelligence platform for banks and NBFCs. Credere AI acts as a digital credit
          analyst that reads complex files, hunts fraud signals, and delivers explainable risk decisions.
        </p>
        <div className="intro-metrics">
          <div>
            <strong>Hybrid Intelligence</strong>
            <span>Deterministic parsers + LLM extraction + reliability guards</span>
          </div>
          <div>
            <strong>Fraud Signals</strong>
            <span>GST vs bank mismatch, circular trading indicators, risk alerts</span>
          </div>
          <div>
            <strong>Policy-Ready</strong>
            <span>Conservative underwriting gates and manual-review routing</span>
          </div>
        </div>
        <div className="intro-actions">
          <button onClick={onGetStarted}>Get Started</button>
        </div>
      </div>

      <div className="intro-grid">
        <article className="card intro-card">
          <h3>Financial Intake</h3>
          <p>Parse annual reports, GST filings, and bank statements with hybrid parser + LLM extraction.</p>
        </article>
        <article className="card intro-card">
          <h3>Credit Intelligence</h3>
          <p>Investigate promoters, litigations, and external news while integrating field due diligence notes.</p>
        </article>
        <article className="card intro-card">
          <h3>Decision Studio</h3>
          <p>Generate CAM-ready recommendations with transparent risk scoring, limit, and pricing rationale.</p>
        </article>
      </div>
    </section>
  );
}
