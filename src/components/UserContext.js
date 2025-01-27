import React, { createContext, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null)
  const [zakaznikId, setZakaznikId] = useState(null)
  const [zakaznikNazev, setZakaznikNazev] = useState('')
  const [zakaznikIC, setZakaznikIC] = useState(null)

  return (
    <UserContext.Provider
      value={{
        userEmail,
        setUserEmail,
        zakaznikId,
        setZakaznikId,
        zakaznikNazev,
        setZakaznikNazev,
        zakaznikIC,
        setZakaznikIC

      }}
    >
      {children}
    </UserContext.Provider>
  )
}
