from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    qualifications = Column(JSON, default=list)  # List of qualification strings
    max_shifts_per_week = Column(Integer, default=5)  # Maximum shifts per week
    created_at = Column(DateTime, default=datetime.utcnow)

    availabilities = relationship("Availability", back_populates="staff", cascade="all, delete-orphan")
    preferences = relationship("Preference", back_populates="staff", cascade="all, delete-orphan")
    assignments = relationship("WeekAssignment", back_populates="staff", cascade="all, delete-orphan")
    fairness_metrics = relationship("FairnessMetric", back_populates="staff", cascade="all, delete-orphan")


class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    shift_template_id = Column(Integer, ForeignKey("shift_template.id"), nullable=True)
    is_available = Column(Boolean, default=True)

    staff = relationship("Staff", back_populates="availabilities")
    shift_template = relationship("ShiftTemplate")


class Preference(Base):
    __tablename__ = "preference"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    shift_template_id = Column(Integer, ForeignKey("shift_template.id"), nullable=True)
    preference_score = Column(Float, default=0.0)  # -1 (avoid) to 1 (prefer)

    staff = relationship("Staff", back_populates="preferences")
    shift_template = relationship("ShiftTemplate")


class ShiftTemplate(Base):
    """Weekly recurring shift template"""
    __tablename__ = "shift_template"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "Morning Shift", "Evening Shift"
    days_of_week = Column(JSON, nullable=False)  # [0,1,2,3,4] for Mon-Fri, etc.
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format
    required_staff = Column(Integer, default=1)
    required_qualifications = Column(JSON, default=dict)  # {"qualification": min_count}
    is_active = Column(Boolean, default=True)

    week_assignments = relationship("WeekAssignment", back_populates="shift_template", cascade="all, delete-orphan")


class WeekAssignment(Base):
    """Assignments for specific day/shift instances in a week"""
    __tablename__ = "week_assignment"

    id = Column(Integer, primary_key=True, index=True)
    shift_template_id = Column(Integer, ForeignKey("shift_template.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    week_start_date = Column(DateTime, nullable=False)  # Monday of the week
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday - specific day this assignment is for
    assigned_at = Column(DateTime, default=datetime.utcnow)

    shift_template = relationship("ShiftTemplate", back_populates="week_assignments")
    staff = relationship("Staff", back_populates="assignments")




class FairnessMetric(Base):
    __tablename__ = "fairness_metric"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    preference_fulfillment_score = Column(Float, default=0.0)  # Average of assigned shift preferences
    total_shifts = Column(Integer, default=0)
    preferred_shifts_count = Column(Integer, default=0)
    avoided_shifts_count = Column(Integer, default=0)

    staff = relationship("Staff", back_populates="fairness_metrics")
