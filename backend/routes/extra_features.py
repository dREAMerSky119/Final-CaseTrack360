
from flask import jsonify, request

from services.recurrence import calculate_recurrence
from services.alerts import generate_alerts


def register_extra_routes(app, db, models, helpers):
    Complaint = models["Complaint"]
    Institution = models["Institution"]
    CaseHistory = models["CaseHistory"]
    AuditLog = models["AuditLog"]
    RelatedCase = models["RelatedCase"]
    Handover = models["Handover"]

    login_required = helpers["login_required"]
    administrator_required = helpers.get("administrator_required", login_required)
    actor_name = helpers["actor_name"]
    record_history = helpers["record_history"]
    refresh_case_intelligence = helpers["refresh_case_intelligence"]

    @app.get("/api/alerts")
    @administrator_required
    def get_alerts():
        due_soon = request.args.get("dueSoonDays", 3, type=int)
        inactive = request.args.get("inactiveDays", 7, type=int)

        if not 0 <= due_soon <= 30 or not 1 <= inactive <= 365:
            return jsonify(message="Invalid alert thresholds."), 400

        return jsonify(
            generate_alerts(
                Complaint,
                due_soon_days=due_soon,
                inactive_days=inactive,
            )
        )

    @app.get(
        "/api/intelligence/institutions/"
        "<string:institution_id>/recurrence"
    )
    @login_required
    def institution_recurrence(institution_id):
        institution = db.session.get(Institution, institution_id)

        if not institution:
            return jsonify(message="Institution not found."), 404

        threshold = request.args.get("threshold", 3, type=int)
        window_days = request.args.get("windowDays", 90, type=int)

        if not 2 <= threshold <= 100:
            return jsonify(message="Threshold must be 2–100."), 400

        if not 1 <= window_days <= 365:
            return jsonify(message="Window must be 1–365 days."), 400

        result = calculate_recurrence(
            Complaint,
            institution_id,
            threshold=threshold,
            window_days=window_days,
        )

        result["institutionName"] = institution.name

        return jsonify(result)

    @app.post("/api/intelligence/duplicates/scan")
    @administrator_required
    def scan_duplicates():
        complaints = Complaint.query.order_by(
            Complaint.received.desc()
        ).all()

        created = 0
        suggestions = []

        for index, first in enumerate(complaints):
            for second in complaints[index + 1:]:
                reason, confidence = helpers["related_reason"](
                    first, second
                )

                if confidence < 50:
                    continue

                existing = RelatedCase.query.filter(
                    db.or_(
                        db.and_(
                            RelatedCase.complaint_a == first.id,
                            RelatedCase.complaint_b == second.id,
                        ),
                        db.and_(
                            RelatedCase.complaint_a == second.id,
                            RelatedCase.complaint_b == first.id,
                        ),
                    )
                ).first()

                if existing:
                    continue

                related = RelatedCase(
                    complaint_a=first.id,
                    complaint_b=second.id,
                    reason=reason or "Potential relationship",
                    confidence=confidence,
                )

                db.session.add(related)
                first.related = True
                second.related = True

                suggestions.append({
                    "complaintA": first.id,
                    "complaintB": second.id,
                    "confidence": confidence,
                    "reason": reason,
                })

                created += 1

        db.session.add(AuditLog(
            actor=actor_name(),
            action="duplicate_scan",
            entity_type="complaint",
            entity_id="multiple",
            detail=f"Created {created} related-case suggestions",
        ))

        db.session.commit()

        return jsonify({
            "created": created,
            "suggestions": suggestions,
            "note": (
                "These are rule-based suggestions. "
                "Complaints are not merged or deleted."
            ),
        })

    @app.get("/api/handovers")
    @administrator_required
    def list_handovers():
        rows = Handover.query.order_by(
            Handover.created_at.desc()
        ).all()

        return jsonify([
            {
                "id": row.id,
                "complaintId": row.complaint_id,
                "fromBureau": row.from_bureau,
                "toBureau": row.to_bureau,
                "reason": row.reason,
                "status": row.status,
                "createdBy": row.created_by,
                "createdAt": row.created_at.isoformat(),
            }
            for row in rows
        ])

    @app.patch("/api/handovers/<int:handover_id>")
    @administrator_required
    def decide_handover(handover_id):
        handover = db.session.get(Handover, handover_id)

        if not handover:
            return jsonify(message="Handover not found."), 404

        if handover.status != "Pending":
            return jsonify(
                message="This handover has already been decided."
            ), 409

        payload = request.get_json(silent=True) or {}
        decision = str(payload.get("decision", "")).strip().lower()
        note = str(payload.get("note", "")).strip()

        if decision not in {"approve", "reject"}:
            return jsonify(
                message="Decision must be approve or reject."
            ), 400

        complaint = db.session.get(
            Complaint, handover.complaint_id
        )

        if not complaint:
            return jsonify(message="Complaint not found."), 404

        if decision == "approve":
            complaint.bureau = handover.to_bureau
            complaint.updated = helpers["iso_today"]()
            handover.status = "Approved"

            refresh_case_intelligence(complaint)

            record_history(
                complaint,
                "handover_approved",
                (
                    f"Bureau changed from {handover.from_bureau} "
                    f"to {handover.to_bureau}. {note}"
                ).strip(),
            )
        else:
            handover.status = "Rejected"

            record_history(
                complaint,
                "handover_rejected",
                note or "Handover request rejected.",
            )

        db.session.add(AuditLog(
            actor=actor_name(),
            action=f"handover_{decision}",
            entity_type="handover",
            entity_id=str(handover.id),
            detail=note or f"Handover {handover.status.lower()}",
        ))

        db.session.commit()

        return jsonify({
            "id": handover.id,
            "complaintId": handover.complaint_id,
            "status": handover.status,
            "bureau": complaint.bureau,
        })

    @app.get(
        "/api/institutions/<string:institution_id>/overview"
    )
    @administrator_required
    def institution_overview(institution_id):
        institution = db.session.get(Institution, institution_id)

        if not institution:
            return jsonify(message="Institution not found."), 404

        complaints = Complaint.query.filter_by(
            institution_id=institution_id
        ).order_by(Complaint.received.desc()).all()

        recurrence = calculate_recurrence(
            Complaint,
            institution_id,
        )

        return jsonify({
            "institution": {
                "id": institution.id,
                "name": institution.name,
                "type": institution.type,
                "state": institution.state,
                "city": institution.city,
                "status": institution.status,
            },
            "recurrence": recurrence,
            "complaints": [
                {
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "status": c.status,
                    "priority": c.priority,
                    "frequency": c.frequency,
                    "bureau": c.bureau,
                    "received": c.received,
                    "due": c.due,
                }
                for c in complaints
            ],
        })
