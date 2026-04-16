import React, { useState, useContext } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CRow, CButton, CSpinner, CAlert } from '@coreui/react'
import { UserContext } from '../../components/UserContext'
import api from 'src/api/apiClient'

const TrendAnalysis = () => {
  const { zakaznikId } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const getApiErrorMessage = (err) => {
    const status = err?.response?.status
    const data = err?.response?.data

    const backendDetail =
      data?.detail || data?.message || data?.error || (typeof data === 'string' ? data : null)

    if (status === 500) {
      return backendDetail
        ? `Serverová chyba (500): ${backendDetail}`
        : 'Serverová chyba (500). API endpoint selhal při zpracování požadavku.'
    }

    if (status) {
      return backendDetail
        ? `Chyba API (${status}): ${backendDetail}`
        : `Chyba API (${status}).`
    }

    return 'Nepodařilo se načíst analýzu trendů.'
  }

  const fetchAnalysis = async () => {
    if (!zakaznikId) {
      setError('Nejprve vyberte zákazníka v pravém horním menu.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.get('analyza-trendu', {
        params: { zakaznikId },
      })

      setAnalysisResult(response.data)
    } catch (err) {
      const requestId =
        err?.response?.headers?.['x-request-id'] ||
        err?.response?.headers?.['x-ms-request-id'] ||
        err?.response?.headers?.['traceparent'] ||
        null

      console.error('❌ Chyba při načítání analýzy trendů:', {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
        requestId,
      })

      setAnalysisResult(null)
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CRow>
          <CCol xs={8}>
            <h5>📊 Analýza trendů</h5>
          </CCol>
          <CCol xs={4} className="text-end">
            <CButton color="primary" onClick={fetchAnalysis} disabled={loading}>
              {loading ? <CSpinner size="sm" /> : '🔍 Spustit analýzu'}
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
            <p>{analysisResult.shrnutí || 'Žádné shrnutí dostupné.'}</p>

            <h6>🐀 **Hlodavci**</h6>
            <ul>
              <li><strong>Vnitřní prostory:</strong> {analysisResult.hlodavci?.vnitřní_prostory || 'Nejsou data'}</li>
              <li><strong>Venkovní prostory:</strong> {analysisResult.hlodavci?.venkovní_prostory || 'Nejsou data'}</li>
            </ul>

            <h6>🦟 **Létající hmyz**</h6>
            <ul>
              <li><strong>Zavíječi:</strong> {analysisResult.létající_hmyz?.zavíječi || 'Nejsou data'}</li>
              <li><strong>Elektrické lapače:</strong> {analysisResult.létající_hmyz?.elektrické_lapače || 'Nejsou data'}</li>
            </ul>

            <h6>🐜 **Lezoucí hmyz**</h6>
            <ul>
              <li><strong>Monitorovací pasti:</strong> {analysisResult.lezoucí_hmyz?.monitorovací_pasti || 'Nejsou data'}</li>
            </ul>

            <h6>🎯 **Cíle na rok 2025:**</h6>
            <ul>
              {analysisResult.cíle_na_rok_2025?.map((cíl, index) => <li key={index}>{cíl}</li>) || <li>Nejsou stanoveny cíle.</li>}
            </ul>
          </div>
        )}
      </CCardBody>
    </CCard>
  )
}

export default TrendAnalysis