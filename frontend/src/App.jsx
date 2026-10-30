import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleGuard } from './routes/Guards';
import { AppShell } from './components/layout/AppShell';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { NewTicket } from './pages/NewTicket';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';
import { Chat } from './pages/Chat';
import { Analytics } from './pages/Analytics';
import { Insights } from './pages/Insights';
import { Customer360 } from './pages/Customer360';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Workspace AppShell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets/new" element={<NewTicket />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/chat" element={<Chat />} />

          {/* Staff Protected Routes */}
          <Route
            path="/analytics"
            element={
              <RoleGuard allowedRoles={['agent', 'admin']}>
                <Analytics />
              </RoleGuard>
            }
          />
          <Route
            path="/insights"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <Insights />
              </RoleGuard>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <RoleGuard allowedRoles={['agent', 'admin']}>
                <Customer360 />
              </RoleGuard>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <RoleGuard allowedRoles={['agent', 'admin']}>
                <KnowledgeBase />
              </RoleGuard>
            }
          />

          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
