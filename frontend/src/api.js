import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Staff
export const getStaff = () => api.get('/staff/')
export const createStaff = (data) => api.post('/staff/', data)
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data)
export const deleteStaff = (id) => api.delete(`/staff/${id}`)

// Availability
export const createAvailability = (data) => api.post('/availability/', data)
export const getStaffAvailability = (staffId) => api.get(`/availability/staff/${staffId}`)

// Preferences
export const createPreference = (data) => api.post('/preference/', data)
export const getStaffPreferences = (staffId) => api.get(`/preference/staff/${staffId}`)

// Shift Templates
export const getShiftTemplates = () => api.get('/shift-templates/')
export const createShiftTemplate = (data) => api.post('/shift-templates/', data)
export const updateShiftTemplate = (id, data) => api.put(`/shift-templates/${id}`, data)
export const deleteShiftTemplate = (id) => api.delete(`/shift-templates/${id}`)

// Assignments
export const getAssignments = () => api.get('/assignments/')
export const getWeekAssignments = (weekStart) => api.get(`/assignments/week/${weekStart}`)
export const createAssignment = (data) => api.post('/assignments/', data)
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`)
export const clearWeekAssignments = (weekStart) => api.delete(`/assignments/week/${weekStart}`)

// Fairness
export const getAllFairness = (params = {}) => api.get('/fairness/all', { params })
export const getStaffFairness = (staffId, params = {}) => api.get(`/fairness/staff/${staffId}`, { params })

// Scheduling
export const autoSchedule = (data) => api.post('/schedule/auto', data)

export default api
