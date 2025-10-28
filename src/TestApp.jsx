import React from 'react'

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 TalentFlow Test Page</h1>
      <p>If you can see this, React is working!</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>Check browser console for any errors</li>
          <li>Verify MSW service worker is registered</li>
          <li>Test login functionality</li>
        </ol>
      </div>
    </div>
  )
}

export default TestApp

