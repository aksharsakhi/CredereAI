import React, { useEffect, useRef } from 'react';

const WORKFLOW_STEPS = [
  { icon: '📄', label: 'Upload Financials', desc: 'Ingest PDFs, DOC, DOCX borrower documents' },
  { icon: '📊', label: 'Financial IQ', desc: 'Auto-extract revenue, debt, ratios, completeness' },
  { icon: '🔎', label: 'Intelligence Scan', desc: 'Promoter, litigation, regulatory, network signals' },
  { icon: '⚖️', label: 'Risk Engine', desc: 'Evidence-grounded risk scoring & recommendations' },
  { icon: '📑', label: 'Decision Pack', desc: 'Committee-ready credit notes & action items' },
];

const MODULES = [
  {
    badge: 'Module 1',
    title: 'Financial IQ',
    desc: 'Automated financial document analysis.',
    items: ['Revenue extraction', 'Profit detection', 'Debt analysis', 'Liquidity ratios', 'Completeness checks', 'Cross-verification alerts'],
  },
  {
    badge: 'Module 2',
    title: 'Credit Intelligence',
    desc: 'External risk intelligence engine.',
    items: ['Promoter research', 'Litigation scans', 'Regulatory actions', 'Corporate network graphs', 'News & reputation signals'],
  },
  {
    badge: 'Module 3',
    title: 'Decision Studio',
    desc: 'Decision-ready outputs.',
    items: ['AI recommendations', 'Stress scenarios', 'Peer benchmarking', 'Credit committee notes'],
  },
];

const DIFFERENTIATORS = [
  { title: 'Evidence Grounded AI', desc: 'Every insight linked directly to financial documents.' },
  { title: 'Document Native Intelligence', desc: 'Built for real underwriting workflows, not generic chat.' },
  { title: 'External Risk Signals', desc: 'Promoter networks, litigation, regulatory signals — all automated.' },
  { title: 'Decision Ready Outputs', desc: 'Generate credit committee reports instantly from evidence.' },
];

const AUDIENCES = ['Credit Analysts', 'Commercial Banks', 'NBFCs', 'Private Debt Funds', 'Fintech Lenders'];

const CHAT_EXAMPLES = [
  { q: 'Is the borrower over-leveraged?', a: 'Debt-to-Equity is 2.3 — above the 1.5 threshold. High leverage risk flagged from FY23 Balance Sheet.' },
  { q: 'Show top financial risks', a: 'Top 3: (1) Declining operating margin, (2) Rising short-term debt, (3) GST mismatch detected.' },
  { q: 'What is the current ratio?', a: 'Current Ratio: 1.12 — slightly above minimum. Source: FY23 Financial Statement.' },
];

