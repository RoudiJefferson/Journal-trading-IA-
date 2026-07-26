import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// =========================================================================
// 1. CONFIGURATION SUPABASE
// =========================================================================
const SUPABASE_URL = "https://rvxfnfddtgjxspyihzbq.supabase.co";
// Remplace le texte ci-dessous par ta clé publiable (qui commence par sb_publishable_...)
const SUPABASE_ANON_KEY = "TA_CLE_PUBLIABLE_ICI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================================
// 2. COMPOSANT PRINCIPAL
// =========================================================================
export default function App() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulaire local
  const [pair, setPair] = useState('EURUSD');
  const [type, setType] = useState('BUY');
  const [result, setResult] = useState('WIN');
  const [notes, setNotes] = useState('');

  // Charger les données depuis Supabase au démarrage
  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_data')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur Supabase :', error);
      } else if (data && data.content) {
        setTrades(data.content);
      }
    } catch (err) {
      console.error('Erreur lors du chargement :', err);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les données dans Supabase
  const saveTradesToSupabase = async (updatedTrades) => {
    try {
      const { error } = await supabase
        .from('journal_data')
        .upsert({ id: 1, content: updatedTrades });

      if (error) {
        console.error('Erreur de sauvegarde Supabase :', error);
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde :', err);
    }
  };

  // Ajouter un nouveau trade
  const handleAddTrade = async (e) => {
    e.preventDefault();
    const newTrade = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      pair,
      type,
      result,
      notes
    };

    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);
    setNotes('');

    // Synchronisation en ligne
    await saveTradesToSupabase(updatedTrades);
  };

  // Supprimer un trade
  const handleDeleteTrade = async (tradeId) => {
    const updatedTrades = trades.filter((t) => t.id !== tradeId);
    setTrades(updatedTrades);
    await saveTradesToSupabase(updatedTrades);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Journal de Trading</h1>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAddTrade} style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Ajouter une prise de position</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <select value={pair} onChange={(e) => setPair(e.target.value)} style={{ padding: '8px' }}>
            <option value="EURUSD">EURUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="XAUUSD">XAUUSD (Or)</option>
            <option value="USOIL">WTI (Pétrole)</option>
            <option value="BTCUSD">Bitcoin</option>
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '8px' }}>
            <option value="BUY">BUY (Achat)</option>
            <option value="SELL">SELL (Vente)</option>
          </select>

          <select value={result} onChange={(e) => setResult(e.target.value)} style={{ padding: '8px' }}>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
            <option value="BE">BE (Break Even)</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="Notes sur le trade (ex: Confluence ICT, FVG, Killzone...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', height: '60px', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" style={{ padding: '10px 15px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Enregistrer le trade
        </button>
      </form>

      {/* Liste des trades */}
      <h2>Historique</h2>
      {loading ? (
        <p>Chargement des trades...</p>
      ) : trades.length === 0 ? (
        <p>Aucun trade enregistré pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {trades.map((trade) => (
            <div
              key={trade.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: trade.result === 'WIN' ? '#e6f4ea' : trade.result === 'LOSS' ? '#fce8e6' : '#f1f3f4'
              }}
            >
              <div>
                <strong>{trade.date}</strong> - <span>{trade.pair}</span> (<strong>{trade.type}</strong>) 
                <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>[{trade.result}]</span>
                {trade.notes && <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>{trade.notes}</p>}
              </div>
              <button
                onClick={() => handleDeleteTrade(trade.id)}
                style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
