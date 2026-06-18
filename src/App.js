import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/glass-theme.css';

import authService from './services/authService';
import { HospitalProvider } from './components/HospitalContext';
import AppShell from './components/Layout/AppShell';

// Views
import Login from './views/Login';
import AdminLayout from './views/AdminLayout';

// Components
import Dashboard from './components/Dashboard/Dashboard';
import ClaimSearch from './components/ClaimSearch';
import PolicySearch from './components/PolicySearch';
import Registration from './components/Registration/Registration';
import RegistrationDuplicate from './components/RegistrationDuplicate/RegistrationDuplicate';
import PoolSelection from './components/PoolSelection';
import MyTask from './components/MyTask';
import UserManager from './components/UserManagement/UserManager';

// Registration sub-routes
import ClaimantDetails from './components/Registration/ClaimantDetails';
import LifeAssuredDetails from './components/Registration/LifeAssuredDetails';
import AgentRepudationHistory from './components/Registration/AgentRepudationHistory';
import ContactDetails from './components/Registration/ContactDetails';
import EagleScreen from './components/Registration/EagleScreen';
import Requirement from './components/Registration/Requirement/Requirement';
import Requirement1 from './components/Registration/Requirement/Requirement1';
import Requirement2 from './components/Registration/Requirement/Requirement2';
import Decision from './components/Registration/Decision/Decision';
import System from './components/Registration/Decision/System';
import Accessor from './components/Registration/Decision/Accessor';
import Verification from './components/Registration/Decision/Verification';
import Summary from './components/Registration/Decision/Summary';

// Duplicate (assessor fetch) sub-routes
import ClaimantDetailsDuplicate from './components/RegistrationDuplicate/ClaimantDetailsDuplicate';
import LifeAssuredDetailsDuplicate from './components/RegistrationDuplicate/LifeAssuredDetailsDuplicate';
import AgentRepudationHistoryDuplicate from './components/RegistrationDuplicate/AgentRepudationHistoryDuplicate';
import ContactDetailsDuplicate from './components/RegistrationDuplicate/ContactDetailsDuplicate';
import EagleScreenDuplicate from './components/RegistrationDuplicate/EagleScreenDuplicate';
import RequirementDuplicate from './components/RegistrationDuplicate/RequirementDuplicate';
import Requirement1Duplicate from './components/RegistrationDuplicate/Requirement1Duplicate';
import Requirement2Duplicate from './components/RegistrationDuplicate/Requirement2Duplicate';
import DecisionDuplicate from './components/RegistrationDuplicate/DecisionDuplicate';
import AssessmentDuplicate from './components/RegistrationDuplicate/AssessmentDuplicate';

// Add screen
import AddScreen from './components/Add/AddScreen';
import CaseDetails from './components/Add/CaseDetails/CaseDetails';

const ADMIN_ROUTE_ENABLED = true;
const IDLE_TIME = 15 * 60 * 1000;

export const AuthContext = createContext({
  authenticated: false,
  login: () => {},
  username: '',
  role: '',
  setAuthenticated: () => {},
});

// ── ProtectedRoute ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ component: Component, requiredRole, ...rest }) => {
  const { authenticated, username, role } = useContext(AuthContext);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!authenticated) {
          return <Redirect to={{ pathname: '/login', state: { reason: 'session_expired' } }} />;
        }

        if (requiredRole) {
          const userRoles = Array.isArray(role) ? role : [role];
          const hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.some((r) => userRoles.includes(r))
            : userRoles.includes(requiredRole);

          if (!hasRequiredRole) {
            console.warn(`Access denied for route ${rest.path}. Required: ${requiredRole}, Found: ${role}`);
            toast.error('You do not have permission to access this page.');
            return <Redirect to="/dashboard" />;
          }
        }

        return <Component {...props} username={username} role={role} />;
      }}
    />
  );
};

