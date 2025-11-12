import React, { useState, useEffect } from 'react'
import { getShiftTemplates, getWeekAssignments, getStaff, autoSchedule, clearWeekAssignments, deleteAssignment, createAssignment } from '../api'
import { format, startOfWeek, addDays } from 'date-fns'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ScheduleView() {
  const [shiftTemplates, setShiftTemplates] = useState([])
  const [assignments, setAssignments] = useState([])
  const [staff, setStaff] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [scheduling, setScheduling] = useState(false)
  const [scheduleResult, setScheduleResult] = useState(null)
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState({})

  useEffect(() => {
    loadData()
  }, [selectedWeek])

  const loadData = async () => {
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')

      console.log('DEBUG: Loading data for week:', weekStartStr)

      const [templatesResp, assignmentsResp, staffResp] = await Promise.all([
        getShiftTemplates(),
        getWeekAssignments(weekStartStr),
        getStaff()
      ])

      console.log('DEBUG: Received data:')
      console.log('  - Templates:', templatesResp.data.length)
      console.log('  - Assignments:', assignmentsResp.data.length, assignmentsResp.data)
      console.log('  - Staff:', staffResp.data.length)

      setShiftTemplates(templatesResp.data)
      setAssignments(assignmentsResp.data)
      setStaff(staffResp.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleAutoSchedule = async () => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })

    setScheduling(true)
    setScheduleResult(null)

    try {
      const response = await autoSchedule({
        week_start_date: weekStart.toISOString(),
        clear_existing: false
      })

      setScheduleResult(response.data)
      await loadData()
    } catch (error) {
      console.error('Failed to auto-schedule:', error)
      setScheduleResult({
        error: 'Scheduling failed. Make sure you have staff with availability set and shift templates created.'
      })
    } finally {
      setScheduling(false)
    }
  }

  const getAssignedStaff = (templateId, dayOfWeek) => {
    const filtered = assignments.filter(a =>
      a.shift_template_id === templateId && a.day_of_week === dayOfWeek
    )
    console.log(`DEBUG: getAssignedStaff for template ${templateId} on day ${dayOfWeek}:`, filtered.length, 'assignments')

    return filtered.map(a => {
      const staffMember = staff.find(s => s.id === a.staff_id)
      return {
        assignmentId: a.id,
        name: staffMember ? staffMember.name : 'Unknown'
      }
    })
  }

  const handleClearWeek = async () => {
    if (!window.confirm('Are you sure you want to clear all assignments for this week?')) {
      return
    }

    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')

    try {
      await clearWeekAssignments(weekStartStr)
      await loadData()
      setScheduleResult(null)
    } catch (error) {
      console.error('Failed to clear week:', error)
      alert('Failed to clear assignments')
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await deleteAssignment(assignmentId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  const handleAddAssignment = async (templateId, dayOfWeek) => {
    const key = `${templateId}-${dayOfWeek}`
    const staffId = selectedStaffForAssignment[key]

    if (!staffId) {
      alert('Please select a staff member')
      return
    }

    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })

    try {
      await createAssignment({
        staff_id: parseInt(staffId),
        shift_template_id: templateId,
        day_of_week: dayOfWeek,
        week_start_date: weekStart.toISOString()
      })

      // Clear the selection
      setSelectedStaffForAssignment(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })

      await loadData()
    } catch (error) {
      console.error('Failed to add assignment:', error)
      if (error.response?.data?.detail) {
        alert(`Error: ${error.response.data.detail}`)
      } else {
        alert('Failed to add assignment')
      }
    }
  }

  const handleStaffSelectionChange = (templateId, dayOfWeek, staffId) => {
    const key = `${templateId}-${dayOfWeek}`
    setSelectedStaffForAssignment(prev => ({
      ...prev,
      [key]: staffId
    }))
  }

  const changeWeek = (direction) => {
    setSelectedWeek(prev => addDays(prev, direction * 7))
    setScheduleResult(null)
  }

  const groupTemplatesByDay = () => {
    const grouped = {}
    DAYS.forEach((_, idx) => {
      grouped[idx] = shiftTemplates.filter(t => t.days_of_week && t.days_of_week.includes(idx))
    })
    return grouped
  }

  const templatesByDay = groupTemplatesByDay()
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })

  return (
    <div>
      <h1>Weekly Schedule</h1>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn btn-secondary" onClick={() => changeWeek(-1)}>
            Previous Week
          </button>
          <h2>
            Week of {format(weekStart, 'MMM dd, yyyy')}
          </h2>
          <button className="btn btn-secondary" onClick={() => changeWeek(1)}>
            Next Week
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            className="btn btn-success"
            onClick={handleAutoSchedule}
            disabled={scheduling}
            style={{ flex: 1 }}
          >
            {scheduling ? 'Scheduling...' : 'Auto-Schedule This Week'}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleClearWeek}
            disabled={scheduling}
          >
            Clear Week
          </button>
        </div>

        {scheduleResult && (
          <div className={scheduleResult.error ? 'alert alert-error' : 'alert alert-success'}>
            {scheduleResult.error ? (
              <div>
                <strong>Error:</strong> {scheduleResult.error}
              </div>
            ) : (
              <div>
                <strong>Scheduling Complete!</strong>
                <p>✓ Successful: {scheduleResult.successful?.length || 0} assignments</p>
                {scheduleResult.failed && scheduleResult.failed.length > 0 && (
                  <div>
                    <p>✗ Failed: {scheduleResult.failed.length} assignments</p>
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View failures</summary>
                      <ul style={{ marginTop: '10px' }}>
                        {scheduleResult.failed.map((f, idx) => (
                          <li key={idx}>{f.reason}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
                {scheduleResult.fairness_summary?.explanation && (
                  <p style={{ marginTop: '10px' }}><em>{scheduleResult.fairness_summary.explanation}</em></p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Schedule for Week</h2>
        {shiftTemplates.length === 0 ? (
          <div>
            <p>No shift templates configured yet.</p>
            <p>Go to the <strong>Shifts</strong> page to create weekly recurring shift templates.</p>
          </div>
        ) : (
          <div>
            {DAYS.map((day, dayIdx) => {
              const dayTemplates = templatesByDay[dayIdx]
              if (dayTemplates.length === 0) return null

              const dayDate = addDays(weekStart, dayIdx)

              return (
                <div key={dayIdx} style={{ marginBottom: '30px' }}>
                  <h3>{day}, {format(dayDate, 'MMM dd')}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Shift</th>
                        <th>Time</th>
                        <th>Required</th>
                        <th>Assigned Staff</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayTemplates.map(template => {
                        const assigned = getAssignedStaff(template.id, dayIdx)
                        const isFilled = assigned.length >= template.required_staff
                        const selectionKey = `${template.id}-${dayIdx}`

                        return (
                          <tr key={template.id}>
                            <td><strong>{template.name}</strong></td>
                            <td>{template.start_time} - {template.end_time}</td>
                            <td>{template.required_staff}</td>
                            <td>
                              {assigned.length === 0 ? (
                                <em style={{ color: '#999' }}>Not assigned</em>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {assigned.map(a => (
                                    <div key={a.assignmentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>{a.name}</span>
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteAssignment(a.assignmentId)}
                                        style={{ padding: '2px 8px', fontSize: '12px', marginLeft: '10px' }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '5px', marginTop: '10px', alignItems: 'center' }}>
                                <select
                                  value={selectedStaffForAssignment[selectionKey] || ''}
                                  onChange={(e) => handleStaffSelectionChange(template.id, dayIdx, e.target.value)}
                                  style={{ flex: 1, padding: '4px' }}
                                >
                                  <option value="">Select staff...</option>
                                  {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleAddAssignment(template.id, dayIdx)}
                                  style={{ padding: '4px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                                >
                                  Add Staff
                                </button>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                color: isFilled ? 'green' : (assigned.length > 0 ? 'orange' : 'red'),
                                fontWeight: 'bold'
                              }}>
                                {assigned.length}/{template.required_staff}
                                {isFilled && ' ✓'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {shiftTemplates.length > 0 && staff.length === 0 && (
        <div className="alert alert-info">
          <strong>Tip:</strong> You have shift templates but no staff yet. Go to the <strong>Staff</strong> page to add team members and set their availability!
        </div>
      )}
    </div>
  )
}

export default ScheduleView
