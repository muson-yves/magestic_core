import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }    from './context/AuthContext';
import { ThemeProvider }   from './context/ThemeContext';
import { BuyerProvider }   from './context/BuyerContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProtectedRoute    from './components/ProtectedRoute';
import Home              from './pages/Home';
import ProductDetail     from './pages/ProductDetail';
import Auth              from './pages/Auth';
import Cart              from './pages/Cart';
import Orders            from './pages/Orders';
import Wishlist          from './pages/Wishlist';
import Account           from './pages/Account';
import AdminLogin        from './pages/AdminLogin';
import Dashboard         from './pages/Dashboard';
import AdminOrders       from './pages/AdminOrders';
import AdminBuyers       from './pages/AdminBuyers';

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
      <AuthProvider>
        <BuyerProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"                  element={<Home />} />
              <Route path="/product/:id"       element={<ProductDetail />} />
              <Route path="/auth"              element={<Auth />} />
              <Route path="/cart"              element={<Cart />} />
              <Route path="/orders"            element={<Orders />} />
              <Route path="/wishlist"          element={<Wishlist />} />
              <Route path="/account"           element={<Account />} />
              <Route path="/admin"             element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login"       element={<AdminLogin />} />
              <Route path="/admin/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/orders"      element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/buyers"      element={<ProtectedRoute><AdminBuyers /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </BuyerProvider>
      </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
