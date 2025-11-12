import React, { useState, useEffect } from 'react'
import { getAllFairness } from '../api'
import { format, subWeeks, addWeeks, startOfDay } from 'date-fns'

function FairnessDashboard() {
  const [fairnessData, setFairnessData] = useState([])
  const [loading, setLoading] = useState(true)

  // Control modes: 'preset' or 'custom'
  const [mode, setMode] = useState('preset')

  // Preset mode: separate controls for past and future
  const [pastWeeks, setPastWeeks] = useState(4)
  const [futureWeeks, setFutureWeeks] = useState(4)

  // Custom mode: specific date range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadFairness()
  }, [mode, pastWeeks, futureWeeks, startDate, endDate])

  const loadFairness = async () => {
    setLoading(true)
    try {
      let params = {}

      if (mode === 'preset') {
        // Use bidirectional period: max of past and future weeks
        const maxWeeks = Math.max(pastWeeks, futureWeeks)
        params.period_days = maxWeeks * 7
      } else if (mode === 'custom' && startDate && endDate) {
        // Use custom date range
        params.start_date = startDate
        params.end_date = endDate
      } else {
        // Default to ±4 weeks
        params.period_days = 28
      }

      const response = await getAllFairness(params)
      setFairnessData(response.data)
    } catch (error) {
      console.error('Failed to load fairness data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score > 0.3) return 'green'
    if (score < -0.3) return 'red'
    return 'orange'
  }

  const getScoreLabel = (score) => {
    if (score > 0.5) return 'Very Positive'
    if (score > 0.2) return 'Positive'
    if (score > -0.2) return 'Neutral'
    if (score > -0.5) return 'Negative'
    return 'Very Negative'
  }

  const handlePresetChange = (type, value) => {
    if (type === 'past') {
      setPastWeeks(parseInt(value))
    } else {
      setFutureWeeks(parseInt(value))
    }
  }

  const setQuickPreset = (preset) => {
    switch (preset) {
      case 'past_only':
        setPastWeeks(8)
        setFutureWeeks(0)
        break
      case 'future_only':
        setPastWeeks(0)
        setFutureWeeks(8)
        break
      case 'balanced':
        setPastWeeks(4)
        setFutureWeeks(4)
        break
      case 'wide':
        setPastWeeks(12)
        setFutureWeeks(12)
        break
    }
  }

  if (loading) {
    return <div>Loading fairness data...</div>
  }

  return (
    <div>
      <h1>Fairness Dashboard</h1>

      <div className="card">
        <h3>Analysis Window</h3>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="preset">Preset (Past/Future Weeks)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {mode === 'preset' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label>Past Weeks</label>
                <select value={pastWeeks} onChange={(e) => handlePresetChange('past', e.target.value)}>
                  <option value="0">None</option>
                  <option value="1">1 week</option>
                  <option value="2">2 weeks</option>
                  <option value="4">4 weeks</option>
                  <option value="8">8 weeks</option>
                  <option value="12">12 weeks</option>
                </select>
              </div>

              <div className="form-group">
                <label>Future Weeks</label>
                <select value={futureWeeks} onChange={(e) => handlePresetChange('future', e.target.value)}>
                  <option value="0">None</option>
                  <option value="1">1 week</option>
                  <option value="2">2 weeks</option>
                  <option value="4">4 weeks</option>
                  <option value="8">8 weeks</option>
                  <option value="12">12 weeks</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setQuickPreset('past_only')}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                Past Only (8w)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setQuickPreset('future_only')}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                Future Only (8w)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setQuickPreset('balanced')}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                Balanced (±4w)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setQuickPreset('wide')}
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                Wide View (±12w)
              </button>
            </div>

            <p style={{ color: '#666', fontSize: '14px', marginTop: '15px' }}>
              Currently analyzing: <strong>{pastWeeks} weeks past</strong> and <strong>{futureWeeks} weeks future</strong>
              {' '}({pastWeeks + futureWeeks} weeks total)
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <p style={{ color: '#666', fontSize: '14px', marginTop: '15px' }}>
          This dashboard shows how fairly shifts are distributed among staff based on their preferences,
          looking at both <strong>past worked shifts</strong> and <strong>future scheduled weeks</strong>.
          A positive score means staff are getting shifts they prefer. A negative score means they're
          getting shifts they want to avoid.
        </p>
      </div>

      {fairnessData.length === 0 ? (
        <div className="card">
          <p>No data available. Create some shifts and assignments to see fairness metrics.</p>
        </div>
      ) : (
        <div className="card">
          <h2>Staff Fairness Metrics</h2>
          <table>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Total Shifts</th>
                <th>Preferred Shifts</th>
                <th>Avoided Shifts</th>
                <th>Preference Score</th>
                <th>Assessment</th>
              </tr>
            </thead>
            <tbody>
              {fairnessData
                .sort((a, b) => a.metrics.preference_fulfillment - b.metrics.preference_fulfillment)
                .map((data) => (
                  <tr key={data.staff_id}>
                    <td><strong>{data.staff_name}</strong></td>
                    <td>{data.metrics.total_shifts}</td>
                    <td>{data.metrics.preferred_count}</td>
                    <td>{data.metrics.avoided_count}</td>
                    <td style={{
                      color: getScoreColor(data.metrics.preference_fulfillment),
                      fontWeight: 'bold'
                    }}>
                      {data.metrics.preference_fulfillment.toFixed(2)}
                    </td>
                    <td style={{ color: getScoreColor(data.metrics.preference_fulfillment) }}>
                      {getScoreLabel(data.metrics.preference_fulfillment)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Fairness Summary</h3>
            <div className="grid grid-3" style={{ marginTop: '10px' }}>
              <div>
                <strong>Average Score:</strong>
                <div style={{ fontSize: '24px', marginTop: '5px' }}>
                  {(fairnessData.reduce((sum, d) => sum + d.metrics.preference_fulfillment, 0) / fairnessData.length).toFixed(2)}
                </div>
              </div>
              <div>
                <strong>Most Favorable:</strong>
                <div style={{ fontSize: '18px', marginTop: '5px', color: 'green' }}>
                  {fairnessData.reduce((max, d) =>
                    d.metrics.preference_fulfillment > max.metrics.preference_fulfillment ? d : max
                  ).staff_name}
                </div>
              </div>
              <div>
                <strong>Needs Priority:</strong>
                <div style={{ fontSize: '18px', marginTop: '5px', color: 'red' }}>
                  {fairnessData.reduce((min, d) =>
                    d.metrics.preference_fulfillment < min.metrics.preference_fulfillment ? d : min
                  ).staff_name}
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: '20px' }}>
            <strong>How to interpret scores:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li><strong>1.0:</strong> All assigned shifts were highly preferred</li>
              <li><strong>0.5:</strong> Most shifts matched preferences</li>
              <li><strong>0.0:</strong> Neutral - shifts neither preferred nor avoided</li>
              <li><strong>-0.5:</strong> Most shifts were not preferred</li>
              <li><strong>-1.0:</strong> All assigned shifts were ones to avoid</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default FairnessDashboard
