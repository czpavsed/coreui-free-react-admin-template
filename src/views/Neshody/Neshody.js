import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CSpinner,
  CForm,
  CFormInput,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';
import CIcon from '@coreui/icons-react';
import { cilTrash } from '@coreui/icons';
import PhotoUploader from "./PhotoUploader";

const Neshody = () => {
  const { zakaznikId, userEmail } = useContext(UserContext);
  const [neshody, setNeshody] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNeshoda, setSelectedNeshoda] = useState(null);
  const [popisNapravy, setPopisNapravy] = useState('');
  const [kdoNapravoval, setKdoNapravoval] = useState('');
  const [datumNapravy, setDatumNapravy] = useState('');
  const [fotoNapravyUrl, setFotoNapravyUrl] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [photos, setPhotos] = useState({ nalez: [], naprava: [] });
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveDate, setResolveDate] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Nový stav pro dropdown status
  const [status, setStatus] = useState('Nová');

  const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
  const API_BASE_URL = import.meta.env.VITE_API_API_URL;

  const formatDateToCzech = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Funkce pro zobrazení statusu jako barevného labelu s využitím šablonových tříd
  const renderStatusLabel = (status) => {
    switch (status) {
      case 'Nová':
        return <span className="badge bg-warning">{status}</span>;
      case 'Probíhá':
        return <span className="badge bg-primary">{status}</span>;
      case 'Vyřešeno':
        return <span className="badge bg-success">{status}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const handlePhotoClick = (url) => {
    setModalPhotoUrl(url);
    setIsModalOpen(true);
  };

  const handleDeletePhoto = async (fotoBlobUrl) => {
    const blobName = fotoBlobUrl
      .split('?')[0]
      .replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');
    try {
      await axios.delete(`${API_BASE_URL}delete-blob-storage`, {
        params: { blobName },
        headers: { 'Authorization': `Bearer ${API_ACCESS_KEY}` },
      });
      setToastMessage('Fotografie byla úspěšně smazána.');
      fetchPhotosWithSasTokens(selectedNeshoda.NeshodaId);
    } catch (error) {
      console.error('Chyba při mazání fotografie:', error);
      setToastMessage('Chyba při mazání fotografie.');
    }
  };

  useEffect(() => {
    if (!zakaznikId) {
      console.log('Čekám na načtení ZakaznikId...');
      return;
    }
    fetchNeshody();
  }, [zakaznikId]);

  const fetchNeshody = async () => {
    if (!zakaznikId) {
      setError('ZakaznikId není dostupné.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}neshody`, {
        params: { zakaznikId },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      });
      setNeshody(response.data);
    } catch (err) {
      console.error('Chyba při načítání neshod:', err);
      setError('Nepodařilo se načíst neshody.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotosWithSasTokens = async (neshodaId) => {
    if (!neshodaId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}neshody-foto`, {
        params: { neshodaId },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      });
      const photosWithSas = await Promise.all(
        response.data.map(async (photo) => {
          try {
            const sasResponse = await axios.get(`${API_BASE_URL}download`, {
              params: { blobName: photo.FotoBlobUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', ''), type: 'view' },
              headers: {
                'Authorization': `Bearer ${API_ACCESS_KEY}`,
              },
            });
            return { ...photo, FotoBlobUrl: sasResponse.data.url };
          } catch (err) {
            console.error('Chyba při získávání SAS tokenu:', err);
            return { ...photo, FotoBlobUrl: null };
          }
        })
      );
      const nalezPhotos = photosWithSas.filter(photo => photo.TypNeshody === 'Nalez');
      const napravaPhotos = photosWithSas.filter(photo => photo.TypNeshody === 'Naprava');
      setPhotos({ nalez: nalezPhotos, naprava: napravaPhotos });
    } catch (err) {
      console.error('Chyba při načítání fotografií:', err);
      setError('Nepodařilo se načíst fotografie.');
    }
  };

  useEffect(() => {
    if (selectedNeshoda) {
      fetchPhotosWithSasTokens(selectedNeshoda.NeshodaId);
    }
  }, [selectedNeshoda]);

  const handleEditToggle = (neshoda) => {
    if (selectedNeshoda && selectedNeshoda.NeshodaId === neshoda.NeshodaId) {
      setSelectedNeshoda(null);
    } else {
      setSelectedNeshoda(neshoda);
      setPopisNapravy(neshoda.PopisNapravy || '');
      setKdoNapravoval(userEmail || neshoda.KdoNapravoval || '');
      // Pouze datum ve formátu YYYY-MM-DD
      setDatumNapravy(
        neshoda.DatumNapravy ? new Date(neshoda.DatumNapravy).toISOString().slice(0, 10) : ''
      );
      setFotoNapravyUrl(neshoda.FotoNapravyUrl || '');
      setStatus(neshoda.Status || 'Nová');
    }
  };

  const handleViewPhoto = (fullUrl) => {
    const blobName = fullUrl.replace('https://deratorportal.blob.core.windows.net/zakaznici-soubory/', '');
    axios
      .get(`${API_BASE_URL}download`, {
        params: { blobName, type: 'view' },
        headers: {
          'Authorization': `Bearer ${API_ACCESS_KEY}`,
        },
      })
      .then((response) => {
        setSelectedPhotoUrl(response.data.url);
      })
      .catch((error) => {
        console.error('Chyba při načítání fotografie:', error);
        setError('Nepodařilo se načíst fotografii.');
      });
  };

  const handleBackToList = () => {
    setSelectedNeshoda(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zakaznikId) {
      setError('ZakaznikId není dostupné.');
      return;
    }
    setLoading(true);
    setError(null);
    const formattedDatumNapravy = datumNapravy
      ? new Date(datumNapravy).toISOString()
      : null;
    const body = {
      NeshodaId: selectedNeshoda.NeshodaId,
      PopisNapravy: popisNapravy,
      KdoNapravoval: kdoNapravoval,
      DatumNapravy: formattedDatumNapravy,
      Status: status,
      FotoNapravyUrl: fotoNapravyUrl,
    };
    console.log('Odesílám data na server:', body);
    try {
      const response = await axios.post(
        `${API_BASE_URL}update-naprava-neshoda`,
        body,
        {
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        setToastMessage('Záznam byl úspěšně aktualizován.');
        setSelectedNeshoda(null);
        setPopisNapravy('');
        setKdoNapravoval('');
        setDatumNapravy('');
        setFotoNapravyUrl('');
        fetchNeshody();
      }
    } catch (err) {
      console.error('Chyba při ukládání nápravy:', err);
      setError('Chyba při ukládání nápravy.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (neshoda) => {
    setSelectedNeshoda(neshoda);
    setResolveDate(new Date().toISOString().slice(0, 16));
    setShowResolveForm(true);
  };

  const handlePhotoUploadSuccess = (url) => {
    if (!zakaznikId) {
      console.error('ZakaznikId není dostupné.');
      setError('ZakaznikId není dostupné.');
      return;
    }
    setFotoNapravyUrl(url);
    setToastMessage('Fotografie byla úspěšně nahrána.');
    fetchPhotosWithSasTokens(selectedNeshoda.NeshodaId);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!zakaznikId) {
      setError('ZakaznikId není dostupné.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let photoUrl = null;
      if (resolvePhoto) {
        const formData = new FormData();
        formData.append('file', resolvePhoto);
        const uploadResponse = await axios.post(
          `${API_BASE_URL}upload-blob-storage?blobName=neshody/${zakaznikId}/${resolvePhoto.name}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${API_ACCESS_KEY}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Odpověď z upload-blob-storage:', uploadResponse);
        if (uploadResponse.status === 200 && uploadResponse.data.url) {
          photoUrl = uploadResponse.data.url;
          console.log('Fotografie byla úspěšně nahrána:', photoUrl);
        } else {
          throw new Error(uploadResponse.data.message || 'Chyba při nahrávání fotografie.');
        }
      }
      if (photoUrl) {
        setFotoNapravyUrl(photoUrl);
        await handleSubmit({
          preventDefault: () => {},
        });
        setShowResolveForm(false);
      }
    } catch (err) {
      console.error('Chyba při aktualizaci databáze:', err);
      setError('Chyba při aktualizaci databáze.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <h4>Nalezené neshod</h4>
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
          <>
            <CTable hover responsive>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Datum</CTableHeaderCell>
                  <CTableHeaderCell>Technik</CTableHeaderCell>
                  <CTableHeaderCell>Popis</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Akce</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {neshody.map((item) => (
                  <CTableRow key={item.NeshodaId}>
                    <CTableDataCell>{formatDateToCzech(item.DatumNalezu)}</CTableDataCell>
                    <CTableDataCell>{item.Technik}</CTableDataCell>
                    <CTableDataCell>{item.Popis}</CTableDataCell>
                    <CTableDataCell>
                      {renderStatusLabel(item.Status || 'Neřešeno')}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="info" size="sm" onClick={() => handleEditToggle(item)}>
                        {selectedNeshoda && selectedNeshoda.NeshodaId === item.NeshodaId ? 'Zpět na seznam' : 'Detail'}
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            {selectedNeshoda && (
              <CCard className="mt-4">
                <CCardHeader>
                  <h5>Detail neshody</h5>
                </CCardHeader>
                <CCardBody>
                  {/* Oddělená sekce pro foto-dokumentaci nálezu */}
                  <h6>Foto-dokumentace nálezu</h6>
                  <div className="d-flex flex-wrap">
                    {photos.nalez && photos.nalez.length > 0 ? (
                      photos.nalez.map((photo, index) => (
                        <img
                          key={index}
                          src={photo.FotoBlobUrl}
                          alt={`Nalez ${index + 1}`}
                          style={{
                            maxWidth: '150px',
                            maxHeight: '150px',
                            margin: '5px',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          onClick={() => handlePhotoClick(photo.FotoBlobUrl)}
                        />
                      ))
                    ) : (
                      <p>Foto-dokumentace nálezu není k dispozici.</p>
                    )}
                  </div>
                  <p>
                    <strong>Popis:</strong> {selectedNeshoda.Popis}
                  </p>

                  {/* Sekce pro foto-dokumentaci nápravy */}
                  <div className="mt-4">
                    <h6>Foto-dokumentace nápravy</h6>
                    <div className="d-flex flex-wrap">
                      {photos.naprava && photos.naprava.length > 0 ? (
                        photos.naprava.map((photo, index) => (
                          <div
                            key={index}
                            style={{ position: 'relative', margin: '5px' }}
                          >
                            <img
                              src={photo.FotoBlobUrl}
                              alt={`Naprava ${index + 1}`}
                              style={{
                                maxWidth: '150px',
                                maxHeight: '150px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                              }}
                              onClick={() => handlePhotoClick(photo.FotoBlobUrl)}
                            />
                            <CButton
                              color="danger"
                              size="sm"
                              style={{ position: 'absolute', top: '5px', right: '5px' }}
                              onClick={() => handleDeletePhoto(photo.FotoBlobUrl)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </div>
                        ))
                      ) : (
                        <p>Foto-dokumentace nápravy není k dispozici.</p>
                      )}
                    </div>
                  </div>

                  {/* Nadpis formuláře na samostatném řádku */}
                  <h6 className="mt-4">Upravit neshodu</h6>
                  {/* Formulář pro úpravu nápravy */}
                  <CForm
                    onSubmit={handleSubmit}
                    className="mt-3 p-3 rounded"
                    style={{ backgroundColor: 'var(--cui-body-bg)' }}
                  >
                    <div className="d-flex mb-2">
                      <CFormInput
                        type="date"
                        value={datumNapravy}
                        onChange={(e) => setDatumNapravy(e.target.value)}
                        className="me-2"
                        style={{ flex: 1 }}
                      />
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="form-select"
                        style={{ flex: 1 }}
                      >
                        <option value="Nová">Nová</option>
                        <option value="Probíhá">Probíhá</option>
                        <option value="Vyřešeno">Vyřešeno</option>
                      </select>
                    </div>
                    <CFormInput
                      type="text"
                      value={popisNapravy}
                      onChange={(e) => setPopisNapravy(e.target.value)}
                      placeholder="Popis nápravy"
                      className="mb-2"
                    />
                    <PhotoUploader
                      zakaznikId={zakaznikId}
                      neshodaId={selectedNeshoda.NeshodaId}
                      onUploadSuccess={handlePhotoUploadSuccess}
                    />
                    <CButton type="submit" color="success" className="mt-3">
                      Uložit změny
                    </CButton>
                  </CForm>
                </CCardBody>
              </CCard>
            )}
          </>
        )}
        {toastMessage && (
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
            <div
              className="toast show align-items-center text-bg-success border-0"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div className="d-flex">
                <div className="toast-body">{toastMessage}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  aria-label="Close"
                  onClick={() => setToastMessage(null)}
                ></button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pro zvětšení fotografie */}
        <CModal visible={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <CModalHeader>Zvětšená fotografie</CModalHeader>
          <CModalBody className="text-center">
            {modalPhotoUrl && (
              <img
                src={modalPhotoUrl}
                alt="Zvětšená fotografie"
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setIsModalOpen(false)}>
              Zavřít
            </CButton>
          </CModalFooter>
        </CModal>
      </CCardBody>
    </CCard>
  );
};

export default Neshody;
