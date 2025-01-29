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
const API_BASE_URL = import.meta.env.VITE_API_API_URL;

const Kontroly = () => {
  const { zakaznikId } = useContext(UserContext); // Získání zakaznikId z kontextu
  const [inspections, setInspections] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}inspections`, {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });
        const sortedData = response.data.sort((a, b) => new Date(b.Datum) - new Date(a.Datum));
        setInspections(sortedData);
      } catch (error) {
        console.error('Chyba při načítání kontrol:', error);
        setError('Nepodařilo se načíst kontroly.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [zakaznikId]);

  const downloadFile = (fullUrl) => {
    const blobName = encodeURIComponent(fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', ''));

    axios
      .get(`${API_BASE_URL}download`, {
        params: { blobName, type: 'download' },
        responseType: 'blob',
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', decodeURIComponent(blobName.split('/').pop())); // Dekódování pro správný název souboru
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Chyba při stahování souboru:', error);
      });
  };

  const handleViewPdf = (fullUrl) => {
    const blobName = encodeURIComponent(fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', ''));

    axios
    .get(`${API_BASE_URL}download`, {
        params: { blobName, type: 'view' },
      })
      .then((response) => {
        setSelectedPdfUrl(response.data.url);
      })
      .catch((error) => {
        console.error('Chyba při načítání PDF:', error);
      });
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
      <CCardHeader>Přehled kontrol</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : inspections.length > 0 ? (
          <CTable hover responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Datum</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-sm-table-cell">Typ kontroly</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-sm-table-cell">Technik</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-sm-table-cell">Poznámka</CTableHeaderCell>
                <CTableHeaderCell>Stáhnout</CTableHeaderCell>
                <CTableHeaderCell>Zobrazit</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {inspections.map((inspection) => (
                <CTableRow key={inspection.ID}>
                  <CTableDataCell>{formatDate(inspection.Datum)}</CTableDataCell>
                  <CTableDataCell className="d-none d-sm-table-cell">{inspection.Typ_kontroly}</CTableDataCell>
                  <CTableDataCell className="d-none d-sm-table-cell">{`${inspection.Jmeno} ${inspection.Prijmeni}`}</CTableDataCell>
                  <CTableDataCell className="d-none d-sm-table-cell">{inspection.Poznámka || '—'}</CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="success"
                      size="sm"
                      onClick={() => downloadFile(inspection.Url_BlobStorage)}
                    >
                      <CIcon icon={cilCloudDownload} className="me-2" />
                      Stáhnout
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => handleViewPdf(inspection.Url_BlobStorage)}
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
          <p>Žádné kontroly nebyly nalezeny.</p>
        )}
      </CCardBody>
    </CCard>
  );
};

export default Kontroly;