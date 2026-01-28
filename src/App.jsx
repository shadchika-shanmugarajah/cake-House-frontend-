// src/App.jsx (UPDATED)
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Client Pages
import Home from './pages/client/Home';
import Login from './pages/client/Login';
import Register from './pages/client/Register';
import Products from './pages/client/Products';
import ProductDetail from './pages/client/ProductDetail';
import Cart from './pages/client/Cart';
import Profile from './pages/client/Profile';
import About from './pages/client/About';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminInventory from './pages/admin/AdminInventory';
import AdminLoyalty from './pages/admin/AdminLoyalty';

// Protected Routes
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Navbar from './components/client/Navbar';

// Component to conditionally show Navbar
function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <div className="App">
      {/* Only show Navbar on non-admin routes */}
      {!isAdminRoute && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Routes - All protected */}
        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        
        <Route path="/admin/products" element={
          <AdminProtectedRoute>
            <AdminProducts />
          </AdminProtectedRoute>
        } />
        
        <Route path="/admin/orders" element={
          <AdminProtectedRoute>
            <AdminOrders />
          </AdminProtectedRoute>
        } />
        
        <Route path="/admin/customers" element={
          <AdminProtectedRoute>
            <AdminCustomers />
          </AdminProtectedRoute>
        } />
        
        <Route path="/admin/settings" element={
          <AdminProtectedRoute>
            <AdminSettings />
          </AdminProtectedRoute>
        } />
        
        <Route path="/admin/inventory" element={
          <AdminProtectedRoute>
            <AdminInventory />
          </AdminProtectedRoute>
        } />
        
        <Route path="/admin/loyalty" element={
          <AdminProtectedRoute>
            <AdminLoyalty />
          </AdminProtectedRoute>
        } />

        {/* Redirect to home for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;