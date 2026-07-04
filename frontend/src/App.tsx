import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './lib/AuthContext';
import { CheckoutPage } from './pages/CheckoutPage';
import { CourseLessonsPage } from './pages/CourseLessonsPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { LmsDashboardPage } from './pages/LmsDashboardPage';
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

              <Route element={<ProtectedRoute />}>
                <Route path="/lms" element={<LmsDashboardPage />} />
                <Route path="/lms/courses/:courseId" element={<CourseLessonsPage />} />
                <Route path="/lms/lessons/:lessonId" element={<LessonDetailPage />} />
              </Route>
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
