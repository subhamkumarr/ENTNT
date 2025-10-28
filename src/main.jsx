import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize MSW
async function enableMocking() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mocks/browser.js')
      await worker.start({
        onUnhandledRequest: 'bypass',
      })
      console.log('✅ MSW enabled')
      return true
    } catch (error) {
      console.warn('⚠️ MSW failed to start:', error)
      return false
    }
  }
  return false
}

// Start the app
async function startApp() {
  try {
    console.log('🚀 Starting TalentFlow app...')
    
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      console.error('❌ Root element not found!')
      return
    }
    
    // Initialize MSW first
    await enableMocking()
    
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    
    console.log('✅ App rendered successfully')
  } catch (error) {
    console.error('❌ Failed to initialize app:', error)
    
    // Fallback: render app even if MSW fails
    const rootElement = document.getElementById('root')
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement)
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      )
    }
  }
}

startApp()