import React, { useEffect, useState, useContext } from 'react';
import api from 'src/api/apiClient'
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
  CFormSelect,
  CRow,
  CCol
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';
import PDFViewer from './PDFViewer';

const SafetyLists = () => {
  const { zakaznikId } = useContext(UserContext);
  const [safetyLists, setSafetyLists] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('in_use'); // "in_use" nebo "all"

  useEffect(() => {
    const fetchSafetyLists = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const endpoint = selectedFilter === 'in_use' ? 'safety-list_in_use' : 'safety-list'

        const response = await api.get(endpoint, {
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
  }, [zakaznikId, selectedFilter]);

  const downloadFile = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    api
      .get('download', {
        params: { blobName, type: 'download' },
        responseType: 'blob',
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

  const handleViewPdf = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    api
      .get('download', {
        params: { blobName, type: 'view' },
      })
      .then((response) => {
        setSelectedPdfUrl(response.data.url);
      })
      .catch((error) => {
        console.error('Chyba při generování odkazu na PDF:', error);
      });
  };

  const handleBackToList = () => {
    setSelectedPdfUrl(null);
  };

  if (selectedPdfUrl) {
    return <PDFViewer pdfUrl={selectedPdfUrl} onBack={handleBackToList} />;
  }

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CRow>
          <CCol xs={6}>
            <strong>Bezpečnostní listy</strong>
          </CCol>
          <CCol xs={6}>
            <CFormSelect
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              aria-label="Filtr bezpečnostních listů"
            >
              <option value="in_use">Použité bezpečnostní listy</option>
              <option value="all">Všechny bezpečnostní listy</option>
            </CFormSelect>
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
