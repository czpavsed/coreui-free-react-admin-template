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

// Načtení API klíče z .env souboru pro Vite
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
        const response = await axios.get('/api/checkpoints', {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });

        const sortedData = response.data.sort((a, b) => a.Číslo_staničky - b.Číslo_staničky);
        setCheckpoints(sortedData);

        const uniqueServices = Array.from(new Set(sortedData.map((item) => item.Služba)));
        setServices(uniqueServices);

        const uniqueObjects = Array.from(new Set(sortedData.map((item) => item.Objekt)));
        setObjects(uniqueObjects);

        const uniqueSpaces = Array.from(new Set(sortedData.map((item) => item.Prostor)));
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
    setTrendLoading(true);
    setTrendError(null);

    try {
      const response = await axios.get('/api/vyhodnoceni', {
        params: { stanickaId },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      });
      setTrendData(response.data);
    } catch (error) {
      console.error('Chyba při načítání trendu:', error);
      setTrendError('Nepodařilo se načíst data trendu.');
    } finally {
      setTrendLoading(false);
    }
  };

  const handleShowTrend = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    fetchTrendData(checkpoint.stanickaId);
    setShowModal(true);
  };

  const filteredData = checkpoints.filter((item) => {
    return (
      (selectedService ? item.Služba === selectedService : true) &&
      (selectedObject ? item.Objekt === selectedObject : true) &&
      (selectedSpace ? item.Prostor === selectedSpace : true)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const dataForChart = {
    labels: trendData.map((data) => formatDate(data.Datum_zasahu)),
    datasets: [
      {
        label: 'Stav',
        backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
        borderColor: getStyle('--cui-info'),
        pointHoverBackgroundColor: getStyle('--cui-info'),
        borderWidth: 2,
        data: trendData.map((data) => data.Stav),
      },
      {
        label: 'Limit',
        backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .1)`,
        borderColor: getStyle('--cui-success'),
        pointHoverBackgroundColor: getStyle('--cui-success'),
        borderWidth: 2,
        data: trendData.map((data) => data.Target),
      },
    ],
  };

  const yAxisUnit = trendData.length > 0 ? trendData[0].Vyhodnocení_jednotka : '';

  return (
    <CCard className="mb-4">
      <CCardHeader>Přehled kontrolních bodů</CCardHeader>
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
            {/* Tabulka */} 
            <CTable hover responsive className="mt-4">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Stanička</CTableHeaderCell>
                  <CTableHeaderCell>Umístění</CTableHeaderCell>
                  <CTableHeaderCell>Služba</CTableHeaderCell>
                  <CTableHeaderCell>Nástraha</CTableHeaderCell>
                  <CTableHeaderCell>Akce</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>
                        {item.Číslo_staničky}
                        {item.Označení_staničky ? ` (${item.Označení_staničky})` : ''}
                      </CTableDataCell>
                      <CTableDataCell>{item.Umistění}</CTableDataCell>
                      <CTableDataCell>{item.Služba}</CTableDataCell>
                      <CTableDataCell>{item.Nástraha}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="info"
                          size="sm"
                          onClick={() => handleShowTrend(item)}
                        >
                          Zobrazit trend
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="5" className="text-center">
                      Žádné kontrolní body nebyly nalezeny.
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

export default Checkpoints;