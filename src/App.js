import React, { useEffect, useState } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { UserProvider } from './components/UserContext'
import './scss/style.scss'

// Firebase
import { auth } from './firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'

const loading = (
  <div className="pt-3 text-center">
    <div className="sk-spinner sk-spinner-pulse"></div>
  </div>
)

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

function App() {
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setInitializing(false)
    })

    return () => unsubscribe()
  }, [])

  const PrivateRoute = ({ element }) => {
    if (initializing) {
      return loading
    }
    return auth.currentUser ? element : <Navigate to="/login" />
  }

  return (
    <UserProvider>
      <HashRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true, // Přidán nový future flag
        }}
      >
        <React.Suspense fallback={loading}>
          <Routes>
            <Route path="/login" name="Login Page" element={<Login />} />
            <Route path="/register" name="Register Page" element={<Register />} />
            <Route path="/404" name="Page 404" element={<Page404 />} />
            <Route path="/500" name="Page 500" element={<Page500 />} />
            <Route path="*" name="Home" element={<PrivateRoute element={<DefaultLayout />} />} />
          </Routes>
        </React.Suspense>
      </HashRouter>
    </UserProvider>
  )
}

export default App
