import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TradingJournal() {
  const [activeTab, setActiveTab] = useState('trades'); // 'trades' | 'retraits'
  const [capitalInitial, setCapitalInitial] = useState(1000); // À adapter selon ton capital
  
  // États pour les formulaires
  const [trades, setTrades] = useState([]);
  const [retraits, setRetraits] = useState([]);

  // Formulaire Trade
  const [tradeForm, setTradeForm] = useState({ pair: '', type: 'BUY', resultPnl: '', date: '' });
  // Formulaire Retrait
  const [retraitForm, setRetraitForm] = useState({ montant: '', date: '', note: '' });

  // Ajouter un Trade
  const handleAddTrade = (e) => {
    e.preventDefault();
    if (!tradeForm.resultPnl || !tradeForm.date) return;
    setTrades([...trades, { ...tradeForm, id: Date.now(), resultPnl: parseFloat(tradeForm.resultPnl) }]);
    setTradeForm({ pair: '', type: 'BUY', resultPnl: '', date: '' });
  };

  // Ajouter un Retrait
  const handleAddRetrait = (e) => {
    e.preventDefault();
    if (!retraitForm.montant || !retraitForm.date) return;
    setRetraits([...retraits, { ...retraitForm, id: Date.now(), montant: parseFloat(retraitForm.montant) }]);
    setRetraitForm({ montant: '', date: '', note: '' });
  };

  // Calculs financiers globaux
  const totalPnlTrades = useMemo(() => trades.reduce((acc, t) => acc + t.resultPnl, 0), [trades]);
  const totalRetraits = useMemo(() => retraits.reduce((acc, r) => acc + r.montant, 0), [retraits]);
  const soldeActuel = capitalInitial + totalPnlTrades - totalRetraits;

  // Construction de la courbe d'équité (triée par date)
  const equityData = useMemo(() => {
    const combined = [
      ...trades.map(t => ({ date: t.date, impact: t.resultPnl, type: 'TRADE' })),
      ...retraits.map(r => ({ date: r.date, impact: -r.montant, type: 'RETRAIT' }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let currentBalance = capitalInitial;
    return combined.map(item => {
      currentBalance += item.impact;
      return {
        date: item.date,
        solde: currentBalance,
        type: item.type
      };
    });
  }, [trades, retraits, capitalInitial]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER / METRICS */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Journal de Trading</h1>
            <p className="text-sm text-slate-400">Suivi des performances et de trésorerie</p>
          </div>
          
          <div className="flex gap-6 text-center">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-xs text-slate-400 block">P&L Trading Net</span>
              <span className={`text-lg font-bold ${totalPnlTrades >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {totalPnlTrades >= 0 ? `+${totalPnlTrades}` : totalPnlTrades} €
              </span>
            </div>
            
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Total Retraits</span>
              <span className="text-lg font-bold text-amber-400">
                -{totalRetraits} €
              </span>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Solde Réel Compte</span>
              <span className="text-lg font-bold text-white">
                {soldeActuel} €
              </span>
            </div>
          </div>
        </header>

        {/* ONGLETS NAVIGATION */}
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'trades' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📊 Trades
          </button>
          <button
            onClick={() => setActiveTab('retraits')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'retraits' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            💸 Retraits ({retraits.length})
          </button>
        </div>

        {/* CONTENU ONGLETS */}
        {activeTab === 'trades' ? (
          /* FORMULAIRE & LISTE TRADES */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleAddTrade} className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
              <h2 className="font-semibold text-slate-200">Nouveau Trade</h2>
              <input
                type="text"
                placeholder="Paire (ex: EURUSD, GOLD)"
                value={tradeForm.pair}
                onChange={e => setTradeForm({...tradeForm, pair: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <input
                type="number"
                step="any"
                placeholder="Gain / Perte (€)"
                value={tradeForm.resultPnl}
                onChange={e => setTradeForm({...tradeForm, resultPnl: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <input
                type="date"
                value={tradeForm.date}
                onChange={e => setTradeForm({...tradeForm, date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded transition">
                Enregistrer Trade
              </button>
            </form>

            <div className="md:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h2 className="font-semibold mb-4 text-slate-200">Historique des Trades</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trades.length === 0 && <p className="text-slate-500 text-sm">Aucun trade enregistré.</p>}
                {trades.map(t => (
                  <div key={t.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700/50">
                    <div>
                      <span className="font-bold text-white mr-2">{t.pair}</span>
                      <span className="text-xs text-slate-400">{t.date}</span>
                    </div>
                    <span className={`font-mono font-bold ${t.resultPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {t.resultPnl >= 0 ? `+${t.resultPnl}` : t.resultPnl} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* FORMULAIRE & LISTE RETRAITS */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleAddRetrait} className="bg-slate-800 p-4 rounded-xl border border-amber-500/30 space-y-4">
              <h2 className="font-semibold text-amber-400">Nouveau Retrait</h2>
              <input
                type="number"
                step="any"
                placeholder="Montant du retrait (€)"
                value={retraitForm.montant}
                onChange={e => setRetraitForm({...retraitForm, montant: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <input
                type="date"
                value={retraitForm.date}
                onChange={e => setRetraitForm({...retraitForm, date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Note / Banque (Optionnel)"
                value={retraitForm.note}
                onChange={e => setRetraitForm({...retraitForm, note: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition">
                Valider le Retrait
              </button>
            </form>

            <div className="md:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h2 className="font-semibold mb-4 text-slate-200">Historique des Retraits</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {retraits.length === 0 && <p className="text-slate-500 text-sm">Aucun retrait effectué.</p>}
                {retraits.map(r => (
                  <div key={r.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-amber-500/20">
                    <div>
                      <span className="font-bold text-amber-400 mr-2">Retrait</span>
                      {r.note && <span className="text-xs text-slate-400 mr-2">({r.note})</span>}
                      <span className="text-xs text-slate-500">{r.date}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">
                      -{r.montant} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COURBE D'ÉQUITÉ (AVEC TRADES ET RETRAITS INTEGRÉS) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="font-semibold mb-4 text-slate-200">Évolution du Solde Réel</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData}>
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
