import { http, HttpResponse } from 'msw'
import { db, dbHelpers } from '../services/db'

// Simulate latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const randomDelay = () => delay(200 + Math.random() * 1000)

// Simulate errors (5-10% chance on writes)
const shouldError = () => Math.random() < 0.08

export const handlers = [
  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    await randomDelay()
    
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const sort = url.searchParams.get('sort') || 'order'
    
    let jobs = await dbHelpers.getAllJobs()
    
    // Apply filters
    if (search) {
      jobs = jobs.filter(j => 
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.slug.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (status) {
      jobs = jobs.filter(j => j.status === status)
    }
    
    // Sorting - newest first by default
    if (sort === 'title') {
      jobs.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === 'created') {
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sort === 'order') {
      jobs.sort((a, b) => (b.createdAt && a.createdAt) ? new Date(b.createdAt) - new Date(a.createdAt) : 0)
    }
    
    // Pagination
    const total = jobs.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedJobs = jobs.slice(start, end)
    
    return HttpResponse.json({
      data: paginatedJobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  }),
  
  http.get('/api/jobs/:id', async ({ params }) => {
    await randomDelay()
    const job = await dbHelpers.getJob(parseInt(params.id))
    
    if (!job) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    return HttpResponse.json(job)
  }),
  
  http.post('/api/jobs', async ({ request }) => {
    await randomDelay()
    
    if (shouldError()) {
      return HttpResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }
    
    const data = await request.json()
    const maxOrder = (await dbHelpers.getAllJobs()).reduce((max, job) => 
      Math.max(max, job.order || 0), 0)
    
    const job = {
      ...data,
      id: Date.now(),
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await dbHelpers.saveJob(job)
    return HttpResponse.json(job, { status: 201 })
  }),
  
  http.patch('/api/jobs/:id', async ({ params, request }) => {
    await randomDelay()
    
    if (shouldError()) {
      return HttpResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }
    
    const data = await request.json()
    const existingJob = await dbHelpers.getJob(parseInt(params.id))
    
    if (!existingJob) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    const updatedJob = {
      ...existingJob,
      ...data,
      id: parseInt(params.id),
      updatedAt: new Date().toISOString()
    }
    
    await dbHelpers.saveJob(updatedJob)
    return HttpResponse.json(updatedJob)
  }),
  
  http.patch('/api/jobs/:id/reorder', async ({ params, request }) => {
    await randomDelay()
    
    if (shouldError()) {
      return HttpResponse.json({ error: 'Failed to reorder job' }, { status: 500 })
    }
    
    const { fromOrder, toOrder } = await request.json()
    const jobs = await dbHelpers.getAllJobs()
    
    // Optimistically update (simplified)
    const job = jobs.find(j => j.order === fromOrder)
    if (job) {
      job.order = toOrder
      await dbHelpers.saveJob(job)
    }
    
    return HttpResponse.json({ success: true })
  }),
  
  // Candidates endpoints
  http.get('/api/candidates', async ({ request }) => {
    await randomDelay()
    
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const stage = url.searchParams.get('stage') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50')
    
    let candidates = await dbHelpers.getAllCandidates()
    
    // Apply filters
    if (search) {
      candidates = candidates.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (stage) {
      candidates = candidates.filter(c => c.stage === stage)
    }
    
    // Sort newest first so recent applications are included on first page
    candidates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Pagination
    const total = candidates.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedCandidates = candidates.slice(start, end)
    
    return HttpResponse.json({
      data: paginatedCandidates,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  }),
  
  http.post('/api/candidates', async ({ request }) => {
    await randomDelay()
    
    if (shouldError()) {
      return HttpResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
    }
    
    const data = await request.json()
    const candidate = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      jobId: parseInt(data.jobId),
      stage: 'applied',
      userId: data.userId || null,
      resumeLink: data.resumeLink || '',
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
    
    return HttpResponse.json(candidate, { status: 201 })
  }),
  
  http.get('/api/candidates/:id', async ({ params }) => {
    await randomDelay()
    const candidate = await dbHelpers.getCandidate(parseInt(params.id))
    
    if (!candidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }
    
    return HttpResponse.json(candidate)
  }),
  
  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await randomDelay()
    const timeline = await dbHelpers.getCandidateTimeline(parseInt(params.id))
    
    return HttpResponse.json(timeline)
  }),
  
  http.patch('/api/candidates/:id', async ({ params, request }) => {
    await randomDelay()
    
    if (shouldError()) {
      return HttpResponse.json({ error: 'Failed to update candidate' }, { status: 500 })
    }
    
    const data = await request.json()
    const existingCandidate = await dbHelpers.getCandidate(parseInt(params.id))
    
    if (!existingCandidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }
    
    const updatedCandidate = {
      ...existingCandidate,
      ...data,
      id: parseInt(params.id),
      updatedAt: new Date().toISOString()
    }
    
    // If stage changed, record transition
    if (data.stage && data.stage !== existingCandidate.stage) {
      await dbHelpers.addStageTransition({
        candidateId: parseInt(params.id),
        fromStage: existingCandidate.stage,
        toStage: data.stage,
        timestamp: new Date().toISOString(),
        userId: '1',
        notes: ''
      })
    }
    
    await dbHelpers.saveCandidate(updatedCandidate)
    return HttpResponse.json(updatedCandidate)
  }),
  
  // Assessments endpoints
  http.get('/api/assessments/:jobId', async ({ params }) => {
    await randomDelay()
    const assessment = await dbHelpers.getAssessment(params.jobId)
    
    if (!assessment) {
      return HttpResponse.json(null)
    }
    
    const questions = await dbHelpers.getAssessmentQuestions(assessment.id)
    
    return HttpResponse.json({
      ...assessment,
      questions
    })
  }),
  
  http.put('/api/assessments/:jobId', async ({ params, request }) => {
    await randomDelay()
    
    // Reduce error rate for this endpoint to stabilize saves
    if (Math.random() < 0.02) {
      return HttpResponse.json({ error: 'Failed to save assessment' }, { status: 500 })
    }
    
    const data = await request.json()
    let existing = await dbHelpers.getAssessment(params.jobId)
    
    const assessment = {
      id: existing?.id || Date.now(),
      jobId: parseInt(params.jobId),
      title: data.title || existing?.title || `Assessment for Job ${params.jobId}`,
      description: data.description || existing?.description || '',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await dbHelpers.saveAssessment(assessment)
    
    // Replace questions for this assessment
    await dbHelpers.deleteQuestionsForAssessment(assessment.id)
    const questions = (data.questions || []).map((q, idx) => ({
      ...q,
      id: q.id || Date.now() + idx,
      order: typeof q.order === 'number' ? q.order : idx,
      assessmentId: assessment.id
    }))
    for (const q of questions) {
      await dbHelpers.saveQuestion(q)
    }
    
    return HttpResponse.json(assessment)
  }),
  
  http.post('/api/assessments/:jobId/submit', async ({ params, request }) => {
    await randomDelay()
    
    if (shouldError()) {
      return HttpResponse.json({ error: 'Failed to submit assessment' }, { status: 500 })
    }
    
    const data = await request.json()
    const response = {
      id: Date.now(),
      assessmentId: data.assessmentId,
      candidateId: data.candidateId,
      answers: data.answers,
      submittedAt: new Date().toISOString()
    }
    
    await dbHelpers.saveResponse(response)
    return HttpResponse.json({ success: true, response })
  })
]
