import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AgendaPage } from './src/features/agenda/AgendaPage';
import { CatalogDetailPage } from './src/features/catalog/CatalogDetailPage';
import { CatalogPage } from './src/features/catalog/CatalogPage';
import { ClientDetailPage } from './src/features/clients/ClientDetailPage';
import { ClientsPage, NewClientPage } from './src/features/clients/ClientsPage';
import { DashboardPage } from './src/features/dashboard/DashboardPage';
import { LoginPage } from './src/features/auth/LoginPage';
import { OrderDetailPage } from './src/features/orders/OrderDetailPage';
import { NewOrderPage, OrdersPage } from './src/features/orders/OrdersPage';
import { ProfilePage } from './src/features/profile/ProfilePage';
import { StockDetailPage } from './src/features/stock/StockDetailPage';
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
        <Route element={<OrderDetailPage />} path="/pedidos/:id" />
        <Route element={<ClientsPage />} path="/clientes" />
        <Route element={<NewClientPage />} path="/clientes/novo" />
        <Route element={<ClientDetailPage />} path="/clientes/:id" />
        <Route element={<CatalogPage />} path="/catalogo" />
        <Route element={<CatalogDetailPage />} path="/catalogo/:id" />
        <Route element={<StockPage />} path="/estoque" />
        <Route element={<StockDetailPage />} path="/estoque/:id" />
        <Route element={<ProfilePage />} path="/perfil" />
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
