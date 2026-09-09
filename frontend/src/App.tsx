import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import BrowseTasks from './pages/public/BrowseTasks';
import HowItWorks from './pages/public/HowItWorks';
import ForBusinesses from './pages/public/ForBusinesses';
import ForWorkers from './pages/public/ForWorkers';
import About from './pages/public/About';
import FAQ from './pages/public/FAQ';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Forbidden from './pages/public/Forbidden';
import NotFound from './pages/public/NotFound';
import PublicTaskDetail from './pages/public/TaskDetail';

// Worker Pages
import WorkerOverview from './pages/worker/Overview';
import WorkerAvailableTasks from './pages/worker/AvailableTasks';
import WorkerMyTasks from './pages/worker/MyTasks';
import WorkerSubmissions from './pages/worker/Submissions';
import WorkerChat from './pages/worker/Chat';
import WorkerProfile from './pages/worker/Profile';

// Business Pages
import BusinessOverview from './pages/business/Overview';
import BusinessTaskList from './pages/business/TaskList';
import BusinessCreateTask from './pages/business/CreateTask';
import BusinessTaskDetail from './pages/business/TaskDetail';
import BusinessTaskChat from './pages/business/TaskChat';
import BusinessSubmissionsReview from './pages/business/SubmissionsReview';
import BusinessPayments from './pages/business/Payments';
import BusinessProfile from './pages/business/Profile';

// Admin Pages
import AdminOverview from './pages/admin/Overview';
import AdminUserManagement from './pages/admin/UserManagement';
import AdminTaskOversight from './pages/admin/TaskOversight';
import AdminSubmissionOversight from './pages/admin/SubmissionOversight';
import AdminVerificationQueue from './pages/admin/VerificationQueue';
import AdminPayments from './pages/admin/Payments';
import AdminFraudDetection from './pages/admin/FraudDetection';
import AdminReportsAnalytics from './pages/admin/ReportsAnalytics';
import AdminSettings from './pages/admin/Settings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<BrowseTasks />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/for-businesses" element={<ForBusinesses />} />
              <Route path="/for-workers" element={<ForWorkers />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/tasks/:id" element={<PublicTaskDetail />} />
              <Route path="/403" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <DashboardLayout role="WORKER" />
                </ProtectedRoute>
              }
            >
              <Route index element={<WorkerOverview />} />
              <Route path="tasks" element={<WorkerAvailableTasks />} />
              <Route path="my-tasks" element={<WorkerMyTasks />} />
              <Route path="submissions" element={<WorkerSubmissions />} />
              <Route path="chat" element={<WorkerChat />} />
              <Route path="profile" element={<WorkerProfile />} />
            </Route>

            <Route
              path="/business"
              element={
                <ProtectedRoute allowedRoles={['BUSINESS']}>
                  <DashboardLayout role="BUSINESS" />
                </ProtectedRoute>
              }
            >
              <Route index element={<BusinessOverview />} />
              <Route path="tasks" element={<BusinessTaskList />} />
              <Route path="tasks/create" element={<BusinessCreateTask />} />
              <Route path="tasks/:id" element={<BusinessTaskDetail />} />
              <Route path="tasks/:id/chat" element={<BusinessTaskChat />} />
              <Route path="submissions" element={<BusinessSubmissionsReview />} />
              <Route path="payments" element={<BusinessPayments />} />
              <Route path="profile" element={<BusinessProfile />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout role="ADMIN" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="tasks" element={<AdminTaskOversight />} />
              <Route path="submissions" element={<AdminSubmissionOversight />} />
              <Route path="verification" element={<AdminVerificationQueue />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="fraud" element={<AdminFraudDetection />} />
              <Route path="reports" element={<AdminReportsAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
