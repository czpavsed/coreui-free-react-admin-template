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
  CAlert,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { auth } from "../../../firebaseConfig";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import logo from "src/assets/images/Logo.png";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // Pro ukládání UI hlášek
  const [userForVerification, setUserForVerification] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setUserForVerification(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setUserForVerification(user); // Uložíme uživatele pro možnost znovu odeslat ověření
        setMessage(
          <>
            <p>Váš e-mail není ověřen! Zkontrolujte svou e-mailovou schránku.</p>
            <CButton color="link" size="sm" onClick={() => resendVerificationEmail(user)}>
              Znovu odeslat ověřovací e-mail
            </CButton>
          </>
        );
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
      navigate("/");
    } catch (error) {
      console.error(error);
      setMessage("Chyba přihlášení. Prosím, zkontrolujte email a heslo.");
    }
  };

  const resendVerificationEmail = async (user) => {
    try {
      await sendEmailVerification(user);
      setMessage("Ověřovací e-mail byl znovu odeslán.");
    } catch (error) {
      console.error("Chyba při odesílání ověřovacího e-mailu:", error);
      setMessage("Chyba při odesílání ověřovacího e-mailu. Zkuste to znovu.");
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

                  {/* Zobrazení hlášek přímo v UI */}
                  {message && <CAlert color="info">{message}</CAlert>}

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

                  <div className="mt-4 text-center">
                    <p>
                      V případě, že nemáte registraci do našeho systému, zaregistrujte se prosím
                      emailem, kterým s námi komunikujete. <Link to="/register">Registrovat</Link>
                    </p>
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
