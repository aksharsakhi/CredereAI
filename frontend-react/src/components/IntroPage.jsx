import React, { useEffect } from 'react';

export default function IntroPage({ onGetStarted }) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.intro-reveal'));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.22 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="intro-page intro-apple-page">
      <div className="intro-scroll-block intro-brand-block card">
        <div className="intro-brand-mark" aria-hidden="true">C</div>
        <p className="intro-kicker">Credere AI</p>
        <h1>Clarity for every credit decision.</h1>
        <p>
          Beautifully simple workspace for teams who want to move from files to final decisions with confidence.
        </p>
        <div className="intro-actions">
          <button onClick={onGetStarted}>Enter Workspace</button>
        </div>
      </div>

      <article className="intro-scroll-block intro-reveal card intro-stage-block">
        <p className="intro-kicker">One Smooth Flow</p>
        <h2>Start simple. Stay in control.</h2>
        <div className="intro-stage-lane">
          <div>
            <strong>Bring everything in</strong>
            <span>Collect your important documents in one place.</span>
          </div>
          <div>
            <strong>See the full story</strong>
            <span>Get instant context and key highlights for each case.</span>
          </div>
          <div>
            <strong>Decide with confidence</strong>
            <span>Move forward with clear recommendations and rationale.</span>
          </div>
        </div>
      </article>

      <article className="intro-scroll-block intro-reveal card intro-feature-stage">
        <p className="intro-kicker">Core Features</p>
        <h2>Everything your team needs, beautifully connected.</h2>
        <div className="intro-grid intro-grid-rich">
          <div className="intro-feature-card">
            <span className="intro-feature-badge">Smart Intake</span>
            <h3>Upload multiple files at once</h3>
            <p>Keep annual reports, statements, and supporting documents together from day one.</p>
          </div>
          <div className="intro-feature-card">
            <span className="intro-feature-badge">Research</span>
            <h3>Explore connected insights</h3>
            <p>Understand relationships, context, and signals without jumping across tools.</p>
          </div>
          <div className="intro-feature-card">
            <span className="intro-feature-badge">Decision Studio</span>
            <h3>Move from review to action</h3>
            <p>Capture recommendations and next steps in a format teams can trust.</p>
          </div>
          <div className="intro-feature-card">
            <span className="intro-feature-badge">Portfolio</span>
            <h3>See the bigger picture</h3>
            <p>Track movement and exposure trends across your active business book.</p>
          </div>
          <div className="intro-feature-card">
            <span className="intro-feature-badge">Knowledge Hub</span>
            <h3>Ask and get focused answers</h3>
            <p>Get quick, relevant responses grounded in your own case context.</p>
          </div>
          <div className="intro-feature-card">
            <span className="intro-feature-badge">History</span>
            <h3>Always audit ready</h3>
            <p>Revisit previous assessments and maintain continuity across teams.</p>
          </div>
        </div>
      </article>

      <article className="intro-scroll-block intro-reveal card intro-bottom">
        <div>
          <p className="intro-kicker">Final Step</p>
          <h3>Simple to start. Powerful when you scale.</h3>
          <p>
            Built for daily use by analysts, managers, and leadership teams who value speed, consistency, and confidence.
          </p>
        </div>
        <button onClick={onGetStarted}>Get Started</button>
      </article>
    </section>
  );
}
