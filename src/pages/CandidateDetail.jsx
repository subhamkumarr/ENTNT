import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Clock, MessageSquare, Plus } from 'lucide-react'
import { dbHelpers } from '../services/db'

export default function CandidateDetail() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)

  useEffect(() => {
    loadCandidate()
    loadTimeline()
    loadNotes()
  }, [id])

  const loadCandidate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/candidates/${id}`)
      const data = await response.json()
      setCandidate(data)
    } catch (error) {
      console.error('Failed to load candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async () => {
    try {
      const response = await fetch(`/api/candidates/${id}/timeline`)
      const data = await response.json()
      setTimeline(data || [])
    } catch (error) {
      console.error('Failed to load timeline:', error)
    }
  }

  const loadNotes = async () => {
    const candidateNotes = await dbHelpers.getCandidateNotes(parseInt(id))
    setNotes(candidateNotes || [])
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    const mentions = extractMentions(newNote)
    
    await dbHelpers.saveNote({
      candidateId: parseInt(id),
      author: 'Current User',
      content: newNote,
      mentions,
      timestamp: new Date().toISOString()
    })

    setNewNote('')
    setShowNoteForm(false)
    loadNotes()
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

  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

  return (
    <div className="space-y-6">
      <Link
        to="/candidates"
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        <span>Back to Candidates</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {candidate.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail size={18} />
                    <span>{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone size={18} />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Stage</h3>
              <div className="flex flex-wrap gap-2">
                {stages.map(stage => (
                  <span
                    key={stage}
                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                      candidate.stage === stage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <p className="text-gray-500 text-sm">No timeline events yet</p>
              ) : (
                timeline.map((event, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Moved from <span className="text-gray-600">{event.fromStage}</span> to{' '}
                        <span className="text-blue-600">{event.toStage}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Clock size={14} />
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notes Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            {showNoteForm && (
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note... Use @username to mention"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddNote}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setNewNote('')
                      setShowNoteForm(false)
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-gray-500 text-sm">No notes yet</p>
              ) : (
                notes.map((note, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="text-sm text-gray-900 mb-1 whitespace-pre-wrap">
                      {note.content}
                    </div>
                    {note.mentions && note.mentions.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {note.mentions.map((mention, i) => (
                          <span
                            key={i}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                          >
                            @{mention}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {note.author} • {new Date(note.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



