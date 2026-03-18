import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function useLogout() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  return () => {
    const redirectPath = role === "manager" ? "/manager" : "/student";
    logout();
    navigate(redirectPath);
  };
}
