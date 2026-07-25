import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState('trades');
  const [capitalInitial] = useState(1000);

  // Sauvegarde automatique
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('tj_trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [retraits, setRetraits] = useState(() => {
    const saved = localStorage.getItem('tj_retraits');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tj_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('tj_retraits', JSON.stringify(retraits));
  }, [retraits]);

  // Formulaires
  const [tradeForm, setTradeForm] = useState({ pair: '', resultPnl: '', date: '' });
  const [retraitForm, setRetraitForm] = useState({ montant: '', date: '', note: '' });

  const handleAddTrade = (e) => {
    e.preventDefault();
    if (!tradeForm.resultPnl || !tradeForm.date) return;
    setTrades(prev => [...prev, {
      id: Date.now(),
      pair: tradeForm.pair || 'TRADE',
      resultPnl: parseFloat(tradeForm.resultPnl),
      date: tradeForm.date
    }]);
    setTradeForm({ pair: '', resultPnl: '', date: '' });
  };

  const handleAddRetrait = (e) => {
    e.preventDefault();
    if (!retraitForm.montant || !retraitForm.date) return;
    setRetraits(prev => [...prev, {
      id: Date.now(),
      montant: parseFloat(retraitForm.montant),
      date: retraitForm.date,
      note: retraitForm.note
    }]);
    setRetraitForm({ montant: '', date: '', note: '' });
  };

  const deleteTrade = (id) => setTrades(prev => prev.filter(t => t.id !== id));
  const deleteRetrait = (id) => setRetraits(prev => prev.filter(r => r.id !== id));

  // Calculs
  const totalPnlTrades = useMemo(() => trades.reduce((acc, t) => acc + (t.resultPnl || 0), 0), [trades]);
  const totalRetraits = useMemo(() => retraits.reduce((acc, r) => acc + (r.montant || 0), 0), [retraits]);
  const soldeActuel = capitalInitial + totalPnlTrades - totalRetraits;

  const equityData = useMemo(() => {
    const combined = [
      ...trades.map(t => ({ date: t.date, impact: t.resultPnl })),
      ...retraits.map(r => ({ date: r.date, impact: -r.montant }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let current = capitalInitial;
    return combined.map(item => {
      current += item.impact;
      return { date: item.date, solde: current };
    });
  }, [trades, retraits, capitalInitial]);

  // Styles Inline de secours
  const styles = {
    container: { backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', marginBottom: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    metricBox: { backgroundColor: '#0f172a', border: '1px solid #334155', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', minWidth: '120px' },
    input: { width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' },
    btnPrimary: { width: '100%', backgroundColor: '#10b981', color: '#090d16', fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
    btnAmber: { width: '100%', backgroundColor: '#f59e0b', color: '#090d16', fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
    tabBtn: (active) => ({
      padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginRight: '8px',
      backgroundColor: active ? '#10b981' : '#1e293b', color: active ? '#090d16' : '#94a3b8'
    }),
    tabBtnAmber: (active) => ({
      padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
      backgroundColor: active ? '#f59e0b' : '#1e293b', color: active ? '#090d16' : '#94a3b8'
    }),
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #334155' }
  };

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ ...styles.card, ...styles.header }}>
          <div>
            <h1 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>Journal de Trading</h1>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>Gestion des trades & retraits</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={styles.metricBox}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>P&L Net</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: totalPnlTrades >= 0 ? '#10b981' : '#f43f5e' }}>
                {totalPnlTrades >= 0 ? `+${totalPnlTrades.toFixed(2)}` : totalPnlTrades.toFixed(2)} €
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Retraits</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                -{totalRetraits.toFixed(2)} €
              </span>
            </div>
            <div style={styles.metricBox}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Solde Réel</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                {soldeActuel.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        {/* ONGLETS */}
        <div style={{ marginBottom: '16px' }}>
          <button style={styles.tabBtn(activeTab === 'trades')} onClick={() => setActiveTab('trades')}>
            📊 Trades ({trades.length})
          </button>
          <button style={styles.tabBtnAmber(activeTab === 'retraits')} onClick={() => setActiveTab('retraits')}>
            💸 Retraits ({retraits.length})
          </button>
        </div>

        {/* CONTENU ONGLETS */}
        {activeTab === 'trades' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <form onSubmit={handleAddTrade} style={styles.card}>
              <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Nouveau Trade</h3>
              <input style={styles.input} type="text" placeholder="Paire (ex: GOLD, EURUSD)" value={tradeForm.pair} onChange={e => setTradeForm({...tradeForm, pair: e.target.value})} />
              <input style={styles.input} type="number" step="any" placeholder="Gain ou Perte (€)" value={tradeForm.resultPnl} onChange={e => setTradeForm({...tradeForm, resultPnl: e.target.value})} />
              <input style={styles.input} type="date" value={tradeForm.date} onChange={e => setTradeForm({...tradeForm, date: e.target.value})} />
              <button style={styles.btnPrimary} type="submit">Ajouter Trade</button>
            </form>

            <div style={styles.card}>
              <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Historique Trades</h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {trades.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>Aucun trade enregistré.</p>}
                {trades.map(t => (
                  <div key={t.id} style={styles.row}>
                    <div>
                      <strong style={{ color: '#fff', marginRight: '8px' }}>{t.pair}</strong>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{t.date}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold', marginRight: '12px', color: t.resultPnl >= 0 ? '#10b981' : '#f43f5e' }}>
                        {t.resultPnl >= 0 ? `+${t.resultPnl}` : t.resultPnl} €
                      </span>
                      <button onClick={() => deleteTrade(t.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <form onSubmit={handleAddRetrait} style={styles.card}>
              <h3 style={{ marginTop: 0, color: '#f59e0b' }}>Nouveau Retrait</h3>
              <input style={styles.input} type="number" step="any" placeholder="Montant (€)" value={retraitForm.montant} onChange={e => setRetraitForm({...retraitForm, montant: e.target.value})} />
              <input style={styles.input} type="date" value={retraitForm.date} onChange={e => setRetraitForm({...retraitForm, date: e.target.value})} />
              <input style={styles.input} type="text" placeholder="Note (Optionnel)" value={retraitForm.note} onChange={e => setRetraitForm({...retraitForm, note: e.target.value})} />
              <button style={styles.btnAmber} type="submit">Valider Retrait</button>
            </form>

            <div style={styles.card}>
              <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Historique Retraits</h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {retraits.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>Aucun retrait effectué.</p>}
                {retraits.map(r => (
                  <div key={r.id} style={{ ...styles.row, borderColor: '#f59e0b33' }}>
                    <div>
                      <strong style={{ color: '#f59e0b', marginRight: '8px' }}>Retrait</strong>
                      {r.note && <span style={{ color: '#94a3b8', fontSize: '12px', marginRight: '8px' }}>({r.note})</span>}
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{r.date}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold', marginRight: '12px', color: '#f59e0b' }}>-{r.montant} €</span>
                      <button onClick={() => deleteRetrait(r.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GRAPHIQUE */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Évolution du Solde Réel</h3>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData.length > 0 ? equityData : [{ date: 'Initial', solde: capitalInitial }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Line type="monotone" dataKey="solde" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
