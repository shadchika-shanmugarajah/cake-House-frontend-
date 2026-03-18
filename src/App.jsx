import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { ProductProvider } from './context/ProductContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Client Pages
import Home from './pages/client/Home';
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
import Notifications from './pages/client/Notifications';
import OrderTracking from './pages/client/OrderTracking';
import BulkOrderTracking from './pages/client/BulkOrderTracking';
import CustomOrderPayment from './pages/client/CustomOrderPayment';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminBulkOrders from './pages/admin/AdminBulkOrders';
import AdminCustomOrders from './pages/admin/AdminCustomOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminReviews from './pages/admin/AdminReviews';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminUsers from './pages/admin/AdminUsers';

// Protected Routes
import AdminProtectedRoute from './components/AdminProtectedRoute';
import UserProtectedRoute from './components/UserProtectedRoute';
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />

        {/* User Protected Routes */}
        <Route path="/cart" element={<UserProtectedRoute><Cart /></UserProtectedRoute>} />
        <Route path="/checkout" element={<UserProtectedRoute><Checkout /></UserProtectedRoute>} />
        <Route path="/bulk-order" element={<UserProtectedRoute><BulkOrder /></UserProtectedRoute>} />
        <Route path="/order-success" element={<UserProtectedRoute><OrderSuccess /></UserProtectedRoute>} />
        <Route path="/profile" element={<UserProtectedRoute><Profile /></UserProtectedRoute>} />
        <Route path="/notifications" element={<UserProtectedRoute><Notifications /></UserProtectedRoute>} />
        <Route path="/orders/:orderId/tracking" element={<UserProtectedRoute><OrderTracking /></UserProtectedRoute>} />
        <Route path="/bulk-orders/:bulkOrderId/tracking" element={<UserProtectedRoute><BulkOrderTracking /></UserProtectedRoute>} />
        <Route path="/custom-orders/:customOrderId/payment" element={<UserProtectedRoute><CustomOrderPayment /></UserProtectedRoute>} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Routes - All protected */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
        <Route path="/admin/bulk-orders" element={<AdminProtectedRoute><AdminBulkOrders /></AdminProtectedRoute>} />
        <Route path="/admin/custom-orders" element={<AdminProtectedRoute><AdminCustomOrders /></AdminProtectedRoute>} />
        <Route path="/admin/products" element={<AdminProtectedRoute><AdminProducts /></AdminProtectedRoute>} />
        <Route path="/admin/categories" element={<AdminProtectedRoute><AdminCategories /></AdminProtectedRoute>} />
        <Route path="/admin/inventory" element={<AdminProtectedRoute><AdminInventory /></AdminProtectedRoute>} />
        <Route path="/admin/reviews" element={<AdminProtectedRoute><AdminReviews /></AdminProtectedRoute>} />
        <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        
        {/* Redirect /admin to dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

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
          <ProductProvider>
            <Router>
            <AppContent />
            </Router>
          </ProductProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

