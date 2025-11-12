import React, { useState, useEffect } from 'react'
import { getStaff, createStaff, updateStaff, deleteStaff, createAvailability, createPreference, getStaffAvailability, getStaffPreferences, getShiftTemplates } from '../api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [shiftTemplates, setShiftTemplates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    qualifications: '',
    max_shifts_per_week: 5
  })
  const [availability, setAvailability] = useState([])
  const [preferences, setPreferences] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [staffResp, templatesResp] = await Promise.all([
        getStaff(),
        getShiftTemplates()
      ])
      setStaff(staffResp.data)
      setShiftTemplates(templatesResp.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(q => q),
      max_shifts_per_week: parseInt(formData.max_shifts_per_week)
    }

    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, data)
      } else {
        await createStaff(data)
      }
      loadData()
      resetForm()
    } catch (error) {
      console.error('Failed to save staff:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete staff:', error)
      }
    }
  }

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      qualifications: staffMember.qualifications.join(', '),
      max_shifts_per_week: staffMember.max_shifts_per_week
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ name: '', qualifications: '', max_shifts_per_week: 5 })
    setEditingStaff(null)
    setShowForm(false)
  }

  const viewDetails = async (staffMember) => {
    setSelectedStaff(staffMember)
    try {
      const [availResp, prefResp] = await Promise.all([
        getStaffAvailability(staffMember.id),
        getStaffPreferences(staffMember.id)
      ])
      setAvailability(availResp.data)
      setPreferences(prefResp.data)
    } catch (error) {
      console.error('Failed to load staff details:', error)
    }
  }

  const handleAvailabilityChange = async (day, shiftTemplateId, isAvailable) => {
    try {
      await createAvailability({
        staff_id: selectedStaff.id,
        day_of_week: day,
        shift_template_id: shiftTemplateId,
        is_available: isAvailable
      })
      const response = await getStaffAvailability(selectedStaff.id)
      setAvailability(response.data)
    } catch (error) {
      console.error('Failed to update availability:', error)
    }
  }

  const handlePreferenceChange = async (day, shiftTemplateId, score) => {
    try {
      await createPreference({
        staff_id: selectedStaff.id,
        day_of_week: day,
        shift_template_id: shiftTemplateId,
        preference_score: parseFloat(score)
      })
      const response = await getStaffPreferences(selectedStaff.id)
      setPreferences(response.data)
    } catch (error) {
      console.error('Failed to update preference:', error)
    }
  }

  const getAvailabilityStatus = (day, shiftTemplateId) => {
    const avail = availability.find(a => a.day_of_week === day && a.shift_template_id === shiftTemplateId)
    return avail ? avail.is_available : true
  }

  const getPreferenceScore = (day, shiftTemplateId) => {
    const pref = preferences.find(p => p.day_of_week === day && p.shift_template_id === shiftTemplateId)
    return pref ? pref.preference_score : 0
  }

  const getShiftTemplatesForDay = (day) => {
    return shiftTemplates.filter(t => t.days_of_week && t.days_of_week.includes(day))
  }

  return (
    <div>
      <h1>Staff Management</h1>

      <div className="card">
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Staff'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Qualifications (comma-separated)</label>
              <input
                type="text"
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                placeholder="e.g., Manager, First Aid, Driver"
              />
            </div>
            <div className="form-group">
              <label>Maximum Shifts Per Week</label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.max_shifts_per_week}
                onChange={(e) => setFormData({ ...formData, max_shifts_per_week: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              {editingStaff ? 'Update' : 'Create'}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h2>Staff List</h2>
        {staff.length === 0 ? (
          <p>No staff members yet. Add one to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Qualifications</th>
                <th>Max Shifts/Week</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.qualifications.join(', ') || 'None'}</td>
                  <td>{s.max_shifts_per_week}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => viewDetails(s)}
                      style={{ marginRight: '5px' }}
                    >
                      Availability
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(s)}
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedStaff && (
        <div className="card">
          <h2>Weekly Availability & Preferences for {selectedStaff.name}</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Set which shifts this person is available for each week, and their preferences.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedStaff(null)}
            style={{ marginBottom: '20px' }}
          >
            Close
          </button>

          {shiftTemplates.length === 0 ? (
            <p>No shift templates configured. Go to Shifts page to create some first!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Shift</th>
                  <th>Time</th>
                  <th>Available</th>
                  <th>Preference (-1 to 1)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIndex) => {
                  const dayTemplates = getShiftTemplatesForDay(dayIndex)
                  if (dayTemplates.length === 0) return null

                  return dayTemplates.map((template) => (
                    <tr key={`${dayIndex}-${template.id}`}>
                      <td>{day}</td>
                      <td>{template.name}</td>
                      <td>{template.start_time} - {template.end_time}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={getAvailabilityStatus(dayIndex, template.id)}
                          onChange={(e) =>
                            handleAvailabilityChange(dayIndex, template.id, e.target.checked)
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={getPreferenceScore(dayIndex, template.id)}
                          onChange={(e) =>
                            handlePreferenceChange(dayIndex, template.id, e.target.value)
                          }
                        >
                          <option value="-1">Avoid (-1)</option>
                          <option value="-0.5">Dislike (-0.5)</option>
                          <option value="0">Neutral (0)</option>
                          <option value="0.5">Like (0.5)</option>
                          <option value="1">Prefer (1)</option>
                        </select>
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default StaffManagement
