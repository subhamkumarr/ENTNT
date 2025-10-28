import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db, dbHelpers } from '../services/db'
import { Briefcase, Plus, FileText, Eye } from 'lucide-react'

const questionTypes = [
  { value: 'single-choice', label: 'Single Choice' },
  { value: 'multi-choice', label: 'Multiple Choice' },
  { value: 'short-text', label: 'Short Text' },
  { value: 'long-text', label: 'Long Text' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'file', label: 'File Upload' }
]

export default function Assessments() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState({})
  const [submissions, setSubmissions] = useState([])
  const [jobSearch, setJobSearch] = useState('')

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (selectedJob) {
      loadAssessment()
      loadSubmissions()
    }
  }, [selectedJob])

  const loadJobs = async () => {
    const allJobs = await dbHelpers.getAllJobs()
    setJobs(allJobs.filter(j => j.status === 'active'))
  }

  const loadAssessment = async () => {
    if (!selectedJob) return

    try {
      const response = await fetch(`/api/assessments/${selectedJob.id}`)
      if (!response.ok) {
        throw new Error('Failed to load assessment')
      }
      
      const data = await response.json()
      
      if (data) {
        setAssessment(data)
        setQuestions(data.questions || [])
      } else {
        setAssessment(null)
        setQuestions([])
      }
    } catch (error) {
      console.error('Error loading assessment:', error)
      setAssessment(null)
      setQuestions([])
    }
  }

  const loadSubmissions = async () => {
    if (!selectedJob) return
    try {
      const a = await dbHelpers.getAssessment(selectedJob.id)
      if (!a) { setSubmissions([]); return }
      const res = await dbHelpers.getResponsesByAssessment(a.id)
      setSubmissions(res || [])
    } catch (e) {
      console.error('Failed to load submissions', e)
      setSubmissions([])
    }
  }

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'short-text',
      label: 'New Question',
      required: false,
      options: null,
      placeholder: '',
      validation: {},
      conditional: null
    }
    setQuestions([...questions, newQuestion])
  }

  const handleQuestionChange = (id, updates) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    ))
  }

  const handleRemoveQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSave = async () => {
    if (!selectedJob) return

    try {
      const assessmentData = {
        ...(assessment || {}),
        jobId: selectedJob.id,
        title: assessment?.title || `Assessment for ${selectedJob.title}`,
        description: assessment?.description || '',
        questions
      }

      const response = await fetch(`/api/assessments/${selectedJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      })

      if (!response.ok) {
        throw new Error('Failed to save assessment')
      }

      const result = await response.json()
      console.log('Assessment saved:', result)
      
      // Reload assessment to show saved state
      loadAssessment()
      
      alert('Assessment saved successfully!')
    } catch (error) {
      console.error('Error saving assessment:', error)
      alert('Failed to save assessment. Please try again.')
    }
  }

  const handleTogglePreview = () => {
    if (!showPreview) {
      // Collect all answers for preview
      const data = {}
      questions.forEach(q => {
        data[q.id] = q.type === 'file' ? null : 
                     q.type === 'numeric' ? '' :
                     q.type === 'multi-choice' ? [] : ''
      })
      setPreviewData(data)
    }
    setShowPreview(!showPreview)
  }

  const handlePreviewChange = (questionId, value) => {
    setPreviewData({
      ...previewData,
      [questionId]: value
    })
  }

  const evaluateCondition = (conditional, answers) => {
    if (!conditional) return true
    
    const dependAnswer = answers[conditional.dependsOn]
    if (conditional.condition === 'equals') {
      return dependAnswer === conditional.value
    }
    return true
  }

  if (!selectedJob) {
    const filteredJobs = jobs.filter(j => {
      if (!jobSearch) return true
      const q = jobSearch.toLowerCase()
      const inTitle = j.title?.toLowerCase().includes(q)
      const inTags = (j.tags || []).some(t => String(t).toLowerCase().includes(q))
      return inTitle || inTags
    })
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">Create and manage job assessments</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={jobSearch}
            onChange={(e) => setJobSearch(e.target.value)}
            placeholder="Search jobs by title or tags..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Briefcase className="text-blue-600" size={24} />
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
              </div>
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {jobSearch ? 'No matching jobs found.' : 'No active jobs available. Create a job first.'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setSelectedJob(null)}
            className="text-gray-600 hover:text-gray-900 mb-2 text-sm"
          >
            ← Back to jobs
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Assessment: {selectedJob.title}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTogglePreview}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Eye size={18} />
            <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
          <Link
            to={`/assessments/${selectedJob.slug}/submissions`}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <span>See Submissions</span>
          </Link>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <FileText size={18} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
              <button
                onClick={handleAddQuestion}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Plus size={18} />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No questions yet</p>
                  <button
                    onClick={handleAddQuestion}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Add your first question
                  </button>
                </div>
              ) : (
                questions.map((q, index) => (
                  <QuestionBuilder
                    key={q.id}
                    question={q}
                    index={index}
                    onChange={(updates) => handleQuestionChange(q.id, updates)}
                    onRemove={() => handleRemoveQuestion(q.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h2>
              <div className="space-y-6">
                {questions.map((q, index) => {
                  const show = evaluateCondition(q.conditional, previewData)
                  if (!show) return null

                  return (
                    <div key={q.id} className="border-b border-gray-200 pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {q.label || 'Question'} {q.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderQuestionInput(q, previewData[q.id], (value) =>
                        handlePreviewChange(q.id, value)
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submissions */}
      {/* Submissions moved to dedicated page */}
    </div>
  )
}

function QuestionBuilder({ question, index, onChange, onRemove }) {
  const handleTypeChange = (type) => {
    const updates = { type }
    if (type === 'single-choice' || type === 'multi-choice') {
      updates.options = [
        { id: 1, text: 'Option 1', value: 1 },
        { id: 2, text: 'Option 2', value: 2 }
      ]
    } else {
      updates.options = null
    }
    onChange(updates)
  }

  const addOption = () => {
    const newId = Math.max(...(question.options || []).map(o => o.id || 0), 0) + 1
    onChange({
      options: [...(question.options || []), { id: newId, text: `Option ${newId}`, value: newId }]
    })
  }

  const updateOption = (optionId, text) => {
    onChange({
      options: question.options.map(opt =>
        opt.id === optionId ? { ...opt, text } : opt
      )
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          Remove
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={question.label || ''}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Question text"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {questionTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {(question.type === 'single-choice' || question.type === 'multi-choice') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
            {question.options?.map(opt => (
              <input
                key={opt.id}
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
              />
            ))}
            <button
              onClick={addOption}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Option
            </button>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            id={`required-${question.id}`}
            checked={question.required || false}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor={`required-${question.id}`} className="text-sm text-gray-700">
            Required
          </label>
        </div>
      </div>
    </div>
  )
}

function renderQuestionInput(question, value, onChange) {
  switch (question.type) {
    case 'short-text':
    case 'long-text':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={question.type === 'long-text' ? 4 : 2}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder={question.placeholder || 'Enter your answer...'}
          disabled
        />
      )
    case 'numeric':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          disabled
        />
      )
    case 'file':
      return (
        <input
          type="file"
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          disabled
        />
      )
    case 'single-choice':
      return (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <label key={opt.id} className="flex items-center">
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="mr-2"
                disabled
              />
              {opt.text}
            </label>
          ))}
        </div>
      )
    case 'multi-choice':
      const selectedValues = value || []
      return (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <label key={opt.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, opt.value])
                  } else {
                    onChange(selectedValues.filter(v => v !== opt.value))
                  }
                }}
                className="mr-2"
                disabled
              />
              {opt.text}
            </label>
          ))}
        </div>
      )
    default:
      return <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md" disabled />
  }
}
