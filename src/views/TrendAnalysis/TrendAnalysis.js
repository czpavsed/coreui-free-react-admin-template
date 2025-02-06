import React, { useState, useContext } from "react";
import axios from "axios";
import { CCard, CCardBody, CCardHeader, CCol, CRow, CButton, CSpinner, CAlert } from "@coreui/react";
import { UserContext } from "../../components/UserContext";

// Načtení API klíče z .env souboru pro Vite
const API_BASE_URL = import.meta.env.VITE_API_API_URL;

const TrendAnalysis = () => {
  const { zakaznikId } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fetchAnalysis = async () => {
    if (!zakaznikId) {
      setError("❌ Chybí zakaznikId!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}analyza-trendu`, {
        params: { zakaznikId },
        headers: {
          "Content-Type": "application/json",
        },
      });

      setAnalysisResult(response.data);
    } catch (err) {
      console.error("❌ Chyba při načítání analýzy trendů:", err);
      setError("❌ Nepodařilo se načíst analýzu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CRow>
          <CCol xs={8}>
            <h5>📊 Analýza Trendů</h5>
          </CCol>
          <CCol xs={4} className="text-end">
            <CButton color="primary" onClick={fetchAnalysis} disabled={loading}>
              {loading ? <CSpinner size="sm" /> : "🔍 Spustit analýzu"}
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>

      <CCardBody>
        {loading && (
          <div className="text-center">
            <CSpinner />
            <p>Načítám analýzu trendů...</p>
          </div>
        )}

        {error && <CAlert color="danger">{error}</CAlert>}

        {analysisResult && (
          <div>
            <h6>🔎 **Shrnutí:**</h6>
            <p>{analysisResult.shrnutí || "Žádné shrnutí dostupné."}</p>

            <h6>🐀 **Hlodavci**</h6>
            <ul>
              <li><strong>Vnitřní prostory:</strong> {analysisResult.hlodavci?.vnitřní_prostory || "Nejsou data"}</li>
              <li><strong>Venkovní prostory:</strong> {analysisResult.hlodavci?.venkovní_prostory || "Nejsou data"}</li>
            </ul>

            <h6>🦟 **Létající hmyz**</h6>
            <ul>
              <li><strong>Zavíječi:</strong> {analysisResult.létající_hmyz?.zavíječi || "Nejsou data"}</li>
              <li><strong>Elektrické lapače:</strong> {analysisResult.létající_hmyz?.elektrické_lapače || "Nejsou data"}</li>
            </ul>

            <h6>🐜 **Lezoucí hmyz**</h6>
            <ul>
              <li><strong>Monitorovací pasti:</strong> {analysisResult.lezoucí_hmyz?.monitorovací_pasti || "Nejsou data"}</li>
            </ul>

            <h6>🎯 **Cíle na rok 2025:**</h6>
            <ul>
              {analysisResult.cíle_na_rok_2025?.map((cíl, index) => <li key={index}>{cíl}</li>) || <li>Nejsou stanoveny cíle.</li>}
            </ul>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default TrendAnalysis;