export default function IntroPage({ onGetStarted }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.hp-reveal'));
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.15 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  /* animated particle background */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const PARTICLE_COUNT = 60;
    const MAX_DIST = 140;

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.strokeStyle = 'rgba(59,147,210,0.08)';
      ctx.lineWidth = 0.7;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (Math.abs(dx) < MAX_DIST && Math.abs(dy) < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,147,210,0.25)'; ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    init(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div className="hp-root">
      <canvas ref={canvasRef} className="hp-particles" aria-hidden="true" />

      {/* Navbar */}
      <nav className="hp-nav">
        <div className="hp-nav-inner">
          <div className="hp-nav-brand">Credere AI</div>
          <div className="hp-nav-links">
            <a href="#workflow">Platform</a>
            <a href="#modules">Modules</a>
            <a href="#knowledge">Knowledge</a>
            <a href="#about">About</a>
          </div>
          <button className="hp-btn hp-btn-sm" onClick={onGetStarted}>Enter Workspace</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hp-hero">
        <div className="hp-hero-inner">
          <div className="hp-hero-badge">AI-Powered Credit Intelligence Platform</div>
          <h1>Faster, Safer<br />Lending Decisions</h1>
          <p className="hp-hero-sub">
            Upload financial documents, uncover hidden risks, analyze promoters,
            and generate evidence-backed credit recommendations — all in one workspace.
          </p>
          <div className="hp-hero-ctas">
            <button className="hp-btn hp-btn-primary" onClick={onGetStarted}>Enter Workspace</button>
            <button className="hp-btn hp-btn-ghost" onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Platform ↓
            </button>
          </div>
          <div className="hp-trust-row">
            <span>✔ Financial Document Analysis</span>
            <span>✔ Promoter & Litigation Intelligence</span>
            <span>✔ Evidence-Grounded AI Recommendations</span>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="hp-section hp-trust hp-reveal">
        <div className="hp-contain">
          <div className="hp-trust-grid">
            <div className="hp-trust-item"><strong>220 MB+</strong><span>Financial Report Support</span></div>
            <div className="hp-trust-item"><strong>5 Modules</strong><span>End-to-End Credit Workflow</span></div>
            <div className="hp-trust-item"><strong>AI Grounded</strong><span>Evidence-Linked Insights</span></div>
            <div className="hp-trust-item"><strong>Enterprise</strong><span>Built for Bank-Grade Use</span></div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="hp-section hp-reveal" id="workflow">
        <div className="hp-contain">
          <p className="hp-kicker">How It Works</p>
          <h2 className="hp-section-title">From Documents to Decisions in Minutes</h2>
          <div className="hp-workflow">
            {WORKFLOW_STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="hp-wf-step">
                  <span className="hp-wf-icon">{s.icon}</span>
                  <strong>{s.label}</strong>
                  <span className="hp-wf-desc">{s.desc}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <div className="hp-wf-arrow" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Product Modules */}
      <section className="hp-section hp-reveal" id="modules">
        <div className="hp-contain">
          <p className="hp-kicker">Core Modules</p>
          <h2 className="hp-section-title">Three Modules. One Unified Workspace.</h2>
          <div className="hp-modules-grid">
            {MODULES.map((m, i) => (
              <div className="hp-module-card" key={i}>
                <span className="hp-module-badge">{m.badge}</span>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
                <ul>{m.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Intelligence */}
      <section className="hp-section hp-section-alt hp-reveal">
        <div className="hp-contain">
          <p className="hp-kicker">Portfolio Intelligence</p>
          <h2 className="hp-section-title">Monitor Risk Across Your Entire Credit Portfolio</h2>
          <div className="hp-portfolio-grid">
            {['Pipeline Monitoring', 'Risk Alerts', 'Exposure Segmentation', 'Real-Time Analytics'].map((f, i) => (
              <div className="hp-portfolio-item" key={i}>
                <div className="hp-portfolio-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="hp-mock-dash">
            <div className="hp-mock-bar" style={{ width: '78%' }}><span>Corporate Loans</span><span>78%</span></div>
            <div className="hp-mock-bar" style={{ width: '54%' }}><span>MSME Exposure</span><span>54%</span></div>
            <div className="hp-mock-bar" style={{ width: '32%' }}><span>Infrastructure</span><span>32%</span></div>
            <div className="hp-mock-bar hp-mock-bar-warn" style={{ width: '18%' }}><span>High Risk</span><span>18%</span></div>
          </div>
        </div>
      </section>

      {/* AI Knowledge Hub */}
      <section className="hp-section hp-reveal" id="knowledge">
        <div className="hp-contain">
          <p className="hp-kicker">AI Knowledge Hub</p>
          <h2 className="hp-section-title">Ask Questions Directly to Your Credit Files</h2>
          <p className="hp-section-sub">Credere AI answers using grounded financial evidence — never hallucinated.</p>
          <div className="hp-chat-mock">
            {CHAT_EXAMPLES.map((c, i) => (
              <div className="hp-chat-pair" key={i}>
                <div className="hp-chat-q"><span className="hp-chat-avatar">You</span>{c.q}</div>
                <div className="hp-chat-a"><span className="hp-chat-avatar hp-chat-ai">AI</span>{c.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="hp-section hp-section-alt hp-reveal">
        <div className="hp-contain">
          <p className="hp-kicker">The Difference</p>
          <h2 className="hp-section-title">Before vs After Credere AI</h2>
          <div className="hp-compare">
            <div className="hp-compare-col hp-compare-before">
              <h4>Without Credere AI</h4>
              <ul>
                <li>Manual document reading</li>
                <li>Fragmented intelligence research</li>
                <li>Slow credit decisions</li>
                <li>Hidden risk signals</li>
                <li>Scattered audit trails</li>
              </ul>
            </div>
            <div className="hp-compare-col hp-compare-after">
              <h4>With Credere AI</h4>
              <ul>
                <li>Instant financial extraction</li>
                <li>Automated promoter intelligence</li>
                <li>Evidence-backed recommendations</li>
                <li>Proactive risk visibility</li>
                <li>Complete decision logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Credere AI */}
      <section className="hp-section hp-reveal" id="about">
        <div className="hp-contain">
          <p className="hp-kicker">Why Credere AI</p>
          <h2 className="hp-section-title">Built Different. Built for Credit.</h2>
          <div className="hp-diff-grid">
            {DIFFERENTIATORS.map((d, i) => (
              <div className="hp-diff-card" key={i}>
                <h4>{d.title}</h4>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="hp-section hp-section-alt hp-reveal">
        <div className="hp-contain hp-center">
          <p className="hp-kicker">Who It's For</p>
          <h2 className="hp-section-title">Purpose-Built for Lending Teams</h2>
          <div className="hp-audience-row">
            {AUDIENCES.map((a, i) => <span className="hp-audience-tag" key={i}>{a}</span>)}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="hp-section hp-cta-section hp-reveal">
        <div className="hp-contain hp-center">
          <h2>See Credere AI in Action</h2>
          <p className="hp-section-sub">
            Upload a sample borrower report and watch the platform generate a full credit intelligence analysis.
          </p>
          <div className="hp-hero-ctas">
            <button className="hp-btn hp-btn-primary" onClick={onGetStarted}>Launch Workspace</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-col">
            <strong>Credere AI</strong>
            <p>AI-powered credit intelligence platform</p>
          </div>
          <div className="hp-footer-col">
            <strong>Platform</strong>
            <a href="#modules">Financial IQ</a>
            <a href="#modules">Credit Intelligence</a>
            <a href="#modules">Decision Studio</a>
            <a href="#knowledge">Knowledge Hub</a>
          </div>
          <div className="hp-footer-col">
            <strong>Resources</strong>
            <a href="#workflow">Architecture</a>
            <a href="#about">About</a>
          </div>
        </div>
        <div className="hp-footer-bottom">© 2026 Credere AI</div>
      </footer>
    </div>
  );
}
