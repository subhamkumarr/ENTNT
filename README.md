# TalentFlow - Mini Hiring Platform

A comprehensive React application for managing jobs, candidates, and assessments in a hiring workflow.

## Features

### Jobs Management
- ✅ Create, edit, archive, and reorder jobs
- ✅ Drag-and-drop reordering with optimistic updates
- ✅ Server-like pagination and filtering
- ✅ Deep linking to individual jobs
- ✅ Tag system for job organization

### Candidates Management
- ✅ Virtualized list for 1000+ candidates
- ✅ Client-side search by name/email
- ✅ Filter by stage (applied, screen, tech, offer, hired, rejected)
- ✅ Candidate profile with timeline
- ✅ Move candidates between stages
- ✅ Notes with @mention support

### Assessments
- ✅ Assessment builder per job
- ✅ Multiple question types (single-choice, multi-choice, text, numeric, file upload)
- ✅ Live preview pane
- ✅ Conditional questions support
- ✅ Local persistence

### Technical Features
- ✅ MSW for API mocking with artificial latency (200-1200ms)
- ✅ 5-10% error rate simulation on write operations
- ✅ IndexedDB persistence via Dexie
- ✅ Optimistic UI updates with rollback
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive design

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ENTNTproject
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Demo Credentials

**Admin User:**
- Email: `admin@gmail.com`
- Password: `admin#123`

**Regular User:**
- Use any email/password combination

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout.jsx
│   └── jobs/
│       └── JobModal.jsx
├── context/          # React context providers
│   └── AuthContext.jsx
├── mocks/            # MSW handlers
│   ├── browser.js
│   └── handlers.js
├── pages/            # Page components
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Jobs.jsx
│   ├── JobDetail.jsx
│   ├── Candidates.jsx
│   ├── CandidateDetail.jsx
│   └── Assessments.jsx
├── services/         # Database and API services
│   └── db.js
├── hooks/            # Custom React hooks
│   └── useDebounce.js
├── utils/            # Utility functions
│   └── seedData.js
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **MSW** - API mocking
- **Dexie.js** - IndexedDB wrapper
- **Tailwind CSS** - Styling
- **react-beautiful-dnd** - Drag and drop
- **react-window** - Virtualization
- **lucide-react** - Icons

## Features in Detail

### Jobs Module
- List jobs with pagination (10 per page)
- Search by title
- Filter by status (active/archived)
- Create new jobs with validation
- Edit existing jobs
- Archive/unarchive functionality
- Drag-and-drop reordering with optimistic updates
- Individual job detail pages

### Candidates Module
- Virtualized list showing all candidates efficiently
- Search by name or email
- Filter by current stage
- Stage transition management
- Detailed candidate timeline
- Notes system with @mentions

### Assessments Module
- Select a job to create/edit assessment
- Add/remove questions dynamically
- Multiple question types:
  - Single choice
  - Multiple choice
  - Short text
  - Long text
  - Numeric
  - File upload (stub)
- Conditional questions
- Live preview of assessment form
- Question validation rules

## API Endpoints

All endpoints are mocked via MSW:

```
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PATCH  /api/jobs/:id
PATCH  /api/jobs/:id/reorder
GET    /api/candidates
GET    /api/candidates/:id
PATCH  /api/candidates/:id
GET    /api/candidates/:id/timeline
GET    /api/assessments/:jobId
PUT    /api/assessments/:jobId
POST   /api/assessments/:jobId/submit
```

## Data Persistence

- All data is stored in IndexedDB using Dexie
- Data persists across page refreshes
- Seeded with:
  - 25 jobs (mixed active/archived)
  - 1000 candidates
  - 3 assessments with 10+ questions each

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT







