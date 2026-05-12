import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ClientsPage, NewClientPage } from './src/features/clients/ClientsPage';
import { DashboardPage } from './src/features/dashboard/DashboardPage';
import { LoginPage } from './src/features/auth/LoginPage';
import { ProfilePage } from './src/features/profile/ProfilePage';
import './src/theme/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<ClientsPage />} path="/clientes" />
        <Route element={<NewClientPage />} path="/clientes/novo" />
        <Route element={<ProfilePage />} path="/perfil" />
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
