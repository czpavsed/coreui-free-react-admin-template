import React from 'react'
import { CCard, CCardBody, CButton, CCardHeader } from '@coreui/react'
import { cilArrowCircleLeft } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const PDFViewer = ({ pdfUrl, onBack }) => {
  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Zobrazení PDF dokumentu</h5>
        <CButton color="primary" onClick={onBack}>
          <CIcon icon={cilArrowCircleLeft} className="me-2" />
          Zpět do seznamu kontrol
        </CButton>
      </CCardHeader>

      <CCardBody style={{ height: '80vh', padding: 0 }}>
        <iframe
          src={pdfUrl}
          title="PDF Viewer"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </CCardBody>
    </CCard>
  )
}

export default PDFViewer
