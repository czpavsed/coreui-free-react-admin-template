import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
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
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';
import PDFViewer from './PDFViewer';
import { cilCloudDownload, cilMagnifyingGlass } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const Mapy = () => {
  const { zakaznikId } = useContext(UserContext);
  const [maps, setMaps] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaps = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get('/api/mapy', {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });
        setMaps(response.data);
      } catch (error) {
        console.error('Chyba při načítání map:', error);
        setError('Nepodařilo se načíst data pro mapy.');
      } finally {
        setLoading(false);
      }
    };

    fetchMaps();
  }, [zakaznikId]);

  const generateTokenAndFetchUrl = async (blobName, type) => {
    try {
      const response = await axios.get('/api/download', {
        params: { blobName, type },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Chyba při generování tokenu:', error);
      return null;
    }
  };

  const downloadFile = (fullUrl) => {
    const blobName = decodeURIComponent(fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', ''));

    axios.get('/api/download', {
      params: { blobName, type: 'download' },
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${API_ACCESS_KEY}`,
      },
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${blobName.split('/').pop()}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Chyba při stahování souboru:', error);
      });
  };

  const handleViewPdf = async (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    const viewUrl = await generateTokenAndFetchUrl(blobName, 'view');
    if (viewUrl) {
      setSelectedPdfUrl(viewUrl);
    }
  };

  const handleBackToList = () => {
    setSelectedPdfUrl(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${date.getFullYear()}`;
  };

  if (selectedPdfUrl) {
    return <PDFViewer pdfUrl={selectedPdfUrl} onBack={handleBackToList} />;
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>Přehled map</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : maps.length > 0 ? (
          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Název mapy</CTableHeaderCell>
                <CTableHeaderCell>Datum vytvoření</CTableHeaderCell>
                <CTableHeaderCell>Stáhnout PDF</CTableHeaderCell>
                <CTableHeaderCell>Zobrazit PDF</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {maps.map((map) => (
                <CTableRow key={map.MapaId}>
                  <CTableDataCell>{map.Nazev}</CTableDataCell>
                  <CTableDataCell>{formatDate(map.CreateDate)}</CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="success"
                      size="sm"
                      onClick={() => downloadFile(map.url)}
                    >
                      <CIcon icon={cilCloudDownload} className="me-2" />
                      Stáhnout
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => handleViewPdf(map.url)}
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
          <p>Žádné mapy nebyly nalezeny.</p>
        )}
      </CCardBody>
    </CCard>
  );
};

export default Mapy;
