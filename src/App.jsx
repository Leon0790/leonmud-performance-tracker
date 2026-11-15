import { Toaster } from "@/components/ui/toaster"
import ThemeProvider from '@/lib/ThemeProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import PaymentGate from './pages/PaymentGate';
import AdminBadgeVisibility from './components/AdminBadgeVisibility';
import RoleHome from './components/RoleHome';
import RoleGuard from './components/RoleGuard';

// Lazy-loaded page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MarksEntry = lazy(() => import('./pages/MarksEntry'));
const Performance = lazy(() => import('./pages/Performance'));
const Reports = lazy(() => import('./pages/Reports'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const StudentsList = lazy(() => import('./pages/students/List'));
const RegisterStudent = lazy(() => import('./pages/students/Register'));
const StudentProfile = lazy(() => import('./pages/students/Profile'));
const ImportStudents = lazy(() => import('./pages/students/Import'));
const Attendance = lazy(() => import('./pages/Attendance'));
const MyPayment = lazy(() => import('./pages/MyPayment'));
const ImportMarks = lazy(() => import('./pages/ImportMarks'));
const LessonPlans = lazy(() => import('./pages/LessonPlans'));
const Subscribe = lazy(() => import('./pages/Subscribe'));
const LessonPlanAccess = lazy(() => import('./pages/LessonPlanAccess'));
const SuperAdminSchools = lazy(() => import('./pages/SuperAdminSchools'));
const SchoolDetail = lazy(() => import('./pages/SchoolDetail'));
const SchoolDashboard = lazy(() => import('./pages/SchoolDashboard'));
const SchoolTeachers = lazy(() => import('./pages/school/Teachers'));
const SchoolClasses = lazy(() => import('./pages/school/Classes'));
const SchoolAnnouncements = lazy(() => import('./pages/school/Announcements'));
const SchoolSubmissions = lazy(() => import('./pages/school/Submissions'));

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

const pageTransition = { duration: 0.18, ease: 'easeOut' };

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="flex-1 min-h-0 flex flex-col"
      >
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        }>
          <Routes location={location}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RoleHome />} />
              <Route path="/Dashboard" element={<RoleHome />} />
              <Route path="/marks" element={<MarksEntry />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin/payments" element={<RoleGuard allow={['super_admin']}><AdminPayments /></RoleGuard>} />
              <Route path="/students/list" element={<StudentsList />} />
              <Route path="/students/register" element={<RegisterStudent />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/students/import" element={<ImportStudents />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/my-payment" element={<MyPayment />} />
              <Route path="/marks/import" element={<ImportMarks />} />
              <Route path="/lesson-plans" element={<LessonPlans />} />
              <Route path="/lesson-plans/access" element={<LessonPlanAccess />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/super-admin/schools" element={<RoleGuard allow={['super_admin']}><SuperAdminSchools /></RoleGuard>} />
              <Route path="/super-admin/schools/:id" element={<RoleGuard allow={['super_admin']}><SchoolDetail /></RoleGuard>} />
              <Route path="/school" element={<RoleGuard allow={['headteacher', 'super_admin']}><SchoolDashboard /></RoleGuard>} />
              <Route path="/school/teachers" element={<RoleGuard allow={['headteacher', 'super_admin']}><SchoolTeachers /></RoleGuard>} />
              <Route path="/school/classes" element={<RoleGuard allow={['headteacher', 'super_admin']}><SchoolClasses /></RoleGuard>} />
              <Route path="/school/announcements" element={<SchoolAnnouncements />} />
              <Route path="/school/submissions" element={<SchoolSubmissions />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-serif">Loading LeonMud Tracker...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <PaymentGate>
      <AdminBadgeVisibility />
      <AnimatedRoutes />
    </PaymentGate>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;