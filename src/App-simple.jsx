import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Assessments from './pages/Assessments'
import Dashboard from './pages/Dashboard'
import AppliedJobs from './pages/AppliedJobs'
import AssessmentAttempt from './pages/AssessmentAttempt'
import AssessmentSubmissions from './pages/AssessmentSubmissions'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="applied" element={<AppliedJobs />} />
            <Route path="assessments/:jobId/attempt" element={<AssessmentAttempt />} />
            <Route
              path="assessments/:jobId/submissions"
              element={
                <AdminRoute>
                  <AssessmentSubmissions />
                </AdminRoute>
              }
            />
            <Route
              path="assessments"
              element={
                <AdminRoute>
                  <Assessments />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

