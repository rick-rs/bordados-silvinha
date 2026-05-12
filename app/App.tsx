import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from './src/features/dashboard/DashboardPage';
import { LoginPage } from './src/features/auth/LoginPage';
import './src/theme/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
