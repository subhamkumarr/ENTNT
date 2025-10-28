import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, User, Mail, Calendar, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function Candidates() {
  const { isAdmin } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20

  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

  useEffect(() => {
    if (!isAdmin) return
    loadCandidates()
  }, [isAdmin, currentPage, search, filterStage])

  const loadCandidates = async () => {
    setLoading(true)
    try {
      const allCandidates = await dbHelpers.getAllCandidates()
      
      // Filter candidates
      let filtered = allCandidates
      
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(c => 
          c.name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
        )
      }
      
      if (filterStage) {
        filtered = filtered.filter(c => c.stage === filterStage)
      }
      
      // Sort by creation date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      // Calculate pagination
      const total = filtered.length
      const pages = Math.ceil(total / pageSize)
      setTotalPages(pages)
      
      // Get current page
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const pageCandidates = filtered.slice(start, end)
      
      setCandidates(pageCandidates)
    } catch (e) {
      console.error('Failed to load candidates:', e)
      setCandidates([])
    } finally {
      setLoading(false)
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
        
        await loadCandidates()
      }
    } catch (e) {
      console.error('Failed to update stage:', e)
    }
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

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">Go Home</Link>
      </div>
    )
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <div className="text-sm text-gray-600">
          {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Stages</option>
              {stages.map(stage => (
                <option key={stage} value={stage}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || filterStage ? 'No candidates match your filters.' : 'No candidates found.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {candidate.name || 'Unknown Name'}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(candidate.stage)}`}>
                            {candidate.stage}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail size={14} />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>Applied {new Date(candidate.createdAt).toLocaleDateString()}</span>
                          </div>
                          {candidate.resumeLink && (
                            <div className="flex items-center space-x-1">
                              <FileText size={14} />
                              <a 
                                href={candidate.resumeLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Resume
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Move to:</span>
                      <select
                        value={candidate.stage}
                        onChange={(e) => updateStage(candidate.id, e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {stages.map(stage => (
                          <option key={stage} value={stage}>
                            {stage.charAt(0).toUpperCase() + stage.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Link
                      to={`/candidates/${candidate.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
