import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function AssessmentSubmissions() {
  const { jobSlug } = useParams()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [candidates, setCandidates] = useState(new Map())
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    if (!isAdmin) return
    load()
  }, [jobSlug, isAdmin])

  const load = async () => {
    setLoading(true)
    try {
      // Find job by slug
      const jobData = await dbHelpers.getJobBySlug(jobSlug)
      if (!jobData) {
        setJob(null)
        setAssessment(null)
        setSubmissions([])
        return
      }
      setJob(jobData)

      // Find assessment for this job
      const assessmentData = await dbHelpers.getAssessment(jobData.id)
      if (!assessmentData) {
        setAssessment(null)
        setSubmissions([])
        return
      }
      setAssessment(assessmentData)

      // Load questions
      const questions = await dbHelpers.getAssessmentQuestions(assessmentData.id)
      setAssessment({ ...assessmentData, questions })

      // Load submissions
      const subs = await dbHelpers.getResponsesByAssessment(assessmentData.id)
      setSubmissions(subs)

      // Load candidate details
      const candidateMap = new Map()
      for (const sub of subs) {
        if (sub.candidateId) {
          try {
            const candidate = await dbHelpers.getCandidate(parseInt(sub.candidateId))
            if (candidate) {
              candidateMap.set(String(sub.candidateId), candidate)
            }
          } catch (e) {
            // Try to find by userId
            const candidates = await dbHelpers.getAllCandidates()
            const found = candidates.find(c => String(c.userId) === String(sub.candidateId))
            if (found) {
              candidateMap.set(String(sub.candidateId), found)
            }
          }
        }
      }
      setCandidates(candidateMap)
    } catch (e) {
      console.error('Failed to load submissions:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  const getQuestionLabel = (qid) => {
    if (!assessment?.questions) return `Question ${qid}`
    const q = assessment.questions.find(q => q.id === qid)
    return q?.label || `Question ${qid}`
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

  if (!job || !assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Assessment not found</p>
        <Link to="/assessments" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">Back to Assessments</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Submissions</h1>
          <p className="text-gray-600 mt-1">{job.title}</p>
        </div>
        <Link
          to="/assessments"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to Assessments
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{assessment.title}</h2>
          <p className="text-gray-600 text-sm mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {submissions.map((sub) => {
            const candidate = candidates.get(String(sub.candidateId))
            const isExpanded = expanded.has(sub.id)
            return (
              <div key={sub.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {candidate?.name || `Candidate ${sub.candidateId}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {candidate?.email || 'No email available'}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpanded(sub.id)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    {isExpanded ? 'Hide' : 'Show'} Answers
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">Answers:</h4>
                    <div className="space-y-3">
                      {Object.entries(sub.answers || {}).map(([qid, answer]) => (
                        <div key={qid} className="border-l-4 border-blue-200 pl-4">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {getQuestionLabel(qid)}
                          </div>
                          <div className="text-sm text-gray-900">
                            {Array.isArray(answer) ? answer.join(', ') : String(answer || '—')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {submissions.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No submissions yet for this assessment.
          </div>
        )}
      </div>
    </div>
  )
}
