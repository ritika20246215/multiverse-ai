import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import FuturePage from "./pages/FuturePage.jsx";
import HomePage from "./pages/HomePage.jsx";
import QuizPage from "./pages/QuizPage.jsx";

const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route
      path="/quiz"
      element={
        <ProtectedRoute>
          <QuizPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="future" element={<FuturePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
