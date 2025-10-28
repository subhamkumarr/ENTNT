import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function Dashboard() {
  const { user, isAdmin, isCandidate } = useAuth()
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    availableJobs: 0,
    appliedJobs: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      console.log('Loading stats for user:', user)
      console.log('isCandidate:', isCandidate)
      
      const [jobs, candidates] = await Promise.all([
        dbHelpers.getAllJobs(),
        isCandidate ? dbHelpers.getAllCandidates() : []
      ])

      console.log('Loaded jobs:', jobs.length)
      console.log('Loaded candidates:', candidates.length)

      const totalJobs = jobs.length
      const activeJobs = jobs.filter(j => j.status === 'active').length
      const availableJobs = activeJobs // For candidates, available = active
      
      let appliedJobs = 0
      if (isCandidate && user?.id) {
        // Try both userId and id fields for candidate lookup
        appliedJobs = candidates.filter(c => 
          c.userId === user.id || 
          c.id === user.id || 
          c.email === user.email
        ).length
        console.log('Applied jobs for user', user.id, ':', appliedJobs)
        console.log('Candidates with userId:', candidates.filter(c => c.userId === user.id))
        console.log('Candidates with email:', candidates.filter(c => c.email === user.email))
      }

      console.log('Final stats:', { totalJobs, activeJobs, availableJobs, appliedJobs })

      setStats({
        totalJobs,
        activeJobs,
        availableJobs,
        appliedJobs
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Set default values on error
      setStats({
        totalJobs: 0,
        activeJobs: 0,
        availableJobs: 0,
        appliedJobs: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="text-gray-600 mt-1">TalentFlow dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isCandidate && (
          <>
            <Link to="/jobs" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Jobs</div>
                  <div className="mt-1 text-3xl font-bold text-gray-900">{stats.totalJobs}</div>
                  <div className="mt-2 text-sm text-blue-600">Browse and apply →</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
              </div>
            </Link>

            <Link to="/applied" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Applied Jobs</div>
                  <div className="mt-1 text-3xl font-bold text-gray-900">{stats.appliedJobs}</div>
                  <div className="mt-2 text-sm text-blue-600">View your applications →</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <Link to="/jobs" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Jobs</div>
                  <div className="mt-1 text-3xl font-bold text-gray-900">{stats.totalJobs}</div>
                  <div className="mt-2 text-sm text-blue-600">Manage all jobs →</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </Link>

            <Link to="/jobs?status=active" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Active Jobs</div>
                  <div className="mt-1 text-3xl font-bold text-gray-900">{stats.activeJobs}</div>
                  <div className="mt-2 text-sm text-blue-600">Currently active →</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}


