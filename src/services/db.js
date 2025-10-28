import Dexie from 'dexie'

class TalentFlowDB extends Dexie {
  constructor() {
    super('TalentFlowDB')
    
    this.version(1).stores({
      jobs: '++id, title, slug, status, tags, order, createdAt, updatedAt',
      candidates: '++id, name, email, phone, stage, jobId, createdAt, updatedAt',
      stageTransitions: '++id, candidateId, fromStage, toStage, timestamp',
      notes: '++id, candidateId, author, content, mentions, timestamp',
      assessments: '++id, jobId, title, description',
      questions: '++id, assessmentId, order, type, required, conditional',
      responses: '++id, assessmentId, candidateId, submittedAt',
      answerEntries: '++id, responseId, questionId'
    })
    
    this.jobs = this.table('jobs')
    this.candidates = this.table('candidates')
    this.stageTransitions = this.table('stageTransitions')
    this.notes = this.table('notes')
    this.assessments = this.table('assessments')
    this.questions = this.table('questions')
    this.responses = this.table('responses')
    this.answerEntries = this.table('answerEntries')
  }
}

export const db = new TalentFlowDB()

// Helper functions for data operations
export const dbHelpers = {
  // Jobs
  async getAllJobs() {
    return db.jobs.orderBy('order').toArray()
  },
  
  async getJob(id) {
    return db.jobs.get(id)
  },
  
  async getJobBySlug(slug) {
    return db.jobs.where('slug').equals(slug).first()
  },
  
  async saveJob(job) {
    return db.jobs.put(job)
  },
  
  async deleteJob(id) {
    return db.jobs.delete(id)
  },
  
  // Candidates
  async getAllCandidates() {
    return db.candidates.toArray()
  },
  
  async getCandidate(id) {
    return db.candidates.get(id)
  },
  
  async findCandidateByUserId(userId) {
    const all = await db.candidates.toArray()
    return all.find(c => String(c.userId) === String(userId)) || null
  },
  
  async saveCandidate(candidate) {
    return db.candidates.put(candidate)
  },
  
  // Stage Transitions
  async getCandidateTimeline(candidateId) {
    return db.stageTransitions
      .where('candidateId').equals(candidateId)
      .sortBy('timestamp')
  },
  
  async addStageTransition(transition) {
    return db.stageTransitions.add(transition)
  },
  
  // Notes
  async getCandidateNotes(candidateId) {
    return db.notes
      .where('candidateId').equals(candidateId)
      .sortBy('timestamp')
  },
  
  async saveNote(note) {
    return db.notes.add(note)
  },
  
  // Assessments
  async getAssessment(jobId) {
    const assessment = await db.assessments
      .where('jobId').equals(parseInt(jobId))
      .first()
    return assessment
  },
  
  async saveAssessment(assessment) {
    return db.assessments.put(assessment)
  },
  
  // Questions
  async getAssessmentQuestions(assessmentId) {
    return db.questions
      .where('assessmentId').equals(assessmentId)
      .sortBy('order')
  },
  
  async saveQuestion(question) {
    return db.questions.put(question)
  },

  async deleteQuestionsForAssessment(assessmentId) {
    return db.questions.where('assessmentId').equals(assessmentId).delete()
  },
  
  // Responses
  async getResponse(responseId) {
    return db.responses.get(responseId)
  },
  
  async saveResponse(response) {
    return db.responses.add(response)
  },

  async getResponsesByAssessment(assessmentId) {
    return db.responses.where('assessmentId').equals(assessmentId).toArray()
  }
}



