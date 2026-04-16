import React, { useEffect, useMemo, useState, useContext } from 'react';
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
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CCol
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSortAscending, cilSortDescending } from '@coreui/icons';
import { UserContext } from './../../components/UserContext';
import PDFViewer from './PDFViewer';

const SafetyLists = () => {
  const { zakaznikId } = useContext(UserContext);
  const [safetyLists, setSafetyLists] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const fetchSafetyLists = async () => {
      if (!zakaznikId) {
        setError(null);
        setSafetyLists([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.get('safety-list', {
          params: { zakaznikId },
        });
        setSafetyLists(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Chyba při načítání bezpečnostních listů:', error);
        setError('Nepodařilo se načíst bezpečnostní listy.');
      } finally {
        setLoading(false);
      }
    };

    fetchSafetyLists();
  }, [zakaznikId]);

  const displayedSafetyLists = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase('cs');

    const filtered = (Array.isArray(safetyLists) ? safetyLists : []).filter((list) => {
      if (!query) return true;
      return (list?.Nazev ?? '').toLocaleLowerCase('cs').includes(query);
    });

    filtered.sort((a, b) => {
      const compareResult = (a?.Nazev ?? '').localeCompare(b?.Nazev ?? '', 'cs', {
        sensitivity: 'base',
      });

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return filtered;
  }, [safetyLists, searchText, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

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
          <CCol xs={12}>
            <strong>Bezpečnostní listy</strong>
          </CCol>
        </CRow>
        <CRow className="mt-3 g-2">
          <CCol xs={12}>
            <CInputGroup>
              <CInputGroupText>Filtr</CInputGroupText>
              <CFormInput
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Hledat podle názvu bezpečnostního listu..."
                aria-label="Hledat bezpečnostní listy podle názvu"
                size="lg"
              />
              <CButton
                color="secondary"
                variant="outline"
                onClick={toggleSortDirection}
                title={sortDirection === 'asc' ? 'Řazení A-Z' : 'Řazení Z-A'}
                aria-label={
                  sortDirection === 'asc'
                    ? 'Přepnout řazení na Z-A'
                    : 'Přepnout řazení na A-Z'
                }
              >
                <CIcon icon={sortDirection === 'asc' ? cilSortAscending : cilSortDescending} />
                {' '}
                {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
              </CButton>
            </CInputGroup>
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
              {displayedSafetyLists.length > 0 ? (
                displayedSafetyLists.map((list) => (
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
                    {safetyLists.length === 0
                      ? 'Žádné bezpečnostní listy nebyly nalezeny.'
                      : 'Žádné bezpečnostní listy neodpovídají hledání.'}
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
