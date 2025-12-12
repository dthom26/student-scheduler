import "./App.css";
import "./styles/theme.css";
import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import { useAuth } from "./context/AuthContext";

// Lazy load the large components for code splitting
// These will be downloaded only when needed
const WeekGridWireframe = lazy(
  () => import("./pages/studentView/WeekGridWireframe")
);
const ManagerScheduleWireframe = lazy(
  () => import("./pages/managerView/ManagerScheduleWireframe")
);

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
            {/* Suspense wraps lazy-loaded components and shows fallback while loading */}
            <Suspense fallback={<LoadingView />}>
              {role === "student" && (
                <>
                  <h3 style={{ marginTop: 0 }}>Submit Your Availability</h3>
                  <WeekGridWireframe />
                </>
              )}
              {role === "manager" && <ManagerScheduleWireframe />}
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
}

// Loading component shown while lazy components download
function LoadingView() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px",
        flexDirection: "column",
      }}
    >
      <div style={{ fontSize: "18px", marginBottom: "10px" }}>Loading...</div>
      <div style={{ fontSize: "14px", color: "#666" }}>Preparing your view</div>
    </div>
  );
}

export default App;
