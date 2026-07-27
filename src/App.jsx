import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co'; // Remplace par ton URL Supabase si besoin
const SUPABASE_KEY = 'TA_CLEF_SUPABASE_ICI'; // Ligne 17: Ta clef Supabase

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [trades, setTrades] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Formulaire de trade
  const [asset, setAsset] = useState('BTCUSD');
  const [type, setType] = useState('BUY');
  const [pnl, setPnl] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Charger les trades au démarrage
  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase.from('journal_data').select('*');
      if (error) throw error;
      if (data) setTrades(data);
    } catch (err) {
      console.error('Erreur de chargement Supabase:', err);
      const localData = localStorage.getItem('rm_trades');
      if (localData) setTrades(JSON.parse(localData));
    }
  };

  // Gestion du copier-coller d'image (Presse-papiers TradingView)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          setImageUrl(event.target.result); // Image encodée en Base64
        };

        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  };

  // Enregistrer un nouveau trade
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newTrade = {
      asset,
      type,
      pnl: parseFloat(pnl) || 0,
      notes,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('journal_data').insert([newTrade]).select();
      if (error) throw error;
      if (data) setTrades([...trades, data[0]]);
    } catch (err) {
      console.error('Sauvegarde locale (Supabase non connecté) :', err);
      const updated = [...trades, { ...newTrade, id: Date.now() }];
      setTrades(updated);
      localStorage.setItem('rm_trades', JSON.stringify(updated));
    }

    // Réinitialiser le formulaire
    setPnl('');
    setNotes('');
    setImageUrl('');
    setShowModal(false);
  };

  return (
    <div style={{ backgroundColor: '#131722', color: '#d1d4dc', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2e39', paddingBottom: '15px' }}>
        <h1 style={{ color: '#2962ff', margin: 0 }}>RM Trading Journal</h1>
        <button 
          onClick={() => setShowModal(true)} 
          style={{ backgroundColor: '#2962ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Enregistrer un trade
        </button>
      </header>

      {/* Modal / Fenêtre d'enregistrement de trade */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e222d', padding: '25px', borderRadius: '8px', width: '450px', border: '1px solid #2a2e39' }}>
            <h2 style={{ marginTop: 0, color: '#fff' }}>Nouveau Trade</h2>
            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Actif :</label>
                <input 
                  type="text" 
                  value={asset} 
                  onChange={(e) => setAsset(e.target.value)} 
                  style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Type :</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }}
                >
                  <option value="BUY">BUY / Achat</option>
                  <option value="SELL">SELL / Vente</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>P&L ($) :</label>
                <input 
                  type="number" 
                  step="any"
                  value={pnl} 
                  onChange={(e) => setPnl(e.target.value)} 
                  placeholder="ex: 150 ou -50"
                  style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }}
                />
              </div>

              {/* ZONE DE COLLAGE D'IMAGE (TradingView Paste Zone) */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Capture d'écran TradingView :</label>
                <div 
                  onPaste={handlePaste}
                  tabIndex="0"
                  style={{
                    border: '2px dashed #2962ff',
                    padding: '15px',
                    textAlign: 'center',
                    borderRadius: '6px',
                    backgroundColor: '#131722',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', color: '#868993' }}>
                    Clique ici puis fais <strong>Ctrl + V</strong> (ou <strong>Cmd + V</strong>) pour coller la capture de TradingView.
                  </p>
                </div>

                {/* Champ texte alternatif pour coller une URL d'image */}
                <input 
                  type="text" 
                  placeholder="Ou colle l'URL de l'image ici..." 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }}
                />

                {/* Aperçu de l'image si présente */}
                {imageUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#00e676', marginBottom: '5px' }}>✓ Image capturée :</p>
                    <img src={imageUrl} alt="Aperçu trade" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', border: '1px solid #2a2e39' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Notes / Analyse :</label>
                <textarea 
                  rows="3" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  style={{ width: '100%', padding: '8px', backgroundColor: '#131722', border: '1px solid #2a2e39', color: '#fff', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 15px', backgroundColor: '#2a2e39', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 15px', backgroundColor: '#2962ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Valider
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Liste des trades enregistrés */}
      <main style={{ marginTop: '30px' }}>
        <h2>Historique des trades</h2>
        {trades.length === 0 ? (
          <p style={{ color: '#868993' }}>Aucun trade enregistré pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {trades.map((t, idx) => (
              <div key={t.id || idx} style={{ backgroundColor: '#1e222d', padding: '15px', borderRadius: '8px', border: '1px solid #2a2e39' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '18px' }}>{t.asset}</strong>
                  <span style={{ color: t.type === 'BUY' ? '#00e676' : '#ff5252', fontWeight: 'bold' }}>{t.type}</span>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: t.pnl >= 0 ? '#00e676' : '#ff5252', margin: '5px 0' }}>
                  {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                </p>
                {t.notes && <p style={{ fontSize: '14px', color: '#868993' }}>{t.notes}</p>}
                {t.image_url && (
                  <img src={t.image_url} alt="TradingView Chart" style={{ width: '100%', borderRadius: '4px', marginTop: '10px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
