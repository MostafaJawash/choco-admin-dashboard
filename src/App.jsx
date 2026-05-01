import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { useI18n } from './i18n/useI18n'
import Categories from './pages/Categories'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Orders from './pages/Orders'
import ProductTypes from './pages/ProductTypes'
import Products from './pages/Products'

function AdminLayout() {
  const { isRtl } = useI18n()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Sidebar />
        <main className={`min-h-screen px-4 pb-28 pt-5 transition-all duration-300 md:px-8 md:pb-5 lg:px-10 ${isRtl ? 'md:mr-72' : 'md:ml-72'}`}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/product-types" element={<ProductTypes />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
