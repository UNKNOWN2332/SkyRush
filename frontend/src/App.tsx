import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from './components/ThemeProvider';
import { Login } from './components/Login';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { ProductCheckoutPage } from './pages/ProductCheckoutPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { TournamentsPage } from './pages/TournamentsPage';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/** GSI skripti va tugma matni i18n tiliga mos (brauzer tilidan mustaqil). */
function GoogleOAuthBridge({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const gsiLocale = i18n.language.startsWith('ru') ? 'ru' : 'uz';
  if (!googleClientId) {
    return <>{children}</>;
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId} locale={gsiLocale} key={gsiLocale}>
      {children}
    </GoogleOAuthProvider>
  );
}

function ThemedToastContainer() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === 'dark' ? 'dark' : 'light'}
    />
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/category/:categoryId/checkout/:productId" element={<ProductCheckoutPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
      </Routes>
      <ThemedToastContainer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <GoogleOAuthBridge>
      <AppRoutes />
    </GoogleOAuthBridge>
  );
}
