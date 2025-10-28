import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Archive, Search, Filter, ArrowUpDown } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import JobModal from '../components/jobs/JobModal-prod'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function Jobs() {
  const { isAdmin, user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [applyJob, setApplyJob] = useState(null)
  const [resumeLink, setResumeLink] = useState('')
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadJobs()
    if (!isAdmin) {
      loadApplied()
    }
  }, [page, debouncedSearch, status, isAdmin, user])

  const loadJobs = async () => {
    setLoading(true)
    try {
      let allJobs = await dbHelpers.getAllJobs()
      
      // Apply filters
      if (debouncedSearch) {
        allJobs = allJobs.filter(j => 
          j.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          j.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      
      if (status) {
        allJobs = allJobs.filter(j => j.status === status)
      } else if (!isAdmin) {
        // Candidates see only active jobs by default
        allJobs = allJobs.filter(j => j.status === 'active')
      }
      
      // Sort by creation date (newest first)
      allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setJobs(allJobs)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const loadApplied = async () => {
    try {
      const candidates = await dbHelpers.getAllCandidates()
      const mine = candidates.filter(c => c.userId === user?.id)
      const ids = new Set(mine.map(c => c.jobId))
      setAppliedJobIds(ids)
    } catch (e) {
      console.error('Failed to load applied jobs:', e)
    }
  }

  const handleCreate = () => {
    setEditingJob(null)
    setModalOpen(true)
  }

  const handleEdit = (job) => {
    setEditingJob(job)
    setModalOpen(true)
  }

  const handleApply = (job) => {
    setApplyJob(job)
    setResumeLink('')
  }

  const submitApplication = async (e) => {
    e.preventDefault()
    if (!applyJob) return
    try {
      if (!resumeLink.trim()) {
        alert('Please provide a resume link')
        return
      }
      
      const candidate = {
        id: Date.now(),
        name: user?.name,
        email: user?.email,
        phone: '',
        jobId: applyJob.id,
        stage: 'applied',
        userId: user?.id,
        resumeLink: resumeLink.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await dbHelpers.saveCandidate(candidate)
      
      await dbHelpers.addStageTransition({
        candidateId: candidate.id,
        fromStage: 'applied',
        toStage: 'applied',
        timestamp: new Date().toISOString(),
        userId: candidate.userId || 'self',
        notes: 'Application submitted'
      })
      
      setApplyJob(null)
      await loadApplied()
      alert('Application submitted!')
    } catch (error) {
      console.error('Failed to apply:', error)
      alert('Failed to apply. Please try again.')
    }
  }

  const handleArchive = async (job, archive = true) => {
    try {
      console.log('Archiving job:', job.id, 'to status:', archive ? 'archived' : 'active')
      
      const updatedJob = {
        ...job,
        status: archive ? 'archived' : 'active',
        updatedAt: new Date().toISOString()
      }
      
      await dbHelpers.saveJob(updatedJob)
      console.log('Job archived successfully:', updatedJob)
      
      loadJobs()
    } catch (error) {
      console.error('Failed to archive job:', error)
      alert('Failed to archive job. Please try again.')
    }
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    
    const { source, destination } = result
    
    if (source.index === destination.index) return
    
    const reorderedJobs = [...jobs]
    const [removed] = reorderedJobs.splice(source.index, 1)
    reorderedJobs.splice(destination.index, 0, removed)
    
    setJobs(reorderedJobs)
    
    try {
      // Update the order in the database
      const updatedJob = {
        ...removed,
        order: destination.index,
        updatedAt: new Date().toISOString()
      }
      await dbHelpers.saveJob(updatedJob)
    } catch (error) {
      console.error('Failed to reorder job:', error)
      loadJobs()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage job postings' : 'Browse available jobs'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Create Job</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), search: e.target.value, page: '1' })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isAdmin && (
            <select
              value={status}
              onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), status: e.target.value, page: '1' })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No jobs found</div>
        ) : isAdmin ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="jobs">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {jobs.map((job, index) => (
                    <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                            snapshot.isDragging ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4 flex-1">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-move text-gray-400 hover:text-gray-600"
                              >
                                <ArrowUpDown size={20} />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Link
                                    to={`/jobs/${job.id}`}
                                    className="font-semibold text-gray-900 hover:text-blue-600"
                                  >
                                    {job.title}
                                  </Link>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      job.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {job.status}
                                  </span>
                                  {!isAdmin && appliedJobIds.has(job.id) && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Applied</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  {job.tags?.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleArchive(job, job.status !== 'archived')}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title={job.status === 'archived' ? 'Unarchive' : 'Archive'}
                              >
                                <Archive size={18} />
                              </button>
                              <button
                                onClick={() => handleEdit(job)}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div>
            {jobs.map((job) => (
              <div key={job.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {job.tags?.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {!isAdmin && job.status === 'active' && (
                    <button
                      onClick={() => handleApply(job)}
                      disabled={appliedJobIds.has(job.id)}
                      className={`ml-4 px-3 py-1.5 rounded-md text-sm ${appliedJobIds.has(job.id) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <JobModal
          job={editingJob}
          onClose={() => {
            setModalOpen(false)
            setEditingJob(null)
          }}
          onSuccess={loadJobs}
        />
      )}

      {!isAdmin && applyJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Apply to {applyJob.title}</h3>
            <p className="text-sm text-gray-600 mb-4">We will submit your application with your profile details.</p>
            <form onSubmit={submitApplication} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input disabled value={user?.name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input disabled value={user?.email || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Resume Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={resumeLink}
                onChange={(e) => setResumeLink(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setApplyJob(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
