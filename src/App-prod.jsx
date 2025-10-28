import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { seedDatabase } from './utils/seedData'
import Login from './pages/Login'
import Layout from './components/Layout'
import Jobs from './pages/Jobs-prod'
import JobDetail from './pages/JobDetail'
import Assessments from './pages/Assessments-prod'
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
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initialize database and seed data
    const init = async () => {
      try {
        console.log('🔄 Initializing database...')
        await seedDatabase()
        console.log('✅ Database initialized')
        setInitialized(true)
      } catch (error) {
        console.error('❌ Failed to initialize database:', error)
        setInitialized(true) // Still allow app to load
      }
    }
    
    init()
  }, [])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing TalentFlow...</p>
        </div>
      </div>
    )
  }

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
            {/* Jobs are accessible to both Admin and Candidate */}
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            {/* Candidate routes */}
            <Route path="applied" element={<AppliedJobs />} />
            <Route path="assessments/:jobId/attempt" element={<AssessmentAttempt />} />
            {/* Admin submissions route (supports job slug) */}
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
