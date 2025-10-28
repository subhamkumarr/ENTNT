import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dbHelpers } from '../services/db'

export default function AssessmentAttempt() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState(null)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [lastSubmission, setLastSubmission] = useState(null)
  const draftKey = useMemo(() => `tf_draft_${user?.id || 'anon'}_${jobId}`, [user, jobId])

  useEffect(() => {
    load()
  }, [jobId])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/assessments/${jobId}`)
      const data = await res.json()
      setAssessment(data)
      // check previous submissions for this user
      if (data?.id && user?.id) {
        const subs = await dbHelpers.getResponsesByAssessment(data.id)
        const mine = subs
          .filter(s => String(s.candidateId) === String(user.id))
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        setHasSubmitted(mine.length > 0)
        setLastSubmission(mine[0] || null)
      } else {
        setHasSubmitted(false)
        setLastSubmission(null)
      }
      // restore draft
      const draft = localStorage.getItem(draftKey)
      if (draft) setAnswers(JSON.parse(draft))
    } catch (e) {
      setError('Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }

  const evaluateCondition = (conditional, currentAnswers) => {
    if (!conditional) return true
    const dependAnswer = currentAnswers[conditional.dependsOn]
    if (conditional.condition === 'equals') return dependAnswer === conditional.value
    return true
  }

  const updateAnswer = (qid, value) => {
    const next = { ...answers, [qid]: value }
    setAnswers(next)
    localStorage.setItem(draftKey, JSON.stringify(next))
  }

  const validate = () => {
    if (!assessment?.questions) return { ok: true }
    for (const q of assessment.questions) {
      const visible = evaluateCondition(q.conditional, answers)
      if (!visible) continue
      const val = answers[q.id]
      if (q.required && (val == null || (Array.isArray(val) ? val.length === 0 : String(val).trim() === ''))) {
        return { ok: false, message: `Please answer: ${q.label || 'Question'}` }
      }
      if (q.type === 'numeric' && val !== '' && val != null) {
        const num = Number(val)
        if (Number.isNaN(num)) return { ok: false, message: `${q.label}: enter a valid number` }
        if (q.validation?.min != null && num < q.validation.min) return { ok: false, message: `${q.label}: must be >= ${q.validation.min}` }
        if (q.validation?.max != null && num > q.validation.max) return { ok: false, message: `${q.label}: must be <= ${q.validation.max}` }
      }
      if ((q.type === 'short-text' || q.type === 'long-text') && q.validation?.maxLength && val) {
        if (String(val).length > q.validation.maxLength) return { ok: false, message: `${q.label}: max length ${q.validation.maxLength}` }
      }
    }
    return { ok: true }
  }

  const submit = async () => {
    setError('')
    const v = validate()
    if (!v.ok) {
      setError(v.message)
      return
    }
    try {
      const payload = {
        assessmentId: assessment.id,
        candidateId: user?.id || 'self',
        answers
      }
      const res = await fetch(`/api/assessments/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to submit')
      localStorage.removeItem(draftKey)
      navigate('/applied')
    } catch (e) {
      setError('Submission failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No assessment available for this job.</p>
        <Link to="/applied" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">Back</Link>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
          <Link to="/applied" className="text-sm text-gray-600 hover:text-gray-900">Back to Applied Jobs</Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
          You have already submitted this assessment. You can't retake the assessment.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
        <Link to="/applied" className="text-sm text-gray-600 hover:text-gray-900">Back to Applied Jobs</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {assessment.questions?.map((q) => {
          const visible = evaluateCondition(q.conditional, answers)
          if (!visible) return null
          return (
            <div key={q.id} className="border-b border-gray-100 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {q.label || 'Question'} {q.required && <span className="text-red-500">*</span>}
              </label>
              {renderInput(q, answers[q.id], (v) => updateAnswer(q.id, v))}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => localStorage.removeItem(draftKey)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Clear Draft
        </button>
        <button
          onClick={submit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

function renderInput(q, value, onChange) {
  switch (q.type) {
    case 'short-text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder={q.placeholder || 'Enter your answer...'}
        />
      )
    case 'long-text':
      return (
        <textarea
          rows={4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder={q.placeholder || 'Enter your answer...'}
        />
      )
    case 'numeric':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      )
    case 'single-choice':
      return (
        <div className="space-y-2">
          {q.options?.map(opt => (
            <label key={opt.id} className="flex items-center">
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="mr-2"
              />
              {opt.text}
            </label>
          ))}
        </div>
      )
    case 'multi-choice':
      return (
        <div className="space-y-2">
          {q.options?.map(opt => {
            const arr = Array.isArray(value) ? value : []
            const checked = arr.includes(opt.value)
            return (
              <label key={opt.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...arr, opt.value])
                    else onChange(arr.filter(v => v !== opt.value))
                  }}
                  className="mr-2"
                />
                {opt.text}
              </label>
            )
          })}
        </div>
      )
    case 'file':
      return (
        <input type="file" disabled className="w-full px-4 py-2 border border-gray-300 rounded-md" />
      )
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      )
  }
}


