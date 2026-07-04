import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { AuthProvider } from './lib/AuthContext';
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
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
