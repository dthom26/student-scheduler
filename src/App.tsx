import "./App.css";
import "./styles/theme.css";
import { useNavigate } from "react-router-dom";
import WeekGridWireframe from "./pages/studentView/WeekGridWireframe";
import ManagerScheduleWireframe from "./pages/managerView/ManagerScheduleWireframe";
import RoleSelector from "./components/RoleSelector";
import { useAuth } from "./context/AuthContext";

function App() {
  const { role, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div>Loading...</div>
        <div style={{ fontSize: "14px", marginTop: "10px", color: "#666" }}>
          Checking authentication status
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <RoleSelector />;
  }

  return (
    <div className="app-container">
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <main className="main-column">
          <button onClick={handleLogout} className="logout-button">
            Back
          </button>
          <section className="card">
            {role === "student" && (
              <>
                <h3 style={{ marginTop: 0 }}>Submit Your Availability</h3>
                <WeekGridWireframe />
              </>
            )}
            {role === "manager" && <ManagerScheduleWireframe />}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
