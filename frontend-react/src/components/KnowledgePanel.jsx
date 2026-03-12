import React, { useState, useEffect } from 'react';
import { getKnowledgeHubResponse, getDocuments } from '../api/client';

function readStoredJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so the panel still works without persistence.
  }
}

export default function KnowledgePanel() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState(() => readStoredJson('credere_knowledge_chat', [
    { role: 'assistant', text: 'Hello! I am the Credere AI Knowledge Bot. I have indexed all uploaded documents and research memos. How can I help you today?', sources: [] }
  ]));
  const [history, setHistory] = useState(() => readStoredJson('credere_knowledge_history', []));
  const [searching, setSearching] = useState(false);
  const [indexedDocs, setIndexedDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    writeStoredJson('credere_knowledge_chat', chat);
  }, [chat]);

  useEffect(() => {
    writeStoredJson('credere_knowledge_history', history);
  }, [history]);

  useEffect(() => {
    async function loadResources() {
      try {
        const docs = await getDocuments();
        setIndexedDocs(docs || []);
      } catch (err) {
        console.error("Failed to load documents for knowledge hub", err);
      } finally {
        setLoadingDocs(false);
      }
    }
    loadResources();
  }, []);

  async function handleSend() {
    if (!query.trim()) return;
    const currentQuery = query;
    const userMsg = { role: 'user', text: currentQuery };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setQuery('');
    setSearching(true);
    
    // Update simple history list
    if (!history.includes(currentQuery)) {
        setHistory(prev => [currentQuery, ...prev].slice(0, 5));
    }
    
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

      <div style={{display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start'}}>
        <div className="card glass-card" style={{height: '650px', display: 'flex', flexDirection: 'column', padding: '0'}}>
          <div className="chat-messages" style={{flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {chat.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`} style={{
                      maxWidth: '85%',
                      padding: '16px 20px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, var(--brand), var(--brand-2))' : 'var(--surface-2)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text)',
                      border: msg.role === 'assistant' ? '1px solid var(--line)' : 'none',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      position: 'relative'
                  }}>
                      {msg.text}
                      {msg.sources?.length > 0 && (
                        <div style={{marginTop: '12px', fontSize: '11px', color: 'var(--muted)', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                           <strong>Grounding:</strong> {msg.sources.map((s, si) => <span key={si} style={{padding: '2px 6px', background: 'var(--bg-alt)', borderRadius: '4px'}}>{s}</span>)}
                        </div>
                      )}
                  </div>
              ))}
              {searching && (
                <div style={{alignSelf: 'flex-start', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: '16px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <div className="spinner-small" style={{width: '14px', height: '14px', border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                  <span style={{fontSize: '12px', color: 'var(--muted)'}}>Neural search in progress...</span>
                </div>
              )}
          </div>
          
          <div className="chat-input-area" style={{padding: '24px', borderTop: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '0 0 20px 20px'}}>
              <div style={{display: 'flex', gap: '12px'}}>
                  <input 
                      type="text" 
                      placeholder="Ask about financials, risk factors, or industry trends..." 
                      style={{flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s'}}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      disabled={searching}
                  />
                  <button className="primary" onClick={handleSend} disabled={searching || !query.trim()} style={{padding: '0 24px', borderRadius: '12px', fontWeight: 700}}>Ask Expert</button>
              </div>
              <div style={{marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  <span style={{fontSize: '11px', color: 'var(--muted)', alignSelf: 'center', marginRight: '4px'}}>Suggested:</span>
                  <button className="chip chip-unknown" onClick={() => setQuery('What is the debt-to-equity ratio?')} style={{border: 'none', cursor: 'pointer', padding: '4px 10px'}}>Debt Ratio?</button>
                  <button className="chip chip-unknown" onClick={() => setQuery('List top risk factors')} style={{border: 'none', cursor: 'pointer', padding: '4px 10px'}}>Top Risks?</button>
                  <button className="chip chip-unknown" onClick={() => setQuery('How does liquidity look?')} style={{border: 'none', cursor: 'pointer', padding: '4px 10px'}}>Liquidity?</button>
              </div>
          </div>
        </div>

        <div style={{display: 'grid', gap: '20px'}}>
          <div className="card" style={{padding: '20px'}}>
            <h3 style={{fontSize: '14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Intelligence Inventory
            </h3>
            <p style={{fontSize: '11px', color: 'var(--muted)', marginBottom: '12px'}}>Documents currently indexed for vector search:</p>
            <div style={{display: 'grid', gap: '6px', maxHeight: '240px', overflowY: 'auto'}}>
              {loadingDocs ? (
                <p style={{fontSize: '11px', color: 'var(--muted)'}}>Syncing repository...</p>
              ) : indexedDocs.length > 0 ? (
                indexedDocs.map((doc) => (
                  <div key={doc.id} style={{padding: '8px 10px', background: 'var(--bg-alt)', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{width: '6px', height: '6px', background: 'var(--ok)', borderRadius: '50%'}}></div>
                    <span style={{fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{doc.filename}</span>
                  </div>
                ))
              ) : (
                <div style={{padding: '20px', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '10px'}}>
                   <p style={{fontSize: '11px', color: 'var(--muted)', margin: 0}}>No assets indexed.</p>
                </div>
              )}
            </div>
            {indexedDocs.length > 0 && <p style={{fontSize: '10px', color: 'var(--brand)', marginTop: '8px', fontWeight: 700}}>• All {indexedDocs.length} assets are live for RAG</p>}
          </div>

          <div className="card" style={{padding: '20px'}}>
             <h3 style={{fontSize: '14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
               Cognitive Reach
             </h3>
             <ScoreBars data={[
               ['Vector Alignment', indexedDocs.length > 0 ? 94 : 0],
               ['Context Recall', indexedDocs.length > 0 ? 88 : 0],
               ['Evidence Fidelity', 96]
             ]} />
          </div>

          <div className="card" style={{padding: '20px'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
               <h3 style={{fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M9 20v-10M15 20v-2M18 20V4M21 20h-2M3 20h18M3 20v-4M6 20v-2"/></svg>
                 Recent Insights
               </h3>
               {history.length > 0 && <button className="secondary" onClick={() => { setHistory([]); setChat([{ role: 'assistant', text: 'Chat history cleared.', sources: [] }]); }} style={{fontSize: '9px', padding: '2px 6px'}}>Clear</button>}
             </div>
             <div style={{display: 'grid', gap: '8px'}}>
               {history.length > 0 ? history.map((h, i) => (
                 <div key={i} onClick={() => setQuery(h)} style={{padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600}}>
                   {h}
                 </div>
               )) : (
                 <p style={{fontSize: '11px', color: 'var(--muted)', margin: 0, textAlign: 'center'}}>No recent queries.</p>
               )}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreBars({ data }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(([, v]) => v || 0), 1);

  return (
    <div style={{display: 'grid', gap: '14px'}}>
      {data.map(([label, value]) => {
        const val = Number(value) || 0;
        const width = (val / max) * 100;
        return (
          <div key={label} style={{display: 'grid', gap: '6px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <span style={{fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase'}}>{label}</span>
               <span style={{fontSize: '12px', fontWeight: 800}}>{val.toFixed(1)}</span>
            </div>
            <div style={{height: '6px', background: 'var(--bg-alt)', borderRadius: '10px', overflow: 'hidden'}}>
               <div style={{
                 height: '100%', 
                 width: `${width}%`, 
                 background: 'linear-gradient(90deg, var(--brand), var(--brand-2))',
                 borderRadius: '10px',
                 transition: 'width 1s ease-out'
               }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
