import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { CurriculumProvider } from './context/CurriculumContext';
import ScrollToTop from './components/ScrollToTop';
import { supabase, adminSupabase, mentorSupabase } from './supabaseClient';
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
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminHomepage = lazy(() => import('./pages/admin/AdminHomepage'));
const AdminOperations = lazy(() => import('./pages/admin/AdminOperations'));
const AdminOther = lazy(() => import('./pages/admin/AdminOther'));
const AdminFAQs = lazy(() => import('./pages/admin/AdminFAQs'));
const Career = lazy(() => import('./pages/Career'));
const Profile = lazy(() => import('./pages/Profile'));
const ClassPage = lazy(() => import('./pages/ClassPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const WriteReview = lazy(() => import('./pages/WriteReview'));
const Blogs = lazy(() => import('./pages/Blogs'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const AIChatButton = lazy(() => import('./components/AIChatButton'));

// Loading fallback
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-[#1B2A5A]/10 border-t-[#1B2A5A] rounded-full animate-spin"></div>
            <img
                src="/HH-logo.png"
                alt="Loading..."
                className="absolute inset-0 w-12 h-auto m-auto object-contain animate-pulse"
            />
        </div>
    </div>
);


function App() {
  return (
    <ModalProvider>
      <CurriculumProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* User Routes - Wrapped in user AuthProvider */}
              <Route element={<AuthProvider supabaseClient={supabase}><Outlet /></AuthProvider>}>
                <Route path="/" element={<IntroWrapper><Home /></IntroWrapper>} />
                <Route path="/class/:id" element={<ClassPage />} />
                <Route path="/book-session" element={<BookingPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/career" element={<Career />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/write-review/:bookingId" element={<WriteReview />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blogs/:slug" element={<BlogDetail />} />
              </Route>

              {/* Mentor Routes - Wrapped in mentor AuthProvider for session isolation */}
              <Route element={<AuthProvider supabaseClient={mentorSupabase}><Outlet /></AuthProvider>}>
                <Route path="/mentor/login" element={<MentorLogin />} />
                <Route element={<ProtectedRoute allowedRoles={['mentor']} redirectPath="/mentor/login" />}>
                  <Route path="/mentor-dashboard" element={<MentorDashboard />} />
                </Route>
              </Route>

              {/* Admin Routes - Wrapped in admin AuthProvider */}
              <Route element={<AuthProvider supabaseClient={adminSupabase}><Outlet /></AuthProvider>}>
                <Route path="/admin/login" element={<Login />} />
                
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="homepage" element={<AdminHomepage />} />
                    <Route path="operations" element={<AdminOperations />} />
                    <Route path="other" element={<AdminOther />} />
                    <Route path="homepage/sliders" element={<Sliders />} />
                    <Route path="homepage/counters" element={<AdminCounters />} />
                    <Route path="homepage/reviews" element={<Reviews />} />
                    <Route path="homepage/brands" element={<Brands />} />
                    <Route path="homepage/mentors" element={<Mentors />} />
                    <Route path="homepage/partners" element={<AdminPartners />} />
                    <Route path="homepage/faqs" element={<AdminFAQs />} />
                    
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
                    <Route path="blogs" element={<AdminBlogs />} />
                    <Route path="leads" element={<AdminLeads />} />
                    <Route path="achievements" element={<AdminAchievements />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <AIChatButton />
          </Suspense>
        </Router>
      </CurriculumProvider>
    </ModalProvider>
  );
}

export default App;
