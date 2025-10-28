import { db } from '../services/db'

const jobTitles = [
  'Senior Frontend Developer', 'Backend Engineer', 'UX Designer',
  'Product Manager', 'DevOps Engineer', 'Full Stack Developer',
  'Data Scientist', 'QA Engineer', 'Mobile Developer', 'Marketing Manager',
  'Sales Representative', 'HR Manager', 'Business Analyst',
  'Security Engineer', 'Cloud Architect', 'AI/ML Engineer',
  'Content Manager', 'Graphic Designer', 'Technical Writer',
  'Customer Success Manager', 'Accountant', 'Operations Manager',
  'UI Designer', 'System Administrator', 'Network Engineer'
]

const candidateNames = [
  'Emma Thompson', 'James Wilson', 'Olivia Martinez', 'Michael Brown',
  'Sophia Garcia', 'William Jones', 'Isabella Davis', 'Benjamin Miller',
  'Mia Anderson', 'Elijah Taylor', 'Charlotte Moore', 'Henry Jackson',
  'Amelia White', 'Lucas Harris', 'Harper Clark', 'Alexander Lewis',
  'Evelyn Robinson', 'Mason Walker', 'Abigail Hall', 'Logan Young'
]

const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

function generateEmail(name) {
  return name.toLowerCase().replace(' ', '.') + '@example.com'
}

export async function seedDatabase() {
  // Check if already seeded
  const existingJobs = await db.jobs.count()
  if (existingJobs > 0) {
    return // Already seeded
  }

  console.log('Starting database seed...')

  // Seed Jobs
  const jobs = jobTitles.map((title, index) => ({
    id: index + 1,
    title,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    status: index % 3 === 0 ? 'archived' : 'active',
    tags: generateTags(title),
    order: index,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    updatedAt: new Date().toISOString()
  }))

  await db.jobs.bulkAdd(jobs)
  console.log(`Seeded ${jobs.length} jobs`)

  // Seed Candidates
  const candidates = []
  for (let i = 0; i < 1000; i++) {
    const name = candidateNames[i % candidateNames.length] + ` ${i}`
    const randomJobId = Math.floor(Math.random() * jobs.length) + 1
    const randomStage = stages[Math.floor(Math.random() * stages.length)]
    
    candidates.push({
      id: i + 1,
      name,
      email: generateEmail(name),
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      stage: randomStage,
      jobId: randomJobId,
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  await db.candidates.bulkAdd(candidates)
  console.log(`Seeded ${candidates.length} candidates`)

  // Seed Stage Transitions
  const transitions = []
  for (const candidate of candidates) {
    const numTransitions = Math.floor(Math.random() * 4) + 1
    let currentStage = 0
    
    for (let i = 0; i < numTransitions; i++) {
      transitions.push({
        candidateId: candidate.id,
        fromStage: i === 0 ? 'applied' : stages[currentStage - 1],
        toStage: stages[currentStage],
        timestamp: new Date(Date.now() - (numTransitions - i) * 1000000).toISOString(),
        userId: '1',
        notes: ''
      })
      currentStage++
      if (currentStage >= stages.length) break
    }
  }

  await db.stageTransitions.bulkAdd(transitions)
  console.log(`Seeded ${transitions.length} stage transitions`)

  // Seed Assessments
  const assessments = []
  for (let i = 0; i < 3; i++) {
    assessments.push({
      id: i + 1,
      jobId: (i + 1) * 5,
      title: `Assessment for ${jobTitles[i * 5]}`,
      description: 'Please complete this assessment to proceed with your application.'
    })
  }

  await db.assessments.bulkAdd(assessments)
  console.log(`Seeded ${assessments.length} assessments`)

  // Seed Questions
  const questions = []
  const questionTypes = ['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file']
  const sampleQuestions = {
    'single-choice': [
      'Do you have professional experience in this field?',
      'Are you willing to relocate?',
      'Do you have a valid work permit?'
    ],
    'multi-choice': [
      'Which programming languages do you know?',
      'What are your communication preferences?',
      'Which benefits are important to you?'
    ],
    'short-text': [
      'Years of experience',
      'Current location',
      'Preferred salary range'
    ],
    'long-text': [
      'Tell us about yourself',
      'Why are you interested in this position?',
      'Describe a challenging project you worked on'
    ],
    'numeric': [
      'Years of experience',
      'Number of projects completed',
      'Team size you managed'
    ]
  }

  for (const assessment of assessments) {
    for (let i = 0; i < 10; i++) {
      const type = questionTypes[i % questionTypes.length]
      const typeQuestions = sampleQuestions[type] || []
      const questionText = typeQuestions[i % typeQuestions.length] || `Question ${i + 1}`
      
      questions.push({
        id: assessment.id * 100 + i,
        assessmentId: assessment.id,
        order: i,
        type,
        label: questionText,
        required: i % 3 === 0,
        options: type === 'single-choice' || type === 'multi-choice' 
          ? generateOptions(4)
          : null,
        placeholder: `Enter your answer...`,
        validation: {
          min: type === 'numeric' ? 0 : null,
          max: type === 'numeric' ? 50 : null,
          maxLength: type === 'short-text' ? 100 : type === 'long-text' ? 500 : null
        },
        conditional: i > 3 ? {
          dependsOn: assessment.id * 100 + (i - 4),
          condition: 'equals',
          value: 'Yes'
        } : null
      })
    }
  }

  await db.questions.bulkAdd(questions)
  console.log(`Seeded ${questions.length} questions`)

  console.log('Database seeding completed!')
}

function generateTags(title) {
  const allTags = [
    'Remote', 'Full-time', 'Part-time', 'Contract', 'Urgent',
    'Tech', 'Design', 'Marketing', 'Sales', 'Management'
  ]
  
  const numTags = Math.floor(Math.random() * 3) + 1
  const tags = []
  for (let i = 0; i < numTags; i++) {
    tags.push(allTags[Math.floor(Math.random() * allTags.length)])
  }
  return [...new Set(tags)]
}

function generateOptions(count) {
  const options = ['Option A', 'Option B', 'Option C', 'Option D']
  return options.slice(0, count).map((text, index) => ({
    id: index + 1,
    text,
    value: index + 1
  }))
}







