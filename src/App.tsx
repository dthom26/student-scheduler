import "./App.css";
import "./styles/theme.css";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StudentLoginPage from "./pages/StudentLoginPage";
import ManagerLoginPage from "./pages/ManagerLoginPage";
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
  const { role, isAuthenticated, isLoading, studentData } = useAuth();

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

  return (
    <Routes>
      <Route path="/student" element={<StudentLoginPage />} />
      <Route path="/manager" element={<ManagerLoginPage />} />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <div className="app-container">
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <main className="main-column">
                  <section className="card">
                    {/* Suspense wraps lazy-loaded components and shows fallback while loading */}
                    <Suspense fallback={<LoadingView />}>
                      {role === "student" && studentData && (
                        <WeekGridWireframe key={studentData.studentId} />
                      )}
                      {role === "manager" && <ManagerScheduleWireframe />}
                    </Suspense>
                  </section>
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/student" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
