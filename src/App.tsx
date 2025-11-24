import './App.css';
import './styles/theme.css';
import { useNavigate } from 'react-router-dom';
import WeekGridWireframe from './pages/studentView/WeekGridWireframe';
import ManagerScheduleWireframe from './pages/managerView/ManagerScheduleWireframe';
import RoleSelector from './components/RoleSelector';
import { useAuth } from './context/AuthContext';

function App() {
  const { role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return <RoleSelector />;
  }

  return (
    <div className="app-container">
      <button onClick={handleLogout} className="logout-button">
        Back
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main className="main-column">
          <section className="card">
            {role === 'student' && (
              <>
                <h3 style={{ marginTop: 0 }}>Submit Your Availability</h3>
                <WeekGridWireframe />
              </>
            )}
            {role === 'manager' && (
              <ManagerScheduleWireframe />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App
