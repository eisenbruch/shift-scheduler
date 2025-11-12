"""Seed database with test data"""
from datetime import datetime
from database import SessionLocal, engine
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Create staff
    staff1 = models.Staff(
        name="Fredo",
        qualifications=[],
        max_shifts_per_week=5
    )
    staff2 = models.Staff(
        name="Employee 2",
        qualifications=[],
        max_shifts_per_week=5
    )
    staff3 = models.Staff(
        name="Employee 3",
        qualifications=[],
        max_shifts_per_week=5
    )

    db.add_all([staff1, staff2, staff3])
    db.commit()
    db.refresh(staff1)
    db.refresh(staff2)
    db.refresh(staff3)

    print(f"Created staff: Fredo (id={staff1.id}), Employee 2 (id={staff2.id}), Employee 3 (id={staff3.id})")

    # Create shift templates
    morning = models.ShiftTemplate(
        name="Morning",
        days_of_week=[0, 1, 2, 3, 4, 5, 6],  # All 7 days
        start_time="09:00",
        end_time="14:00",
        required_staff=2,
        required_qualifications={},
        is_active=True
    )

    afternoon = models.ShiftTemplate(
        name="Afternoon",
        days_of_week=[0, 1, 2, 3, 4, 5, 6],  # All 7 days
        start_time="14:00",
        end_time="19:00",
        required_staff=2,
        required_qualifications={},
        is_active=True
    )

    db.add_all([morning, afternoon])
    db.commit()
    db.refresh(morning)
    db.refresh(afternoon)

    print(f"Created shift templates: Morning (id={morning.id}), Afternoon (id={afternoon.id})")

    # Set availabilities (only marking unavailable days)
    # Fredo: unavailable on Wednesday (2) and Saturday (5) for both shifts
    avail1 = models.Availability(staff_id=staff1.id, day_of_week=2, shift_template_id=morning.id, is_available=False)
    avail2 = models.Availability(staff_id=staff1.id, day_of_week=2, shift_template_id=afternoon.id, is_available=False)
    avail3 = models.Availability(staff_id=staff1.id, day_of_week=5, shift_template_id=morning.id, is_available=False)
    avail4 = models.Availability(staff_id=staff1.id, day_of_week=5, shift_template_id=afternoon.id, is_available=False)

    # Employee 2: unavailable on Friday (4) and Sunday (6) for both shifts
    avail5 = models.Availability(staff_id=staff2.id, day_of_week=4, shift_template_id=morning.id, is_available=False)
    avail6 = models.Availability(staff_id=staff2.id, day_of_week=4, shift_template_id=afternoon.id, is_available=False)
    avail7 = models.Availability(staff_id=staff2.id, day_of_week=6, shift_template_id=morning.id, is_available=False)
    avail8 = models.Availability(staff_id=staff2.id, day_of_week=6, shift_template_id=afternoon.id, is_available=False)

    # Employee 3: No availability restrictions (available all days)

    db.add_all([avail1, avail2, avail3, avail4, avail5, avail6, avail7, avail8])
    db.commit()

    print("Created availabilities:")
    print("  - Fredo: unavailable Wed & Sat")
    print("  - Employee 2: unavailable Fri & Sun")
    print("  - Employee 3: available all days")

    # Set preferences
    # Fredo preferences
    pref1 = models.Preference(staff_id=staff1.id, day_of_week=0, shift_template_id=afternoon.id, preference_score=0.5)
    pref2 = models.Preference(staff_id=staff1.id, day_of_week=3, shift_template_id=afternoon.id, preference_score=-0.5)
    pref3 = models.Preference(staff_id=staff1.id, day_of_week=6, shift_template_id=morning.id, preference_score=0.5)

    db.add_all([pref1, pref2, pref3])
    db.commit()

    print("Created preferences:")
    print("  - Fredo: prefers Monday Afternoon (+0.5), avoids Thursday Afternoon (-0.5), prefers Sunday Morning (+0.5)")
    print("  - Employee 2: no preferences")
    print("  - Employee 3: no preferences")

    print("\n✓ Database seeded successfully!")
    print("\nSummary:")
    print("- 3 staff members")
    print("- 2 shift templates (Morning 9-2, Afternoon 2-7) covering all 7 days")
    print("- Each shift needs 2 staff per day")
    print("- Total slots to fill: 28 (2 shifts × 7 days × 2 staff)")

except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
    raise
finally:
    db.close()