// ── App ─────────────────────────────────────────────────────────────────────
const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  const idleTimerRef = useRef(null);

  // ── Auth init ──
  useEffect(() => {
    try {
      const { preferred_username, roles } = authService.authenticate();
      setAuthenticated(true);
      setUsername(preferred_username);
      setRole(roles);
    } catch {
      setAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sync username to sessionStorage ──
  useEffect(() => {
    if (username) sessionStorage.setItem('loggedUser', username);
  }, [username]);

  // ── Idle timer ──
  useEffect(() => {
    if (!authenticated) return;

    const resetTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        sessionStorage.setItem('auth_logout_reason', 'idle');
        authService.logout();
        setAuthenticated(false);
      }, IDLE_TIME);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [authenticated]);

  const login = () => {
    try {
      const { preferred_username, roles } = authService.authenticate();
      setAuthenticated(true);
      setUsername(preferred_username);
      setRole(roles);
    } catch {
      setAuthenticated(false);
    }
  };

  const rolesArray = Array.isArray(role) ? role : [role];

  if (loading) {
    return (
      <div className="glass-loading" style={{ minHeight: '100vh' }}>
        <div className="glass-spinner" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, login, username, role, setAuthenticated }}>
      <HospitalProvider>
        <Router>
          <Switch>
            {/* Login */}
            <Route
              path="/login"
              render={(props) =>
                authenticated ? <Redirect to="/dashboard" /> : <Login {...props} login={login} />
              }
            />

            {/* Admin */}
            {ADMIN_ROUTE_ENABLED && (
              <Route
                path="/admin"
                render={(props) => {
                  const isAdmin = rolesArray.includes('admin');
                  if (!isAdmin) return <Redirect to="/dashboard" />;
                  return <AdminLayout {...props} setAuthenticated={setAuthenticated} />;
                }}
              />
            )}

            {/* Root redirect */}
            <Route
              exact
              path="/"
              render={() => {
                if (!authenticated) return <Redirect to="/login" />;
                if (rolesArray.length === 1 && rolesArray.includes('admin')) return <Redirect to="/admin" />;
                return <Redirect to="/dashboard" />;
              }}
            />

            {/* Main app shell */}
            <Route
              render={() => {
                if (!authenticated) return <Redirect to="/login" />;

                return (
                  <AppShell
                    username={username}
                    role={role}
                    setAuthenticated={setAuthenticated}
                  >
                    <Switch>
                          <ProtectedRoute path="/dashboard" component={Dashboard} />
                          <ProtectedRoute path="/claim-search" component={ClaimSearch} />
                          <ProtectedRoute path="/user-manager" component={UserManager} requiredRole="admin" />

                          {/* Pre-Assessor routes */}
                          <ProtectedRoute path="/policy-search" component={PolicySearch} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/registration" component={Registration} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/claimant-details" component={ClaimantDetails} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/life-assured-details" component={LifeAssuredDetails} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/agent-repudation-history" component={AgentRepudationHistory} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/contact-details" component={ContactDetails} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/eagle-screen" component={EagleScreen} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/requirement" component={Requirement} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/requirement1" component={Requirement1} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/requirement2" component={Requirement2} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/decision" component={Decision} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/system" component={System} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/accessor" component={Accessor} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/verification" component={Verification} requiredRole="Pre Assessor" />
                          <ProtectedRoute path="/summary" component={Summary} requiredRole="Pre Assessor" />

                          {/* Fetch (assessor view) routes */}
                          <ProtectedRoute path="/registration-fetch/:claimNo" component={RegistrationDuplicate} />
                          <ProtectedRoute path="/claimant-details-fetch" component={ClaimantDetailsDuplicate} />
                          <ProtectedRoute path="/life-assured-details-fetch" component={LifeAssuredDetailsDuplicate} />
                          <ProtectedRoute path="/agent-repudation-history-fetch" component={AgentRepudationHistoryDuplicate} />
                          <ProtectedRoute path="/contact-details-fetch" component={ContactDetailsDuplicate} />
                          <ProtectedRoute path="/eagle-screen-fetch" component={EagleScreenDuplicate} />
                          <ProtectedRoute path="/requirement-fetch" component={RequirementDuplicate} />
                          <ProtectedRoute path="/requirement1-fetch" component={Requirement1Duplicate} />
                          <ProtectedRoute path="/requirement2-fetch" component={Requirement2Duplicate} />
                          <ProtectedRoute path="/decision-fetch" component={DecisionDuplicate} />
                          <ProtectedRoute path="/assessment-fetch" component={AssessmentDuplicate} />

                          {/* Assessor/Verifier routes */}
                          <ProtectedRoute path="/assessor-pool" component={PoolSelection} requiredRole={['Assessor', 'Verifier']} />
                          <ProtectedRoute path="/my-task" component={MyTask} requiredRole={['Assessor', 'Verifier']} />
                          <ProtectedRoute path="/add-screen" component={AddScreen} requiredRole={['Assessor', 'Verifier']} />
                          <ProtectedRoute path="/case/:id" component={CaseDetails} requiredRole={['Assessor', 'Verifier']} />

                      <Redirect from="*" to="/dashboard" />
                    </Switch>
                  </AppShell>
                );
              }}
            />
          </Switch>
          <ToastContainer position="top-right" autoClose={4000} />
        </Router>
      </HospitalProvider>
    </AuthContext.Provider>
  );
};

export default App;
