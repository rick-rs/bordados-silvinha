import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AgendaPage } from './src/features/agenda/AgendaPage';
import { CatalogPage } from './src/features/catalog/CatalogPage';
import { ClientsPage, NewClientPage } from './src/features/clients/ClientsPage';
import { DashboardPage } from './src/features/dashboard/DashboardPage';
import { LoginPage } from './src/features/auth/LoginPage';
import { NewOrderPage, OrdersPage } from './src/features/orders/OrdersPage';
import { ProfilePage } from './src/features/profile/ProfilePage';
import { StockPage } from './src/features/stock/StockPage';
import './src/theme/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<AgendaPage />} path="/agenda" />
        <Route element={<OrdersPage />} path="/pedidos" />
        <Route element={<NewOrderPage />} path="/pedidos/novo" />
        <Route element={<ClientsPage />} path="/clientes" />
        <Route element={<NewClientPage />} path="/clientes/novo" />
        <Route element={<CatalogPage />} path="/catalogo" />
        <Route element={<StockPage />} path="/estoque" />
        <Route element={<ProfilePage />} path="/perfil" />
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
