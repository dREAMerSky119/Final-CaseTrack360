
from datetime import date, timedelta


def parse_day(value):
    if not value:
        return None

    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def calculate_recurrence(
    Complaint,
    institution_id,
    threshold=3,
    window_days=90,
):
    today = date.today()
    start_date = today - timedelta(days=window_days)

    complaints = Complaint.query.filter_by(
        institution_id=institution_id
    ).all()

    dated_complaints = []

    for complaint in complaints:
        received_date = parse_day(complaint.received)

        if received_date:
            dated_complaints.append(
                (complaint, received_date)
            )

    recent = [
        (c, received)
        for c, received in dated_complaints
        if start_date <= received <= today
    ]

    categories = {}

    for complaint, received in recent:
        category = complaint.category or "Other"
        categories.setdefault(category, []).append(
            (complaint, received)
        )

    category_results = []

    for category, records in categories.items():
        records.sort(key=lambda item: item[1], reverse=True)

        count = len(records)

        if count >= threshold:
            suggestion = "Repeated Pattern"
        elif count >= 2:
            suggestion = "Recurring"
        else:
            suggestion = "First Reported"

        category_results.append({
            "category": category,
            "count": count,
            "suggestedFrequency": suggestion,
            "complaints": [
                {
                    "id": c.id,
                    "title": c.title,
                    "received": received.isoformat(),
                    "status": c.status,
                    "bureau": c.bureau,
                    "priority": c.priority,
                }
                for c, received in records
            ],
        })

    category_results.sort(
        key=lambda item: item["count"],
        reverse=True,
    )

    unresolved_statuses = {
        "Open",
        "In Progress",
        "Pending",
    }

    return {
        "institutionId": institution_id,
        "totalComplaints": len(complaints),
        "last30Days": sum(
            received >= today - timedelta(days=30)
            and received <= today
            for _, received in dated_complaints
        ),
        "last90Days": len(recent),
        "last365Days": sum(
            received >= today - timedelta(days=365)
            and received <= today
            for _, received in dated_complaints
        ),
        "unresolvedComplaints": sum(
            c.status in unresolved_statuses
            for c in complaints
        ),
        "repeatedCategories": category_results,
        "rule": {
            "threshold": threshold,
            "windowDays": window_days,
            "note": (
                "Prototype suggestion based on institution, "
                "category and complaint received date. "
                "It does not automatically change priority."
            ),
        },
    }
