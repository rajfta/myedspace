import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { AuthProvider } from './lib/AuthContext';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ProductPage } from './pages/ProductPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-brand-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<ProductPage />} />
              <Route path="/checkout/:courseId" element={<CheckoutPage />} />
              <Route path="/onboard/:token" element={<OnboardingPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
