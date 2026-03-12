import React from 'react';

export default function IntroPage({ onGetStarted }) {
  const spotlightFeatures = [
    {
      title: 'Everything in one place',
      body: 'Bring statements, filings, and reports together in a single view so your team starts from a complete picture.',
    },
    {
      title: 'Faster case understanding',
      body: 'Get clear summaries in plain language so relationship teams and approvers can align quickly.',
    },
    {
      title: 'Decisions you can explain',
      body: 'Every recommendation comes with context, making it easier to communicate with committees and customers.',
    },
  ];

  const productTiles = [
    {
      title: 'Smart Intake',
      body: 'Upload multiple files at once and keep your case pack organized from day one.',
      badge: 'Multi-file ready',
    },
    {
      title: 'Research Workspace',
      body: 'See connected entities, promoter context, and external signals in one storytelling canvas.',
      badge: '360 visibility',
    },
    {
      title: 'Decision Studio',
      body: 'Move from findings to action with structured recommendations and collaborative review steps.',
      badge: 'Committee-friendly',
    },
    {
      title: 'Portfolio View',
      body: 'Track concentration, movement, and early drift signals across your active book.',
      badge: 'Always in control',
    },
    {
      title: 'Knowledge Hub',
      body: 'Ask questions and get focused answers grounded in your own uploaded context.',
      badge: 'Instant answers',
    },
    {
      title: 'History & Settings',
      body: 'Revisit earlier assessments and keep workspace behavior consistent across teams.',
      badge: 'Operational clarity',
    },
  ];

  const moments = [
    'Upload your case pack once',
    'Get a clear story in minutes',
    'Move forward with confidence',
  ];

  return (
    <section className="intro-page">
      <div className="intro-hero card">
        <p className="intro-kicker">Credere AI</p>
        <h1>Built to make credit decisions feel effortless.</h1>
        <p>
          A modern workspace for banking teams to review documents, understand businesses, and take confident credit decisions with speed.
        </p>

        <div className="intro-metrics">
          {spotlightFeatures.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>

        <div className="intro-actions">
          <button onClick={onGetStarted}>Get Started</button>
        </div>
      </div>

      <div className="intro-story card">
        <p className="intro-kicker">How It Feels</p>
        <h2>From intake to approval, without the usual friction.</h2>
        <div className="intro-story-lane">
          {moments.map((step, index) => (
            <div key={step} className="intro-story-step">
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="intro-grid intro-grid-rich">
        {productTiles.map((tile) => (
          <article key={tile.title} className="card intro-card intro-feature-card">
            <span className="intro-feature-badge">{tile.badge}</span>
            <h3>{tile.title}</h3>
            <p>{tile.body}</p>
          </article>
        ))}
      </div>

      <div className="intro-bottom card">
        <div>
          <p className="intro-kicker">Why Teams Choose Credere</p>
          <h3>Elegant experience. Serious outcomes.</h3>
          <p>
            Designed for daily use by credit managers, analysts, and leadership teams who want clarity, consistency, and speed.
          </p>
        </div>
        <button onClick={onGetStarted}>Enter Workspace</button>
      </div>
    </section>
  );
}
