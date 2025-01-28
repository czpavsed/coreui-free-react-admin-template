import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert, // Přidáme alert komponentu pro zobrazení zpráv
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { auth } from "../../../firebaseConfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import logo from "src/assets/images/Logo.png";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Stav pro chybovou zprávu
  const [successMessage, setSuccessMessage] = useState(""); // Stav pro úspěšnou zprávu
  const navigate = useNavigate();

  // 🔹 Funkce pro reset hesla
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage("Zadejte prosím svůj e-mail.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Na váš e-mail byl odeslán odkaz pro reset hesla.");
    } catch (error) {
      console.error("Chyba při odesílání resetovacího e-mailu:", error);
      setErrorMessage("Chyba při odeslání e-mailu. Zkontrolujte, zda je e-mail správný.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Resetuje chybovou zprávu před novým pokusem
    setSuccessMessage(""); // Resetuje úspěšnou zprávu

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setErrorMessage("Váš e-mail není ověřen! Zkontrolujte svou e-mailovou schránku.");
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
      navigate("/");
    } catch (error) {
      console.error(error);
      setErrorMessage("Chyba přihlášení. Prosím, zkontrolujte e-mail a heslo.");
    }
  };

  return (
    <div className="login-page">
      <img src={logo} alt="Logo" className="login-logo" />
      <CContainer className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <CRow className="justify-content-center w-100">
          <CCol md={6} lg={5}>
            <CCard className="p-4 shadow-lg login-card">
              <CCardBody>
                <CForm onSubmit={handleLogin}>
                  <h1>Přihlášení</h1>
                  <p className="text-body-secondary">Přihlašte se prosím.</p>

                  {/* 🔹 Zobrazení chybové zprávy */}
                  {errorMessage && <CAlert color="danger">{errorMessage}</CAlert>}
                  
                  {/* 🔹 Zobrazení úspěšné zprávy */}
                  {successMessage && <CAlert color="success">{successMessage}</CAlert>}

                  {/* EMAIL */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </CInputGroup>

                  {/* HESLO */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Heslo"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </CInputGroup>

                  <CButton type="submit" color="primary" className="w-100">
                    Přihlásit
                  </CButton>

                  {/* 🔹 Tlačítko pro reset hesla */}
                  <div className="mt-3 text-center">
                    <CButton color="link" className="px-0" onClick={handleForgotPassword}>
                      Zapomenuté heslo?
                    </CButton>
                  </div>

                  <div className="mt-3 text-center">
                    Nemáte účet? <Link to="/register">Registrujte se</Link>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;