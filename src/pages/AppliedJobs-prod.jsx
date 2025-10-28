import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'
import { MessageSquare, Eye, X } from 'lucide-react'

export default function AppliedJobs() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState([])

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

const loadNotes = async (application) => {
  try {
    // Load notes for this application (mock data for now)
    const mockNotes = [
      {
        id: 1,
        content: 'Initial review completed. Candidate shows strong potential.',
        author: 'HR Team',
        timestamp: new Date().toISOString(),
        mentions: []
      },
      {
        id: 2,
        content: 'Technical interview scheduled with @john.doe for next week.',
        author: 'Recruiter',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        mentions: ['john.doe']
      }
    ]
    setNotes(mockNotes)
  } catch (e) {
    console.error('Failed to load notes:', e)
    setNotes([])
  }
}

const openNotes = (application) => {
  setSelectedApplication(application)
  setShowNotes(true)
  loadNotes(application)
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
                    <button
                      onClick={() => openNotes(app)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200"
                    >
                      <MessageSquare size={16} />
                      <span>Notes</span>
                    </button>
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

      {/* Notes Modal */}
      {showNotes && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Application Notes</h2>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {selectedApplication.job?.title || 'Unknown Job'} - {selectedApplication.name}
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{note.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{note.content}</p>
                    {note.mentions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.mentions.map((mention, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            @{mention}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No notes available for this application.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
