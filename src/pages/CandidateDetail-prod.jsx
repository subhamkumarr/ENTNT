import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Calendar, FileText, MessageSquare, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function CandidateDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [transitions, setTransitions] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newStage, setNewStage] = useState('')

  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

  useEffect(() => {
    if (!isAdmin) return
    loadCandidate()
  }, [id, isAdmin])

  const loadCandidate = async () => {
    setLoading(true)
    try {
      const candidateData = await dbHelpers.getCandidate(parseInt(id))
      if (candidateData) {
        setCandidate(candidateData)
        setNewStage(candidateData.stage)
        
        // Load stage transitions
        const transitionsData = await dbHelpers.getStageTransitions(parseInt(id))
        setTransitions(transitionsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
        
        // Load notes (mock data for now)
        setNotes([
          {
            id: 1,
            content: 'Initial screening completed. Strong technical background.',
            author: 'HR Team',
            timestamp: new Date().toISOString(),
            mentions: []
          }
        ])
      }
    } catch (e) {
      console.error('Failed to load candidate:', e)
    } finally {
      setLoading(false)
    }
  }

  const updateStage = async () => {
    if (!candidate || newStage === candidate.stage) return
    
    try {
      const updatedCandidate = {
        ...candidate,
        stage: newStage,
        updatedAt: new Date().toISOString()
      }
      await dbHelpers.saveCandidate(updatedCandidate)
      
      // Record stage transition
      await dbHelpers.addStageTransition({
        candidateId: parseInt(id),
        fromStage: candidate.stage,
        toStage: newStage,
        timestamp: new Date().toISOString(),
        userId: '1',
        notes: ''
      })
      
      await loadCandidate()
    } catch (e) {
      console.error('Failed to update stage:', e)
    }
  }

  const addNote = () => {
    if (!newNote.trim()) return
    
    const note = {
      id: Date.now(),
      content: newNote,
      author: 'Current User',
      timestamp: new Date().toISOString(),
      mentions: extractMentions(newNote)
    }
    
    setNotes([note, ...notes])
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

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Candidate not found</p>
        <Link to="/candidates" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Candidates
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/candidates"
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        <span>Back to Candidates</span>
      </Link>

      {/* Candidate Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{candidate.name || 'Unknown Name'}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Mail size={16} />
                  <span>{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Applied {new Date(candidate.createdAt).toLocaleDateString()}</span>
                </div>
                {candidate.resumeLink && (
                  <div className="flex items-center space-x-1">
                    <FileText size={16} />
                    <a 
                      href={candidate.resumeLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View Resume
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStageColor(candidate.stage)}`}>
              {candidate.stage}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Management</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stage
              </label>
              <div className="flex items-center space-x-3">
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {stages.map(stage => (
                    <option key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={updateStage}
                  disabled={newStage === candidate.stage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Stage
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
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
            <div className="space-y-3">
              {notes.map((note) => (
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
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
        <div className="space-y-4">
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
  )
}
