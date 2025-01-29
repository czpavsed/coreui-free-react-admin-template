import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CSpinner,
} from '@coreui/react'
import { UserContext } from './../../components/UserContext';
import PDFViewer from './PDFViewer'
import { cilCloudDownload, cilMagnifyingGlass } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const Trendy = () => {
  const { zakaznikId } = useContext(UserContext)
  const [trendy, setTrendy] = useState([])
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Načtení trendů s vyplněnou URL
  useEffect(() => {
    const fetchTrendy = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.')
        return
      }

      setLoading(true)
      try {
        const response = await axios.get(`/api/inspections`, {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        })
        
        // Filtrování pouze trendů s vyplněnou URL adresou
        const filteredData = response.data.filter(item => item.Url_Trendy_BlobStorage)
        const sortedData = filteredData.sort((a, b) => new Date(b.Datum) - new Date(a.Datum))
        setTrendy(sortedData)
      } catch (error) {
        console.error('Chyba při načítání trendů:', error)
        setError('Nepodařilo se načíst trendy.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrendy()
  }, [zakaznikId])

  // Stažení PDF
  const downloadFile = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '')

    axios.get(`/api/download`, {
      params: { blobName, type: 'download' },
      responseType: 'blob',
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${blobName.split('/').pop()}`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => {
        console.error('Chyba při stahování souboru:', error)
      })
  }

  // Zobrazení PDF
  const handleViewPdf = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '')

    axios.get(`/api/download`, {
      params: { blobName, type: 'view' },
    })
      .then((response) => {
        setSelectedPdfUrl(response.data.url)
      })
      .catch((error) => {
        console.error('Chyba při načítání PDF:', error)
      })
  }

  // Zpět na seznam trendů
  const handleBackToList = () => {
    setSelectedPdfUrl(null)
  }

  // Formátování datumu
  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${date.getFullYear()}`
  }

  // Zobrazení PDF
  if (selectedPdfUrl) {
    return <PDFViewer pdfUrl={selectedPdfUrl} onBack={handleBackToList} />
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>Roční trendy</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : trendy.length > 0 ? (
          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Datum</CTableHeaderCell>
                <CTableHeaderCell>Typ kontroly</CTableHeaderCell>
                <CTableHeaderCell>Technik</CTableHeaderCell>
                <CTableHeaderCell>Poznámka</CTableHeaderCell>
                <CTableHeaderCell>Stáhnout PDF</CTableHeaderCell>
                <CTableHeaderCell>Zobrazit PDF</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {trendy.map((trend) => (
                <CTableRow key={trend.ID}>
                  <CTableDataCell>{formatDate(trend.Datum)}</CTableDataCell>
                  <CTableDataCell>{trend.Typ_kontroly}</CTableDataCell>
                  <CTableDataCell>{`${trend.Jmeno} ${trend.Prijmeni}`}</CTableDataCell>
                  <CTableDataCell>{trend.Poznámka || '—'}</CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="success"
                      size="sm"
                      onClick={() => downloadFile(trend.Url_Trendy_BlobStorage)}
                    >
                      <CIcon icon={cilCloudDownload} className="me-2" />
                      Stáhnout
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => handleViewPdf(trend.Url_Trendy_BlobStorage)}
                    >
                      <CIcon icon={cilMagnifyingGlass} className="me-2" />
                      Zobrazit
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        ) : (
          <p>Žádné trendy nebyly nalezeny.</p>
        )}
      </CCardBody>
    </CCard>
  )
}

export default Trendy