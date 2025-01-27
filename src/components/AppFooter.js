import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">&copy; 2025 Derator s.r.o.</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Podpora: </span>
        <a href="mailto:pavel.sedlacek@derator.cz" target="_blank" rel="noopener noreferrer">
        pavel.sedlacek@derator.cz
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
