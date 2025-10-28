import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { dbHelpers } from '../services/db'

export default function AssessmentSubmissions() {
  const { jobId } = useParams()
  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState(null)
  const [rows, setRows] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // jobId param can be slug or numeric id. Resolve job -> assessment
        let job = null
        if (isNaN(Number(jobId))) {
          job = await dbHelpers.getJobBySlug(jobId)
        } else {
          job = await dbHelpers.getJob(parseInt(jobId))
        }
        const a = job ? await dbHelpers.getAssessment(job.id) : null
        setAssessment(a)
        if (!a) { setRows([]); return }
        const subs = await dbHelpers.getResponsesByAssessment(a.id)
        const withUsers = await Promise.all(subs.map(async s => {
          // candidateId may be a user id for local users; try both lookups
          let cand = await dbHelpers.getCandidate(parseInt(s.candidateId))
          if (!cand) {
            cand = await dbHelpers.findCandidateByUserId(s.candidateId)
          }
          return {
            id: s.id,
            candidateId: s.candidateId,
            name: cand?.name || '—',
            email: cand?.email || '—',
            submittedAt: s.submittedAt,
            answers: s.answers
          }
        }))
        withUsers.sort((a,b)=> new Date(b.submittedAt) - new Date(a.submittedAt))
        setRows(withUsers)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [jobId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-600">Job ID {jobId}{assessment?.title ? ` • ${assessment.title}` : ''}</p>
        </div>
        <Link to="/assessments" className="text-sm text-gray-600 hover:text-gray-900">Back to Assessments</Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">No submissions yet.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-600 border-b border-gray-100">
            <div className="col-span-3">Candidate</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-3">Submitted</div>
            <div className="col-span-2">Answers</div>
          </div>
          {rows.map(r => (
            <div key={r.id} className="grid grid-cols-12 items-start px-4 py-3 border-b border-gray-100">
              <div className="col-span-3 text-gray-900">{r.name}</div>
              <div className="col-span-4 text-gray-700 text-sm break-all">{r.email}</div>
              <div className="col-span-3 text-gray-700 text-sm">{new Date(r.submittedAt).toLocaleString()}</div>
              <div className="col-span-2 text-sm">
                <details>
                  <summary className="cursor-pointer text-blue-600">View</summary>
                  <pre className="mt-2 bg-gray-50 p-2 rounded max-h-64 overflow-auto">{JSON.stringify(r.answers, null, 2)}</pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


