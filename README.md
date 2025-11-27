# Shift Scheduler - INCOMPLETE

Automatic shift scheduling local application with algorithmic optimization for fair and efficient staff scheduling.

## Features

- **Staff Management**: Add staff with qualifications, per-day availabilities and preferences
- **Shift Template Management**: Create weekly recurring shift templates spanning multiple days
- **Algorithmic Scheduling**: Deterministic shift assignment with:
  - Hard constraint satisfaction (availability, qualifications, max shifts per week)
  - Workload balancing across all scheduled weeks (not just current week)
  - Preference optimization (when workload is balanced)
  - Historical fairness tracking (bidirectional ±30 day window)
  - Double shift avoidance (only assigns when necessary)
- **Per-Day Assignments**: Staff can work specific days of multi-day templates based on availability
- **Fairness Dashboard**: Track preference fulfillment scores across past and future scheduled weeks
- **Manual Override**: Clear weeks, remove individual assignments, reschedule as needed

## Tech Stack

- **Backend**: Python + FastAPI + SQLAlchemy + SQLite
- **Frontend**: React (Vite) + date-fns
- **Algorithm**: Custom greedy algorithm with priority scoring

## Prerequisites

- Python 3.8+
- Node.js 16+

## Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:
```bash
python main.py
```

Optional: Create a `.env` file for custom database location:
```
DATABASE_URL=sqlite:///./shift_organizer.db
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Database Seeding (Optional)

To populate the database with test data:

```bash
cd backend
python seed_data.py
```

This creates:
- 3 staff members (Fredo, Employee 2, Employee 3)
- 2 shift templates (Morning 9-2, Afternoon 2-7) covering all 7 days
- Sample availability restrictions and preferences
- Each shift requires 2 staff per day (28 total slots per week)

To reset the database:
```bash
cd backend
rm shift_organizer.db
python seed_data.py
```

## Usage Guide

### Getting Started

1. **Create Shift Templates** (Shift Management page)
   - Click "Create New Shift Template"
   - Enter name, start time, and end time
   - Select which days of the week this shift recurs (checkboxes for Mon-Sun)
   - Specify how many staff are required per shift
   - Add any required qualifications (optional)

2. **Add Staff** (Staff page)
   - Click "Add New Staff"
   - Enter name and qualifications (comma-separated)
   - Click on "Details" to set availability and preferences for each day/shift
   - Preferences range from -1 (avoid) to 1 (prefer)

3. **Auto-Schedule** (Schedule page)
   - Navigate to the week you want to schedule
   - Click "Auto-Schedule This Week"
   - Algorithm assigns staff to shifts by:
     - Filling hardest-to-staff shifts first
     - Balancing total workload across ALL scheduled weeks (not just current week)
     - Avoiding double shifts unless necessary
     - Respecting availability, qualifications, and max shifts per week
     - Optimizing preference fulfillment when workload is balanced
   - You can manually remove assignments or clear entire weeks and reschedule

4. **Monitor Fairness** (Fairness page)
   - View preference fulfillment scores for all staff
   - Adjust analysis window (±1 to ±12 weeks from today)
   - See both past worked shifts and future scheduled weeks
   - Track who's getting preferred vs avoided shifts

### How the Algorithm Works

**Priority Scoring (lower = more likely to be assigned):**
1. **Double shift penalty**: +100 (strongly avoid same person working multiple shifts per day)
2. **Workload balance**: +10 per shift across entire scheduling window (±30 days)
3. **Preference bonus**: -5 × preference score (prefer staff who like the shift)
4. **Historical fairness**: -3 × fairness score (prioritize those with lower historical preference fulfillment)

**Example:** Someone with 15 total shifts across all weeks will get a +150 workload penalty. Someone with 10 total shifts gets +100. The 50-point difference makes the less-loaded person much more likely to be assigned, even if they slightly dislike the shift.

**Result:** Workload stays balanced across all staff over multiple weeks, while still considering individual preferences when workload is equal.

## Architecture

```
backend/
├── main.py           # FastAPI app with all endpoints
├── models.py         # SQLAlchemy database models
├── schemas.py        # Pydantic schemas for API
├── database.py       # Database configuration
├── scheduler.py      # Scheduling engine with algorithmic optimization
├── seed_data.py      # Database seeding script (optional)
└── requirements.txt

frontend/
├── src/
│   ├── components/
│   │   ├── StaffManagement.jsx
│   │   ├── ShiftManagement.jsx
│   │   ├── ScheduleView.jsx
│   │   └── FairnessDashboard.jsx
│   ├── App.jsx
│   ├── api.js        # API client
│   └── main.jsx
└── package.json
```

## Database Schema

- **staff**: Staff members with qualifications and max_shifts_per_week
- **availability**: Per-day availability for specific shift templates (only stores unavailable days)
- **preference**: Preference scores (-1 to 1) for day/shift combinations
- **shift_template**: Weekly recurring shift templates spanning multiple days
- **week_assignment**: Staff assigned to specific shifts on specific days for specific weeks
  - Includes `day_of_week` field (0-6) for per-day granularity

## Key API Endpoints

- `GET/POST /api/staff/` - Staff CRUD
- `GET/POST /api/availability/` - Per-day availability management
- `GET/POST /api/preference/` - Preference management
- `GET/POST /api/shift-templates/` - Shift template management
- `GET /api/assignments/week/{week_start}` - View assignments for a specific week
- `DELETE /api/assignments/week/{week_start}` - Clear entire week
- `DELETE /api/assignments/{id}` - Remove single assignment
- `GET /api/fairness/all?period_days=30` - Get fairness metrics with configurable window
- `POST /api/schedule/auto` - Trigger algorithmic scheduling

## Troubleshooting

**Backend won't start**: Ensure Python 3.8+ is installed and virtual environment is activated

**Frontend build errors**: Delete `node_modules` and run `npm install` again

**Scheduling creates too few assignments**:
- Check staff availability settings - unavailable days prevent assignment
- Verify max_shifts_per_week isn't too restrictive
- Ensure enough staff exist to cover all shift requirements

**Scheduling seems unbalanced**:
- Clear all weeks and reschedule from scratch
- The algorithm balances across a 60-day window - check the Fairness dashboard
- Staff with availability restrictions will naturally get fewer total shifts

**Database errors**: Delete `shift_organizer.db` to reset (will lose all data). Or run `python seed_data.py` to create fresh test data (3 staff, 2 shift templates covering all 7 days).
