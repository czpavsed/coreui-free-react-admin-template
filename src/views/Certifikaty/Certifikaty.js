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
  CFormSelect,
  CRow,
  CCol,
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';
import PDFViewer from './PDFViewer';

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
const API_BASE_URL = import.meta.env.VITE_API_API_URL;

const Certifikaty = () => {
  const { zakaznikId } = useContext(UserContext);
  const [certifikaty, setCertifikaty] = useState([]);
  const [filteredCertifikaty, setFilteredCertifikaty] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTyp, setSelectedTyp] = useState('Vše');

  // Načtení certifikátů s ověřením API klíčem
  useEffect(() => {
    const fetchCertifikaty = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}certifikaty`, {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });

        setCertifikaty(response.data);
        setFilteredCertifikaty(response.data);
      } catch (error) {
        console.error('Chyba při načítání certifikátů:', error);
        setError('Nepodařilo se načíst certifikáty.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertifikaty();
  }, [zakaznikId]);

  // Funkce pro stažení souboru (ZŮSTALO BEZE ZMĚNY)
  const downloadFile = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    axios.get(`${API_BASE_URL}download`, {
      params: { blobName, type: 'download' },
      responseType: 'blob',
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

  // Funkce pro zobrazení PDF (ZŮSTALO BEZE ZMĚNY)
  const handleViewPdf = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');

    axios.get(`${API_BASE_URL}download`, {
      params: { blobName, type: 'view' },
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

  // Formátování data do českého formátu
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  // Kontrola platnosti certifikátu
  const isExpired = (dateString) => {
    const today = new Date();
    const expiryDate = new Date(dateString);
    return expiryDate < today;
  };

  // Filtr podle typu
  const handleFilterChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedTyp(selectedValue);

    if (selectedValue === 'Vše') {
      setFilteredCertifikaty(certifikaty);
    } else {
      setFilteredCertifikaty(certifikaty.filter(cert => cert.Typ === selectedValue));
    }
  };

  // Pokud je otevřený PDF Viewer
  if (selectedPdfUrl) {
    return <PDFViewer pdfUrl={selectedPdfUrl} onBack={handleBackToList} />;
  }

  // Výpis typů pro filtr
  const uniqueTypes = ['Vše', ...new Set(certifikaty.map(cert => cert.Typ))];

  return (
    <CCard className="mb-4">
      <CCardHeader>Certifikáty</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <CRow className="mb-3">
              <CCol xs="12" sm="6" md="4">
                <CFormSelect
                  label="Filtr podle typu"
                  value={selectedTyp}
                  onChange={handleFilterChange}
                >
                  {uniqueTypes.map((typ, index) => (
                    <option key={index} value={typ}>
                      {typ}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Název</CTableHeaderCell>
                  <CTableHeaderCell className="d-none d-sm-table-cell">Typ</CTableHeaderCell>
                  <CTableHeaderCell className="d-none d-sm-table-cell">Platnost do</CTableHeaderCell>
                  <CTableHeaderCell>Ke stažení</CTableHeaderCell>
                  <CTableHeaderCell>Zobrazit</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredCertifikaty.length > 0 ? (
                  filteredCertifikaty.map((cert) => (
                    <CTableRow key={cert.CertifikatId}>
                      <CTableDataCell>{cert.Nazev}</CTableDataCell>
                      <CTableDataCell className="d-none d-sm-table-cell">{cert.Typ}</CTableDataCell>
                      <CTableDataCell style={{ color: isExpired(cert.PlatnostDo) ? 'red' : 'inherit' }} className="d-none d-sm-table-cell">
                        {formatDate(cert.PlatnostDo)}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="success" onClick={() => downloadFile(cert.url)}>
                          Stáhnout
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="info" onClick={() => handleViewPdf(cert.url)}>
                          Zobrazit
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="5" className="text-center">
                      Žádné certifikáty nebyly nalezeny.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default Certifikaty;