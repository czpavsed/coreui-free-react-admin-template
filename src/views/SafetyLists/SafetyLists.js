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
  CSpinner
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';
import PDFViewer from './PDFViewer'

const SafetyLists = () => {
  const { zakaznikId } = useContext(UserContext);
  const [safetyLists, setSafetyLists] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Načtení bezpečnostních listů
  useEffect(() => {
    const fetchSafetyLists = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`/api/safety-list`, {
          params: { zakaznikId },
        });
        setSafetyLists(response.data);
      } catch (error) {
        console.error('Chyba při načítání bezpečnostních listů:', error);
        setError('Nepodařilo se načíst bezpečnostní listy.');
      } finally {
        setLoading(false);
      }
    };

    fetchSafetyLists();
  }, [zakaznikId]);

  // Funkce pro stažení souboru
  const downloadFile = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    axios.get(`/api/download`, {
      params: { blobName, type: 'download' },
      responseType: 'blob'
    })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${blobName.split('/').pop()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Chyba při stahování souboru:', error);
    });
  };

  // Funkce pro zobrazení PDF
  const handleViewPdf = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    axios.get(`/api/download`, {
      params: { blobName, type: 'view' }
    })
    .then(response => {
      setSelectedPdfUrl(response.data.url);
    })
    .catch(error => {
      console.error('Chyba při generování odkazu na PDF:', error);
    });
  };

  const handleBackToList = () => {
    setSelectedPdfUrl(null);
  };

  // Pokud je otevřený PDF Viewer
  if (selectedPdfUrl) {
    return <PDFViewer pdfUrl={selectedPdfUrl} onBack={handleBackToList} />;
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>Bezpečnostní listy</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <CTable hover responsive align="middle">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Název</CTableHeaderCell>
                <CTableHeaderCell>Ke stažení</CTableHeaderCell>
                <CTableHeaderCell>Zobrazit</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {safetyLists.length > 0 ? (
                safetyLists.map((list) => (
                  <CTableRow key={list.Bezpecnostni_listyId}>
                    <CTableDataCell>{list.Nazev}</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="success" onClick={() => downloadFile(list.url)}>
                        Stáhnout PDF
                      </CButton>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="info" onClick={() => handleViewPdf(list.url)}>
                        Zobrazit PDF
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan="3" className="text-center">
                    Žádné bezpečnostní listy nebyly nalezeny.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  );
};

export default SafetyLists;
