import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Tag, Archive, Search, User, MessageSquare, X, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function JobDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applicants, setApplicants] = useState([])
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [takenSet, setTakenSet] = useState(new Set())
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showCandidateProfile, setShowCandidateProfile] = useState(false)
  const [candidateNotes, setCandidateNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [transitions, setTransitions] = useState([])

  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

  useEffect(() => {
    loadJob()
    if (isAdmin) {
      loadApplicants()
      loadAssessmentSubmissions()
    }
  }, [id])

  const loadJob = async () => {
    setLoading(true)
    try {
      const jobData = await dbHelpers.getJob(parseInt(id))
      setJob(jobData)
    } catch (error) {
      console.error('Failed to load job:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadApplicants = async () => {
    setApplicantsLoading(true)
    try {
      const candidates = await dbHelpers.getAllCandidates()
      const list = candidates
        .filter(c => c.jobId === parseInt(id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setApplicants(list)
    } catch (e) {
      console.error('Failed to load applicants:', e)
      setApplicants([])
    } finally {
      setApplicantsLoading(false)
    }
  }

  const updateStage = async (candidateId, newStage) => {
    try {
      const candidate = await dbHelpers.getCandidate(parseInt(candidateId))
      if (candidate) {
        const updatedCandidate = {
          ...candidate,
          stage: newStage,
          updatedAt: new Date().toISOString()
        }
        await dbHelpers.saveCandidate(updatedCandidate)
        
        // Record stage transition
        await dbHelpers.addStageTransition({
          candidateId: parseInt(candidateId),
          fromStage: candidate.stage,
          toStage: newStage,
          timestamp: new Date().toISOString(),
          userId: '1',
          notes: ''
        })
        
        await loadApplicants()
        if (selectedCandidate && selectedCandidate.id === parseInt(candidateId)) {
          setSelectedCandidate(updatedCandidate)
          loadCandidateProfile(updatedCandidate)
        }
      }
    } catch (e) {
      console.error('Failed to update stage:', e)
    }
  }

  const openCandidateProfile = async (candidate) => {
    setSelectedCandidate(candidate)
    setShowCandidateProfile(true)
    await loadCandidateProfile(candidate)
  }

  const loadCandidateProfile = async (candidate) => {
    try {
      // Load stage transitions
      const transitionsData = await dbHelpers.getStageTransitions(candidate.id)
      setTransitions(transitionsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
      
      // Load notes (mock data for now)
      setCandidateNotes([
        {
          id: 1,
          content: 'Initial screening completed. Strong technical background.',
          author: 'HR Team',
          timestamp: new Date().toISOString(),
          mentions: []
        }
      ])
    } catch (e) {
      console.error('Failed to load candidate profile:', e)
    }
  }

  const addNote = () => {
    if (!newNote.trim() || !selectedCandidate) return
    
    const note = {
      id: Date.now(),
      content: newNote,
      author: 'Current User',
      timestamp: new Date().toISOString(),
      mentions: extractMentions(newNote)
    }
    
    setCandidateNotes([note, ...candidateNotes])
    setNewNote('')
  }

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case 'hired': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'offer': return 'bg-blue-100 text-blue-800'
      case 'tech': return 'bg-purple-100 text-purple-800'
      case 'screen': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const loadAssessmentSubmissions = async () => {
    try {
      // Find assessment for this job
      const jobIdNum = parseInt(id)
      const a = await dbHelpers.getAssessment(jobIdNum)
      if (!a) { setTakenSet(new Set()); return }
      const subs = await dbHelpers.getResponsesByAssessment(a.id)
      const s = new Set()
      subs.forEach(r => {
        if (r.candidateId != null) s.add(String(r.candidateId))
      })
      setTakenSet(s)
    } catch (e) {
      console.error('Failed to load submissions set', e)
      setTakenSet(new Set())
    }
  }

  const downloadApplicantsCSV = (rows) => {
    if (!rows || rows.length === 0) return
    const header = ['Name','Email','Stage','Applied At','Resume','Job Id']
    const csv = [header.join(',')].concat(
      rows.map(r => [
        escapeCsv(r.name),
        escapeCsv(r.email),
        r.stage,
        r.createdAt,
        escapeCsv(r.resumeLink || ''),
        r.jobId
      ].join(','))
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-${id}-applicants.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const escapeCsv = (val) => {
    if (val == null) return ''
    const s = String(val)
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const handleArchive = async () => {
    try {
      const updatedJob = {
        ...job,
        status: job.status === 'archived' ? 'active' : 'archived',
        updatedAt: new Date().toISOString()
      }
      await dbHelpers.saveJob(updatedJob)
      loadJob()
    } catch (error) {
      console.error('Failed to archive job:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Job not found</p>
        <Link to="/jobs" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/jobs"
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        <span>Back to Jobs</span>
      </Link>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {job.status}
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar size={18} />
                <span className="text-sm">
                  Created: {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
              {job.tags && job.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag size={18} />
                  <div className="flex space-x-2">
                    {job.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleArchive}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Archive size={18} />
              <span>{job.status === 'archived' ? 'Unarchive' : 'Archive'}</span>
            </button>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
          <div className="space-y-4">
            <div>
              <span className="text-gray-600">Slug:</span>
              <span className="ml-2 text-gray-900">{job.slug}</span>
            </div>
            <div>
              <span className="text-gray-600">Order:</span>
              <span className="ml-2 text-gray-900">{job.order}</span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 text-gray-900">
                {new Date(job.updatedAt).toLocaleString()}
              </span>
            </div>
            {job.description && (
              <div>
                <span className="text-gray-600">Description:</span>
                <div className="mt-2 text-gray-900 whitespace-pre-wrap">{job.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Applicants</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Stages</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 text-sm text-gray-700">
              <div>
                {applicantsLoading ? 'Loading...' : `${applicants.length} applicant${applicants.length !== 1 ? 's' : ''}`}
              </div>
              <button
                onClick={() => downloadApplicantsCSV(applicants)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download CSV
              </button>
            </div>
            <div>
              <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-600 border-b border-gray-100">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Resume</div>
                <div className="col-span-2">Assessment</div>
                <div className="col-span-2">Stage</div>
              </div>
              {(applicants
                .filter(a => {
                  const matchesSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
                  const matchesStage = !filterStage || a.stage === filterStage
                  return matchesSearch && matchesStage
                })
              ).map(a => {
                const taken = takenSet.has(String(a.id)) || (a.userId != null && takenSet.has(String(a.userId)))
                return (
                  <div key={a.id} className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-100">
                    <div className="col-span-3">
                      <button
                        onClick={() => openCandidateProfile(a)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-left"
                      >
                        {a.name}
                      </button>
                    </div>
                    <div className="col-span-3 text-gray-700 text-sm break-all">{a.email}</div>
                    <div className="col-span-2 text-sm">
                      {a.resumeLink ? (
                        <a href={a.resumeLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">Open Resume</a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div className="col-span-2 text-sm">
                      {taken ? (
                        <Link to={`/assessments/${job.slug}/submissions`} className="text-blue-600 hover:text-blue-700">Taken</Link>
                      ) : (
                        <span className="text-gray-500">Not taken</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <select
                        value={a.stage}
                        onChange={(e) => updateStage(a.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded-full border-0 ${getStageColor(a.stage)}`}
                      >
                        {stages.map(stage => (
                          <option key={stage} value={stage}>
                            {stage.charAt(0).toUpperCase() + stage.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
              {(!applicantsLoading && applicants.length === 0) && (
                <div className="p-6 text-center text-gray-500">No applicants for this job yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {showCandidateProfile && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Candidate Profile</h2>
                <button
                  onClick={() => setShowCandidateProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Candidate Header */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={32} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-gray-600">{selectedCandidate.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(selectedCandidate.stage)}`}>
                      {selectedCandidate.stage}
                    </span>
                    <span className="text-xs text-gray-500">
                      Applied {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notes Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageSquare size={20} className="mr-2" />
                    Notes
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note... Use @username to mention team members"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={addNote}
                          disabled={!newNote.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {candidateNotes.map((note) => (
                        <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
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
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h4>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {transitions.map((transition, index) => (
                      <div key={transition.id || index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock size={16} className="text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              Moved from {transition.fromStage} to {transition.toStage}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(transition.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {transition.notes && (
                            <p className="text-sm text-gray-600 mt-1">{transition.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {transitions.length === 0 && (
                      <p className="text-gray-500 text-sm">No stage transitions yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
