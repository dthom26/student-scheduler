import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentAuth from "../components/StudentAuth";

export default function StudentLoginPage() {
  const { isAuthenticated, authenticateStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleStudentAuthenticated = (data: any) => {
    authenticateStudent(data);
    navigate("/", { replace: true });
  };

  return <StudentAuth onStudentAuthenticated={handleStudentAuthenticated} />;
}
