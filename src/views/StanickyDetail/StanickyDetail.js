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
  CSpinner,
  CRow,
  CCol,
  CFormSelect,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from '@coreui/react';
import { CChartLine } from '@coreui/react-chartjs';
import { getStyle } from '@coreui/utils';
import { UserContext } from './../../components/UserContext';

// ✅ API URL a Token z .env
const API_BASE_URL = import.meta.env.VITE_API_API_URL;
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const Checkpoints = () => {
  const { zakaznikId } = useContext(UserContext);
  const [checkpoints, setCheckpoints] = useState([]);
  const [services, setServices] = useState([]);
  const [objects, setObjects] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState(null);

  useEffect(() => {
    const fetchCheckpoints = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}checkpoints`, {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });

        const sortedData = response.data.sort((a, b) => a.Číslo_staničky - b.Číslo_staničky);
        setCheckpoints(sortedData);

        const uniqueServices = [...new Set(sortedData.map((item) => item.Služba))];
        setServices(uniqueServices);

        const uniqueObjects = [...new Set(sortedData.map((item) => item.Objekt))];
        setObjects(uniqueObjects);

        const uniqueSpaces = [...new Set(sortedData.map((item) => item.Prostor))];
        setSpaces(uniqueSpaces);
      } catch (error) {
        console.error('Chyba při načítání kontrolních bodů:', error);
        setError('Nepodařilo se načíst kontrolní body.');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckpoints();
  }, [zakaznikId]);

  const fetchTrendData = async (stanickaId) => {
    if (!stanickaId) {
      console.error('Neplatné stanickaId.');
      setTrendError('Neplatné ID stanice.');
      return;
    }

    setTrendLoading(true);
    setTrendError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}vyhodnoceni`, {
        params: { stanickaId },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      });

      if (response.data.length === 0) {
        setTrendError('Žádná data pro trend.');
      } else {
        setTrendData(response.data);
      }
    } catch (error) {
      console.error('Chyba při načítání trendu:', error);
      setTrendError('Nepodařilo se načíst data trendu.');
    } finally {
      setTrendLoading(false);
    }
  };

  const handleShowTrend = (checkpoint) => {
    if (!checkpoint || !checkpoint.stanickaId) {
      console.error('Neplatná stanice pro zobrazení trendu.');
      return;
    }
    setSelectedCheckpoint(checkpoint);
    fetchTrendData(checkpoint.stanickaId);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const yAxisUnit = trendData.length > 0 ? trendData[0].Vyhodnocení_jednotka : '';

  const dataForChart = {
    labels: trendData.map((data) => formatDate(data.Datum_zasahu)),
    datasets: [
      {
        label: 'Stav',
        borderColor: getStyle('--cui-info'),
        backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
        borderWidth: 2,
        data: trendData.map((data) => data.Stav),
      },
      {
        label: 'Limit',
        borderColor: getStyle('--cui-success'),
        backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .1)`,
        borderWidth: 2,
        data: trendData.map((data) => data.Target),
      },
    ],
  };

  const optionsForChart = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Měsíc/Rok',
          color: getStyle('--cui-gray-800'),
        },
      },
      y: {
        title: {
          display: true,
          text: `Hodnota (${yAxisUnit})`,
          color: getStyle('--cui-gray-800'),
        },
        beginAtZero: true,
      },
    },
  };

  const filteredCheckpoints = checkpoints.filter((checkpoint) => {
    return (
      (selectedService === '' || checkpoint.Služba === selectedService) &&
      (selectedObject === '' || checkpoint.Objekt === selectedObject) &&
      (selectedSpace === '' || checkpoint.Prostor === selectedSpace)
    );
  });

  return (
    <CCard className="mb-4">
      <CCardHeader>Přehled kontrolních bodů</CCardHeader>
      <CCardBody>
        <CRow className="mb-3">
          <CCol xs={4}>
            <CFormSelect
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              aria-label="Vyberte službu"
            >
              <option value="">Všechny služby</option>
              {services.map((service, index) => (
                <option key={index} value={service}>
                  {service}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol xs={4}>
            <CFormSelect
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
              aria-label="Vyberte objekt"
            >
              <option value="">Všechny objekty</option>
              {objects.map((object, index) => (
                <option key={index} value={object}>
                  {object}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol xs={4}>
            <CFormSelect
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              aria-label="Vyberte prostor"
            >
              <option value="">Všechny prostory</option>
              {spaces.map((space, index) => (
                <option key={index} value={space}>
                  {space}
                </option>
              ))}
            </CFormSelect>
          </CCol>
        </CRow>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <CTable hover responsive className="mt-4">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Stanička</CTableHeaderCell>
                  <CTableHeaderCell>Umístění</CTableHeaderCell>
                  <CTableHeaderCell>Služba</CTableHeaderCell>
                  <CTableHeaderCell>Nástraha</CTableHeaderCell>
                  <CTableHeaderCell>Limit</CTableHeaderCell>
                  <CTableHeaderCell>Akce</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredCheckpoints.length > 0 ? (
                  filteredCheckpoints.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{item.Číslo_staničky} {item.Označení_staničky && `(${item.Označení_staničky})`}</CTableDataCell>
                      <CTableDataCell>{item.Umistění}</CTableDataCell>
                      <CTableDataCell>{item.Služba}</CTableDataCell>
                      <CTableDataCell>{item.Nástraha}</CTableDataCell>
                      <CTableDataCell>{item.Target} {item.Vyhodnocení_jednotka}</CTableDataCell>
                      <CTableDataCell>
                        <CButton color="info" size="sm" onClick={() => handleShowTrend(item)}>
                          Zobrazit trend
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="6" className="text-center">
                      Žádné kontrolní body nebyly nalezeny.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </>
        )}
      </CCardBody>

      {/* Modální okno pro trend */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg" centered>
        <CModalHeader>
          <CModalTitle>Trend - {selectedCheckpoint?.Služba}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {trendLoading ? <CSpinner /> : trendError ? <p style={{ color: 'red' }}>{trendError}</p> : <CChartLine data={dataForChart} options={optionsForChart} style={{ height: '400px' }} />}
        </CModalBody>
      </CModal>
    </CCard>
  );
};

export default Checkpoints;