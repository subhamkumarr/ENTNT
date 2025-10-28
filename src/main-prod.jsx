import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-prod.jsx'
import './index.css'

// Production version without MSW
console.log('🚀 Starting TalentFlow app (Production)...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found!')
} else {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('✅ App rendered successfully')
}
