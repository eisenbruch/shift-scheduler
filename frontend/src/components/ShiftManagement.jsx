import React, { useState, useEffect } from 'react'
import { getShiftTemplates, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate, getStaff } from '../api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function ShiftManagement() {
  const [templates, setTemplates] = useState([])
  const [staff, setStaff] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    days_of_week: [],
    start_time: '09:00',
    end_time: '17:00',
    required_staff: 1,
    qualifications: {}
  })
  const [qualificationInput, setQualificationInput] = useState({ name: '', count: 1 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [templatesResp, staffResp] = await Promise.all([
        getShiftTemplates(),
        getStaff()
      ])
      setTemplates(templatesResp.data)
      setStaff(staffResp.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.days_of_week.length === 0) {
      alert('Please select at least one day of the week')
      return
    }

    const data = {
      name: formData.name,
      days_of_week: formData.days_of_week.map(d => parseInt(d)),
      start_time: formData.start_time,
      end_time: formData.end_time,
      required_staff: parseInt(formData.required_staff),
      required_qualifications: formData.qualifications,
      is_active: true
    }

    try {
      if (editingTemplate) {
        await updateShiftTemplate(editingTemplate.id, data)
      } else {
        await createShiftTemplate(data)
      }
      loadData()
      resetForm()
    } catch (error) {
      console.error('Failed to save shift template:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shift template?')) {
      try {
        await deleteShiftTemplate(id)
        loadData()
      } catch (error) {
        console.error('Failed to delete shift template:', error)
      }
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      days_of_week: template.days_of_week || [],
      start_time: template.start_time,
      end_time: template.end_time,
      required_staff: template.required_staff,
      qualifications: template.required_qualifications || {}
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      days_of_week: [],
      start_time: '09:00',
      end_time: '17:00',
      required_staff: 1,
      qualifications: {}
    })
    setEditingTemplate(null)
    setShowForm(false)
  }

  const toggleDay = (dayIndex) => {
    const days = [...formData.days_of_week]
    if (days.includes(dayIndex)) {
      setFormData({ ...formData, days_of_week: days.filter(d => d !== dayIndex) })
    } else {
      setFormData({ ...formData, days_of_week: [...days, dayIndex].sort() })
    }
  }

  const addQualification = () => {
    if (qualificationInput.name) {
      setFormData({
        ...formData,
        qualifications: {
          ...formData.qualifications,
          [qualificationInput.name]: parseInt(qualificationInput.count)
        }
      })
      setQualificationInput({ name: '', count: 1 })
    }
  }

  const removeQualification = (qual) => {
    const newQuals = { ...formData.qualifications }
    delete newQuals[qual]
    setFormData({ ...formData, qualifications: newQuals })
  }

  const getAllQualifications = () => {
    const quals = new Set()
    staff.forEach(s => {
      s.qualifications.forEach(q => quals.add(q))
    })
    return Array.from(quals)
  }

  const getDaysString = (daysArray) => {
    if (!daysArray || daysArray.length === 0) return 'No days'
    if (daysArray.length === 7) return 'Every day'
    if (daysArray.length === 5 && daysArray.every(d => d >= 0 && d <= 4)) return 'Weekdays (Mon-Fri)'
    if (daysArray.length === 2 && daysArray.includes(5) && daysArray.includes(6)) return 'Weekends'
    return daysArray.map(d => DAYS[d]).join(', ')
  }

  return (
    <div>
      <h1>Shift Templates</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Create recurring weekly shift templates. These shifts will repeat every week and can be assigned to staff.
      </p>

      <div className="card">
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Create Shift Template'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Shift Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Shift, Evening Shift"
                required
              />
            </div>

            <div className="form-group">
              <label>Days of Week (select one or more)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                {DAYS.map((day, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.days_of_week.includes(idx)}
                      onChange={() => toggleDay(idx)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Required Staff Count</label>
              <input
                type="number"
                min="1"
                value={formData.required_staff}
                onChange={(e) => setFormData({ ...formData, required_staff: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Required Qualifications</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                  value={qualificationInput.name}
                  onChange={(e) => setQualificationInput({ ...qualificationInput, name: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Select qualification...</option>
                  {getAllQualifications().map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={qualificationInput.count}
                  onChange={(e) => setQualificationInput({ ...qualificationInput, count: e.target.value })}
                  placeholder="Count"
                  style={{ width: '100px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addQualification}
                >
                  Add
                </button>
              </div>

              {Object.keys(formData.qualifications).length > 0 && (
                <div>
                  {Object.entries(formData.qualifications).map(([qual, count]) => (
                    <div key={qual} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#f0f0f0', marginBottom: '5px', borderRadius: '4px' }}>
                      <span>{qual}: {count} required</span>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeQualification(qual)}
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-success">
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h2>Shift Templates</h2>
        {templates.length === 0 ? (
          <p>No shift templates yet. Create one to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Days</th>
                <th>Time</th>
                <th>Required Staff</th>
                <th>Qualifications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td><strong>{template.name}</strong></td>
                  <td>{getDaysString(template.days_of_week)}</td>
                  <td>{template.start_time} - {template.end_time}</td>
                  <td>{template.required_staff}</td>
                  <td>
                    {Object.keys(template.required_qualifications).length === 0
                      ? 'None'
                      : Object.entries(template.required_qualifications)
                          .map(([q, c]) => `${q} (${c})`)
                          .join(', ')}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(template)}
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(template.id)}
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
    </div>
  )
}

export default ShiftManagement
