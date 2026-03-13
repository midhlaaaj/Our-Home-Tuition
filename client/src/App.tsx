import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CurriculumProvider } from './context/CurriculumContext';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth';
import Login from './pages/Login';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorLogin from './pages/mentor/MentorLogin';
import ProtectedRoute from './components/ProtectedRoute';
import AdminQueries from './pages/admin/AdminQueries';
import AdminBookings from './pages/admin/AdminBookings';
import Sliders from './pages/admin/Sliders';
import Reviews from './pages/admin/Reviews';
import Brands from './pages/admin/Brands';
import Mentors from './pages/admin/Mentors';
import AdminCounters from './pages/admin/AdminCounters';
import AdminAvatars from './pages/admin/AdminAvatars';
import AdminPartners from './pages/admin/AdminPartners';
import AdminClasses from './pages/admin/AdminClasses';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminJobs from './pages/admin/AdminJobs';
import AdminApplications from './pages/admin/AdminApplications';
import Career from './pages/Career';
import Profile from './pages/Profile';
import ClassPage from './pages/ClassPage';
import BookingPage from './pages/BookingPage';
import NotificationsPage from './pages/NotificationsPage';
import WriteReview from './pages/WriteReview';

function App() {
  return (
    <AuthProvider>
      <CurriculumProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
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
        </Router>
      </CurriculumProvider>
    </AuthProvider>
  );
}

export default App;
