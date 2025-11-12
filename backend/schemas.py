from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

# Staff schemas
class StaffBase(BaseModel):
    name: str
    qualifications: List[str] = []
    max_shifts_per_week: int = 5

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Availability schemas
class AvailabilityBase(BaseModel):
    day_of_week: int
    shift_template_id: Optional[int] = None
    is_available: bool = True

class AvailabilityCreate(AvailabilityBase):
    staff_id: int

class Availability(AvailabilityBase):
    id: int
    staff_id: int

    class Config:
        from_attributes = True

# Preference schemas
class PreferenceBase(BaseModel):
    day_of_week: int
    shift_template_id: Optional[int] = None
    preference_score: float

class PreferenceCreate(PreferenceBase):
    staff_id: int

class Preference(PreferenceBase):
    id: int
    staff_id: int

    class Config:
        from_attributes = True

# Shift Template schemas
class ShiftTemplateBase(BaseModel):
    name: str
    days_of_week: List[int]  # [0,1,2,3,4] for Mon-Fri
    start_time: str
    end_time: str
    required_staff: int = 1
    required_qualifications: Dict[str, int] = {}
    is_active: bool = True

class ShiftTemplateCreate(ShiftTemplateBase):
    pass

class ShiftTemplate(ShiftTemplateBase):
    id: int

    class Config:
        from_attributes = True

# Week Assignment schemas
class WeekAssignmentBase(BaseModel):
    shift_template_id: int
    staff_id: int
    week_start_date: datetime
    day_of_week: int  # 0=Monday, 6=Sunday

class WeekAssignmentCreate(WeekAssignmentBase):
    pass

class WeekAssignment(WeekAssignmentBase):
    id: int
    assigned_at: datetime

    class Config:
        from_attributes = True

# Fairness metric schemas
class FairnessMetric(BaseModel):
    id: int
    staff_id: int
    period_start: datetime
    period_end: datetime
    preference_fulfillment_score: float
    total_shifts: int
    preferred_shifts_count: int
    avoided_shifts_count: int

    class Config:
        from_attributes = True

# Scheduling request
class ScheduleRequest(BaseModel):
    week_start_date: datetime
    clear_existing: bool = False
