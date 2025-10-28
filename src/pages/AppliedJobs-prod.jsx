import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function AppliedJobs() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadApplications()
  }, [user])

  const loadApplications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const candidates = await dbHelpers.getAllCandidates()
      const userApplications = candidates.filter(c => 
        c.userId === user.id || c.id === user.id || c.email === user.email
      )
      
      // Get job details for each application
      const applicationsWithJobs = await Promise.all(
        userApplications.map(async (app) => {
          try {
            const job = await dbHelpers.getJob(app.jobId)
            return { ...app, job }
          } catch (e) {
            return { ...app, job: null }
          }
        })
      )
      
      setApplications(applicationsWithJobs)
    } catch (e) {
      console.error('Failed to load applications:', e)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter(app => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      app.job?.title?.toLowerCase().includes(searchLower) ||
      app.stage?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Applied Jobs</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'No applications match your search.' : 'You haven\'t applied to any jobs yet.'}
            {!search && (
              <Link to="/jobs" className="block mt-4 text-blue-600 hover:text-blue-700">
                Browse available jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((app) => (
              <div key={app.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {app.job?.title || 'Unknown Job'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Applied: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        {app.resumeLink && (
                          <p className="text-sm text-gray-600 mt-1">
                            Resume: <a href={app.resumeLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">View Resume</a>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          app.stage === 'hired' ? 'bg-green-100 text-green-800' :
                          app.stage === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {app.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {app.job && (
                      <Link
                        to={`/assessments/${app.job.id}/attempt`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Take Assessment
                      </Link>
                    )}
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
