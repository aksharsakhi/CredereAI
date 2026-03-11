import React, { useState } from 'react';
import { getKnowledgeHubResponse } from '../api/client';

export default function KnowledgePanel() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([
    { role: 'assistant', text: 'Hello! I am the Credere AI Knowledge Bot. I have indexed all uploaded documents and research memos. How can I help you today?', sources: [] }
  ]);
  const [searching, setSearching] = useState(false);

  async function handleSend() {
    if (!query.trim()) return;
    const currentQuery = query;
    const userMsg = { role: 'user', text: currentQuery };
    setChat([...chat, userMsg]);
    setQuery('');
    setSearching(true);
    
    try {
      const data = await getKnowledgeHubResponse(currentQuery);
      setChat(prev => [...prev, { 
        role: 'assistant', 
        text: data.answer, 
        sources: data.sources || [] 
      }]);
    } catch (err) {
      setChat(prev => [...prev, { 
        role: 'assistant', 
        text: "Connection error: " + err.message 
      }]);
    } finally {
      setSearching(false);
    }
  }

  const latestSources = chat.filter(m => m.role === 'assistant' && m.sources?.length > 0).slice(-1)[0]?.sources || [];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>AI Knowledge Hub</h2>
          <p className="muted-note">Conversational intelligence grounded in the entire document repository.</p>
        </div>
        <div className="actions">
            <span className="chip chip-ok" style={{padding: '6px 12px'}}>Connected to: Financial Index</span>
        </div>
      </div>

      <div className="card glass-card" style={{height: '600px', display: 'flex', flexDirection: 'column', padding: '0'}}>
        <div className="chat-messages" style={{flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {chat.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`} style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? 'var(--brand)' : 'var(--bg-alt)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text)',
                    border: msg.role === 'assistant' ? '1px solid var(--line)' : 'none'
                }}>
                    {msg.text}
                    {msg.sources?.length > 0 && (
                      <div style={{marginTop: '8px', fontSize: '11px', color: 'var(--muted)', paddingTop: '8px', borderTop: '1px solid var(--line)'}}>
                         Sources: {msg.sources.join(', ')}
                      </div>
                    )}
                </div>
            ))}
            {searching && <div className="muted-note" style={{fontSize: '12px', padding: '10px'}}>AI is scouring documents and generating response...</div>}
        </div>
        
        <div className="chat-input-area" style={{padding: '20px', borderTop: '1px solid var(--line)', background: 'var(--surface)'}}>
            <div style={{display: 'flex', gap: '12px'}}>
                <input 
                    type="text" 
                    placeholder="Ask about financials, risk factors, or industry trends..." 
                    style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)'}}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={searching}
                />
                <button className="primary" onClick={handleSend} disabled={searching || !query.trim()}>Ask Expert</button>
            </div>
            <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                <button className="chip chip-unknown" onClick={() => setQuery('What is the debt-to-equity ratio?')} style={{border: 'none', cursor: 'pointer'}}>Debt Ratio?</button>
                <button className="chip chip-unknown" onClick={() => setQuery('List top risk factors')} style={{border: 'none', cursor: 'pointer'}}>Top Risks?</button>
                <button className="chip chip-unknown" onClick={() => setQuery('How does liquidity look?')} style={{border: 'none', cursor: 'pointer'}}>Trade cycles?</button>
            </div>
        </div>
      </div>

      <div className="card stage-card" style={{marginTop: '2rem'}}>
         <h3>Context Sources</h3>
         <p className="muted-note">The current intelligence is grounded in these primary assets:</p>
         <div className="chip-wrap" style={{marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {latestSources.length > 0 ? latestSources.map((s, i) => (
              <span key={i} className="chip chip-ok">{s}</span>
            )) : <span className="chip chip-unknown">No documents indexed yet</span>}
         </div>
      </div>
    </section>
  );
}
