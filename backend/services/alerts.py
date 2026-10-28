
from datetime import date, timedelta
from services.recurrence import parse_day

ACTIVE_STATUSES = {"Open", "In Progress", "Pending"}


def generate_alerts(Complaint, due_soon_days=3, inactive_days=7):
    today = date.today()
    alerts = []

    complaints = Complaint.query.all()

    for complaint in complaints:

        # Ignore resolved or closed complaints.
        if complaint.status not in ACTIVE_STATUSES:
            continue

        due_date = parse_day(complaint.due)
        updated_date = parse_day(complaint.updated)
        received_date = parse_day(complaint.received)

        # Common information included in every alert.
        base = {
            "complaintId": complaint.id,
            "title": complaint.title,
            "institutionId": complaint.institution_id,
            "bureau": complaint.bureau,
            "priority": complaint.priority,
            "status": complaint.status,
        }

        # 1. Overdue complaints.
        if due_date and due_date < today:
            days_overdue = (today - due_date).days

            alerts.append({
                **base,
                "type": "overdue",
                "severity": "high",
                "message": f"Overdue by {days_overdue} days",
                "date": due_date.isoformat(),
            })

        # 2. Complaints with approaching deadlines.
        elif due_date and due_date <= today + timedelta(
            days=due_soon_days
        ):
            alerts.append({
                **base,
                "type": "due_soon",
                "severity": "medium",
                "message": "Complaint deadline is approaching",
                "date": due_date.isoformat(),
            })

        # 3. Complaints that have not been updated recently.
        if updated_date:
            inactive_days_count = (today - updated_date).days

            if inactive_days_count >= inactive_days:
                alerts.append({
                    **base,
                    "type": "inactive",
                    "severity": "medium",
                    "message": (
                        f"No recorded update for "
                        f"{inactive_days_count} days"
                    ),
                    "date": updated_date.isoformat(),
                })

        # 4. Critical-priority complaints.
        if complaint.priority == "Critical":
            alerts.append({
                **base,
                "type": "critical_priority",
                "severity": "high",
                "message": (
                    "Critical-priority complaint currently "
                    f"{complaint.status.lower()}"
                ),
                "date": (
                    received_date.isoformat()
                    if received_date
                    else None
                ),
            })

    # Display high-severity alerts before medium-severity alerts.
    alerts.sort(
        key=lambda item: (
            0 if item["severity"] == "high" else 1,
            item["complaintId"],
        )
    )

    return alerts
