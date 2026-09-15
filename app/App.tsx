import { AccessibilityProvider } from './src/features/accessibility/AccessibilityProvider';
import { AccessibilityPage } from './src/features/accessibility/AccessibilityPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AgendaPage } from './src/features/agenda/AgendaPage';
import { CatalogDetailPage } from './src/features/catalog/CatalogDetailPage';
import { CatalogEditPage, CatalogNewPage } from './src/features/catalog/CatalogEditPage';
import { CatalogPage } from './src/features/catalog/CatalogPage';
import { ClientDetailPage } from './src/features/clients/ClientDetailPage';
import { ClientsPage, EditClientPage, NewClientPage } from './src/features/clients/ClientsPage';
import { DashboardPage } from './src/features/dashboard/DashboardPage';
import { LoginPage } from './src/features/auth/LoginPage';
import { OrderDetailPage } from './src/features/orders/OrderDetailPage';
import { OrderEditPage } from './src/features/orders/OrderEditPage';
import { NewOrderPage, OrdersPage } from './src/features/orders/OrdersPage';
import { ProfilePage } from './src/features/profile/ProfilePage';
import { StockDetailPage } from './src/features/stock/StockDetailPage';
import { StockEditPage, StockNewPage } from './src/features/stock/StockEditPage';
import { StockPage } from './src/features/stock/StockPage';
import './src/theme/global.css';

function App() {
  return (
    <AccessibilityProvider><BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<AgendaPage />} path="/agenda" />
        <Route element={<OrdersPage />} path="/pedidos" />
        <Route element={<NewOrderPage />} path="/pedidos/novo" />
        <Route element={<OrderEditPage />} path="/pedidos/:id/editar" />
        <Route element={<OrderDetailPage />} path="/pedidos/:id" />
        <Route element={<ClientsPage />} path="/clientes" />
        <Route element={<NewClientPage />} path="/clientes/novo" />
        <Route element={<EditClientPage />} path="/clientes/:id/editar" />
        <Route element={<ClientDetailPage />} path="/clientes/:id" />
        <Route element={<CatalogPage />} path="/catalogo" />
        <Route element={<CatalogNewPage />} path="/catalogo/novo" />
        <Route element={<CatalogEditPage />} path="/catalogo/:id/editar" />
        <Route element={<CatalogDetailPage />} path="/catalogo/:id" />
        <Route element={<StockPage />} path="/estoque" />
        <Route element={<StockNewPage />} path="/estoque/novo" />
        <Route element={<StockEditPage />} path="/estoque/:id/editar" />
        <Route element={<StockDetailPage />} path="/estoque/:id" />
        <Route element={<AccessibilityPage />} path="/perfil/acessibilidade" />
        <Route element={<ProfilePage />} path="/perfil" />
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </BrowserRouter></AccessibilityProvider>
  );
}

export default App;
