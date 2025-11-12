import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import StaffManagement from './components/StaffManagement'
import ShiftManagement from './components/ShiftManagement'
import ScheduleView from './components/ScheduleView'
import FairnessDashboard from './components/FairnessDashboard'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="nav">
      <ul>
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Schedule
          </Link>
        </li>
        <li>
          <Link to="/staff" className={location.pathname === '/staff' ? 'active' : ''}>
            Staff
          </Link>
        </li>
        <li>
          <Link to="/shifts" className={location.pathname === '/shifts' ? 'active' : ''}>
            Shifts
          </Link>
        </li>
        <li>
          <Link to="/fairness" className={location.pathname === '/fairness' ? 'active' : ''}>
            Fairness
          </Link>
        </li>
      </ul>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <div className="container">
          <Routes>
            <Route path="/" element={<ScheduleView />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/shifts" element={<ShiftManagement />} />
            <Route path="/fairness" element={<FairnessDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
