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
    const load = async () => {
      setLoading(true)
      try {
        const [jobs, candidates] = await Promise.all([
          dbHelpers.getAllJobs(),
          dbHelpers.getAllCandidates()
        ])
        const mine = candidates
          .filter(c => c.userId === user?.id)
          .map(c => ({ ...c, job: jobs.find(j => j.id === c.jobId) || null }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setApplications(mine)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applied Jobs</h1>
        <p className="text-gray-600 mt-1">Your submitted applications</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applied jobs by title or stage..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          You haven't applied to any jobs yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {applications
            .filter(app => {
              if (!search) return true
              const q = search.toLowerCase()
              const inTitle = app.job?.title?.toLowerCase().includes(q)
              const inStage = String(app.stage || '').toLowerCase().includes(q)
              return inTitle || inStage
            })
            .map(app => (
            <div key={app.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{app.job?.title || 'Job'}</div>
                <div className="text-sm text-gray-600 mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()} • Stage: <span className="capitalize">{app.stage}</span></div>
                {app.resumeLink && (
                  <a href={app.resumeLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-700 inline-block mt-1">Resume</a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/jobs/${app.jobId}`} className="text-sm text-gray-700 hover:text-gray-900">View Job</Link>
                <Link to={`/assessments/${app.jobId}/attempt`} className="text-sm text-blue-600 hover:text-blue-700">Take Assessment</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



