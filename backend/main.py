from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models
import schemas
from database import engine, get_db
from scheduler import SchedulingEngine

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Shift Organizer API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Staff endpoints
@app.post("/api/staff/", response_model=schemas.Staff)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = models.Staff(**staff.dict())
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

@app.get("/api/staff/", response_model=List[schemas.Staff])
def get_all_staff(db: Session = Depends(get_db)):
    return db.query(models.Staff).all()

@app.get("/api/staff/{staff_id}", response_model=schemas.Staff)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@app.put("/api/staff/{staff_id}", response_model=schemas.Staff)
def update_staff(staff_id: int, staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    for key, value in staff.dict().items():
        setattr(db_staff, key, value)

    db.commit()
    db.refresh(db_staff)
    return db_staff

@app.delete("/api/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    db.delete(db_staff)
    db.commit()
    return {"message": "Staff deleted successfully"}

# Availability endpoints
@app.post("/api/availability/", response_model=schemas.Availability)
def create_availability(availability: schemas.AvailabilityCreate, db: Session = Depends(get_db)):
    # Delete existing availability for same staff/day/shift
    db.query(models.Availability).filter(
        models.Availability.staff_id == availability.staff_id,
        models.Availability.day_of_week == availability.day_of_week,
        models.Availability.shift_template_id == availability.shift_template_id
    ).delete()

    db_availability = models.Availability(**availability.dict())
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

@app.get("/api/availability/staff/{staff_id}", response_model=List[schemas.Availability])
def get_staff_availability(staff_id: int, db: Session = Depends(get_db)):
    return db.query(models.Availability).filter(models.Availability.staff_id == staff_id).all()

# Preference endpoints
@app.post("/api/preference/", response_model=schemas.Preference)
def create_preference(preference: schemas.PreferenceCreate, db: Session = Depends(get_db)):
    # Delete existing preference for same staff/day/shift
    db.query(models.Preference).filter(
        models.Preference.staff_id == preference.staff_id,
        models.Preference.day_of_week == preference.day_of_week,
        models.Preference.shift_template_id == preference.shift_template_id
    ).delete()

    db_preference = models.Preference(**preference.dict())
    db.add(db_preference)
    db.commit()
    db.refresh(db_preference)
    return db_preference

@app.get("/api/preference/staff/{staff_id}", response_model=List[schemas.Preference])
def get_staff_preferences(staff_id: int, db: Session = Depends(get_db)):
    return db.query(models.Preference).filter(models.Preference.staff_id == staff_id).all()

# Shift Template endpoints
@app.post("/api/shift-templates/", response_model=schemas.ShiftTemplate)
def create_shift_template(template: schemas.ShiftTemplateCreate, db: Session = Depends(get_db)):
    db_template = models.ShiftTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.get("/api/shift-templates/", response_model=List[schemas.ShiftTemplate])
def get_all_shift_templates(db: Session = Depends(get_db)):
    return db.query(models.ShiftTemplate).filter(models.ShiftTemplate.is_active == True).all()

@app.put("/api/shift-templates/{template_id}", response_model=schemas.ShiftTemplate)
def update_shift_template(template_id: int, template: schemas.ShiftTemplateCreate, db: Session = Depends(get_db)):
    db_template = db.query(models.ShiftTemplate).filter(models.ShiftTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Shift template not found")

    for key, value in template.dict().items():
        setattr(db_template, key, value)

    db.commit()
    db.refresh(db_template)
    return db_template

@app.delete("/api/shift-templates/{template_id}")
def delete_shift_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(models.ShiftTemplate).filter(models.ShiftTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Shift template not found")

    db_template.is_active = False
    db.commit()
    return {"message": "Shift template deactivated"}

# Week Assignment endpoints
@app.get("/api/assignments/week/{week_start}", response_model=List[schemas.WeekAssignment])
def get_week_assignments(week_start: str, db: Session = Depends(get_db)):
    """Get all assignments for a specific week (pass date as YYYY-MM-DD)"""
    week_date = datetime.fromisoformat(week_start)

    # Get all assignments and filter in Python to avoid timezone issues
    all_assignments = db.query(models.WeekAssignment).all()

    print(f"DEBUG: Looking for week {week_date.date()}")
    print(f"DEBUG: Total assignments in DB: {len(all_assignments)}")

    # Filter by comparing just the date part
    assignments = [
        a for a in all_assignments
        if a.week_start_date.date() == week_date.date()
    ]

    print(f"DEBUG: Found {len(assignments)} assignments matching this week")
    for a in assignments[:3]:
        print(f"  - Assignment: template_id={a.shift_template_id}, staff_id={a.staff_id}, date={a.week_start_date}")

    return assignments

@app.get("/api/assignments/", response_model=List[schemas.WeekAssignment])
def get_all_assignments(db: Session = Depends(get_db)):
    return db.query(models.WeekAssignment).all()

@app.post("/api/assignments/", response_model=schemas.WeekAssignment)
def create_assignment(assignment: schemas.WeekAssignmentCreate, db: Session = Depends(get_db)):
    """Manually create an assignment (allows overbooking)"""
    # Verify staff exists
    staff = db.query(models.Staff).filter(models.Staff.id == assignment.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    # Verify shift template exists
    template = db.query(models.ShiftTemplate).filter(models.ShiftTemplate.id == assignment.shift_template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Shift template not found")

    # Verify day_of_week is in template's days
    if assignment.day_of_week not in template.days_of_week:
        raise HTTPException(status_code=400, detail=f"Day {assignment.day_of_week} is not in this shift template's days")

    # Check for duplicate assignment (same staff, template, day, week)
    from sqlalchemy import cast, Date
    week_date_only = assignment.week_start_date.date()
    existing = db.query(models.WeekAssignment).filter(
        models.WeekAssignment.staff_id == assignment.staff_id,
        models.WeekAssignment.shift_template_id == assignment.shift_template_id,
        models.WeekAssignment.day_of_week == assignment.day_of_week,
        cast(models.WeekAssignment.week_start_date, Date) == week_date_only
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="This staff member is already assigned to this shift on this day")

    # Create assignment (no constraint checking - allows manual overbooking)
    db_assignment = models.WeekAssignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.delete("/api/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(models.WeekAssignment).filter(models.WeekAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted"}

@app.delete("/api/assignments/week/{week_start}")
def delete_week_assignments(week_start: str, db: Session = Depends(get_db)):
    """Delete all assignments for a specific week"""
    week_date = datetime.fromisoformat(week_start)

    # Get all assignments and filter by date
    all_assignments = db.query(models.WeekAssignment).all()
    assignments_to_delete = [
        a for a in all_assignments
        if a.week_start_date.date() == week_date.date()
    ]

    for assignment in assignments_to_delete:
        db.delete(assignment)

    db.commit()

    print(f"DEBUG: Deleted {len(assignments_to_delete)} assignments for week {week_date.date()}")

    return {"message": f"Deleted {len(assignments_to_delete)} assignments"}

# Fairness metrics endpoint
@app.get("/api/fairness/staff/{staff_id}")
def get_staff_fairness(
    staff_id: int,
    period_days: int = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    engine = SchedulingEngine(db)
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    # Parse dates if provided
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    return engine.calculate_fairness_score(staff, period_days, start_dt, end_dt)

@app.get("/api/fairness/all")
def get_all_fairness(
    period_days: int = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    engine = SchedulingEngine(db)
    all_staff = db.query(models.Staff).all()

    # Parse dates if provided
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    return [
        {
            "staff_id": staff.id,
            "staff_name": staff.name,
            "metrics": engine.calculate_fairness_score(staff, period_days, start_dt, end_dt)
        }
        for staff in all_staff
    ]

# Scheduling endpoint
@app.post("/api/schedule/auto")
def auto_schedule(request: schemas.ScheduleRequest, db: Session = Depends(get_db)):
    """Trigger AI-powered automatic scheduling for a specific week."""
    engine = SchedulingEngine(db)

    # Clear existing assignments if requested
    if request.clear_existing:
        db.query(models.WeekAssignment).filter(
            models.WeekAssignment.week_start_date == request.week_start_date
        ).delete()
        db.commit()

    result = engine.auto_schedule(request.week_start_date)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
