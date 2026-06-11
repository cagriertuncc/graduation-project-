import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePatientAuth } from '../context/PatientAuthContext';
import { useAccountantAuth } from '../context/AccountantAuthContext';
import { useIKAuth } from '../context/IKAuthContext';

const AUTO_LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes

export default function AutoLogout() {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);

  const { isAuthenticated, logout: doctorLogout } = useAuth();
  const { isPatientAuthenticated, logoutPatient } = usePatientAuth();
  const { isAccountantAuthenticated, logout: accountantLogout } = useAccountantAuth();
  const { isIKAuthenticated, logout: ikLogout } = useIKAuth();

  const isAnyAuthenticated = isAuthenticated || isPatientAuthenticated || isAccountantAuthenticated || isIKAuthenticated;

  const handleLogout = () => {
    // Determine the base path to redirect depending on which user is logged in
    let redirectPath = '/login';
    
    if (isPatientAuthenticated) redirectPath = '/hasta/giris';
    if (isAccountantAuthenticated) redirectPath = '/muhasebe/giris';
    if (isIKAuthenticated) redirectPath = '/ik/giris';
    // if admin or doctor is logged in, default adminlogin or login is fine

    if (isAuthenticated) doctorLogout();
    if (isPatientAuthenticated) logoutPatient();
    if (isAccountantAuthenticated) accountantLogout();
    if (isIKAuthenticated) ikLogout();
    
    navigate(redirectPath, { replace: true });
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (isAnyAuthenticated) {
      timeoutRef.current = setTimeout(handleLogout, AUTO_LOGOUT_TIME);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    const handleUserActivity = () => {
      resetTimeout();
    };

    if (isAnyAuthenticated) {
      resetTimeout();
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAnyAuthenticated, location.pathname]);

  return null;
}
