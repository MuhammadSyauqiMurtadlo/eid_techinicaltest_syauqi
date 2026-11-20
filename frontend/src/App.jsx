import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { GuestRoute, ProtectedRoute } from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Machines from "./pages/Machines.jsx";
import Operators from "./pages/Operators.jsx";
import Production from "./pages/Production.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="machines" element={<Machines />} />
        <Route
          path="operators"
          element={
            <ProtectedRoute roles={["administrator"]}>
              <Operators />
            </ProtectedRoute>
          }
        />
        <Route path="production" element={<Production />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
