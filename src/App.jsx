import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Client Pages
import Home from './pages/client/Home';
import Landing from './pages/client/Landing';
import Login from './pages/client/Login';
import Register from './pages/client/Register';
import Products from './pages/client/Products';
import ProductDetail from './pages/client/ProductDetail';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import BulkOrder from './pages/client/BulkOrder';
import OrderSuccess from './pages/client/OrderSuccess';
import Profile from './pages/client/Profile';
import About from './pages/client/About';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminBulkOrders from './pages/admin/AdminBulkOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminInventory from './pages/admin/AdminInventory';

// Protected Routes
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Navbar from './components/client/Navbar';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/bulk-order" element={<BulkOrder />} />
        <Route path="/order-success" element={<OrderSuccess />} />
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

        <Route path="/admin/bulk-orders" element={
          <AdminProtectedRoute>
            <AdminBulkOrders />
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
        <OrderProvider>
          <Router>
            <AppContent />
          </Router>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
