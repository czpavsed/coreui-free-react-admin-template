import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
const API_BASE_URL = import.meta.env.VITE_API_API_URL;

const TrendyAnalyza = () => {
  const { zakaznikId } = useContext(UserContext);
  const [analyza, setAnalyza] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    if (!zakaznikId) {
      console.error('ZakaznikId není dostupné.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}analyza-trendu`, {
        params: { zakaznikId },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      });

      setAnalyza(response.data);
    } catch (error) {
      console.error('Chyba při načítání analýzy:', error);
      setError('Nepodařilo se načíst analýzu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [zakaznikId]);

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CRow>
          <CCol xs={6}>
            <h5>AI Analýza Trendů</h5>
          </CCol>
          <CCol xs={6} className="text-end">
            <CButton color="primary" onClick={fetchAnalysis}>
              {loading ? <CSpinner size="sm" /> : 'Obnovit analýzu'}
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : analyza ? (
          <>
            <h5>📌 Shrnutí</h5>
            <p>{analyza.shrnutí}</p>

            {analyza.hlodavci && (
              <>
                <h5>🐀 Hlodavci</h5>
                {analyza.hlodavci.vnitřní_prostory && (
                  <p><strong>Vnitřní prostory:</strong> {analyza.hlodavci.vnitřní_prostory.trend}. Limit: {analyza.hlodavci.vnitřní_prostory.limit}. Opatření: {analyza.hlodavci.vnitřní_prostory.opatření}.</p>
                )}
                {analyza.hlodavci.venkovní_prostory && (
                  <p><strong>Venkovní prostory:</strong> {analyza.hlodavci.venkovní_prostory.trend}. Limit: {analyza.hlodavci.venkovní_prostory.limit}. Opatření: {analyza.hlodavci.venkovní_prostory.opatření}.</p>
                )}
              </>
            )}

            {analyza.létající_hmyz && (
              <>
                <h5>🦟 Létající hmyz</h5>
                {analyza.létající_hmyz.zavíječi && (
                  <p><strong>Zavíječi:</strong> {analyza.létající_hmyz.zavíječi.trend}. Limit: {analyza.létající_hmyz.zavíječi.limit}. Opatření: {analyza.létající_hmyz.zavíječi.opatření}.</p>
                )}
                {analyza.létající_hmyz.elektrické_lapače && (
                  <p><strong>Elektrické lapače:</strong> {analyza.létající_hmyz.elektrické_lapače.trend}. Limit: {analyza.létající_hmyz.elektrické_lapače.limit}. Opatření: {analyza.létající_hmyz.elektrické_lapače.opatření}.</p>
                )}
              </>
            )}

            {analyza.lezoucí_hmyz && (
              <>
                <h5>🐜 Lezoucí hmyz</h5>
                {analyza.lezoucí_hmyz.monitorovací_pasti && (
                  <p><strong>Monitorovací pasti:</strong> {analyza.lezoucí_hmyz.monitorovací_pasti.trend}. Limit: {analyza.lezoucí_hmyz.monitorovací_pasti.limit}. Opatření: {analyza.lezoucí_hmyz.monitorovací_pasti.opatření}.</p>
                )}
              </>
            )}

            {analyza.cíle_na_rok_2025 && (
              <>
                <h5>🎯 Cíle na rok 2025</h5>
                <ul>
                  {analyza.cíle_na_rok_2025.map((cíl, index) => (
                    <li key={index}>{cíl}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <p>Analýza zatím není dostupná.</p>
        )}
      </CCardBody>
    </CCard>
  );
};

export default TrendyAnalyza;
