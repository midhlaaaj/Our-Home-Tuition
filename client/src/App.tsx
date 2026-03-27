import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CurriculumProvider } from './context/CurriculumContext';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import Home from './pages/Home';
import IntroWrapper from './pages/IntroPage';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load non-critical routes
const About = lazy(() => import('./pages/About'));
const Auth = lazy(() => import('./pages/Auth'));
const Login = lazy(() => import('./pages/Login'));
const AdminLayout = lazy(() => import('./layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const MentorLogin = lazy(() => import('./pages/mentor/MentorLogin'));
const AdminQueries = lazy(() => import('./pages/admin/AdminQueries'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const Sliders = lazy(() => import('./pages/admin/Sliders'));
const Reviews = lazy(() => import('./pages/admin/Reviews'));
const Brands = lazy(() => import('./pages/admin/Brands'));
const Mentors = lazy(() => import('./pages/admin/Mentors'));
const AdminCounters = lazy(() => import('./pages/admin/AdminCounters'));
const AdminAvatars = lazy(() => import('./pages/admin/AdminAvatars'));
const AdminPartners = lazy(() => import('./pages/admin/AdminPartners'));
const AdminClasses = lazy(() => import('./pages/admin/AdminClasses'));
const AdminAchievements = lazy(() => import('./pages/admin/AdminAchievements'));
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const Career = lazy(() => import('./pages/Career'));
const Profile = lazy(() => import('./pages/Profile'));
const ClassPage = lazy(() => import('./pages/ClassPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const WriteReview = lazy(() => import('./pages/WriteReview'));
const AIChatButton = lazy(() => import('./components/AIChatButton'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);


function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <CurriculumProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<IntroWrapper><Home /></IntroWrapper>} />
              <Route path="/class/:id" element={<ClassPage />} />
              <Route path="/book-session" element={<BookingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/career" element={<Career />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/write-review/:bookingId" element={<WriteReview />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/mentor/login" element={<MentorLogin />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="queries" element={<AdminQueries />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="sliders" element={<Sliders />} />
                  <Route path="reviews" element={<Reviews />} />
                  <Route path="brands" element={<Brands />} />
                  <Route path="mentors" element={<Mentors />} />
                  <Route path="counters" element={<AdminCounters />} />
                  <Route path="avatars" element={<AdminAvatars />} />
                  <Route path="partners" element={<AdminPartners />} />
                  <Route path="classes" element={<AdminClasses />} />
                  <Route path="jobs" element={<AdminJobs />} />
                  <Route path="applications" element={<AdminApplications />} />
                  <Route path="achievements" element={<AdminAchievements />} />
                </Route>
              </Route>

              {/* Mentor Routes */}
              <Route element={<ProtectedRoute allowedRoles={['mentor']} redirectPath="/mentor/login" />}>
                <Route path="/mentor-dashboard" element={<MentorDashboard />} />
              </Route>
            </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <AIChatButton />
          </Suspense>
        </Router>
      </CurriculumProvider>
    </ModalProvider>
  </AuthProvider>
  );
}

export default App;
