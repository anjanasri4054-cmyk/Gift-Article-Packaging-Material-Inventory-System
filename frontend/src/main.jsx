import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize theme from localStorage immediately to avoid theme flashing
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark')
} else {
  document.body.classList.remove('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
