import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HRLogin from './pages/HRLogin'
import HRDashboard from './pages/HRDashboard'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HRLogin />} />
        <Route path="/login" element={<HRLogin />} />
        <Route path="/dashboard" element={<HRDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
