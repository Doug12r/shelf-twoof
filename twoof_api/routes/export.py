import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shelf_auth_middleware import get_current_user, ShelfUser

from ..database import get_db
from ..models import Household, Memory, Photo, DateIdea, Milestone
from .household import get_user_household

router = APIRouter(prefix="/api", tags=["export"])


@router.get("/export")
async def export_data(
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    hid = household.id

    memories = (await db.execute(select(Memory).where(Memory.household_id == hid).order_by(Memory.memory_date))).scalars().all()
    photos = (await db.execute(select(Photo).where(Photo.memory_id.in_([m.id for m in memories])))).scalars().all() if memories else []
    date_ideas = (await db.execute(select(DateIdea).where(DateIdea.household_id == hid).order_by(DateIdea.created_at))).scalars().all()
    milestones = (await db.execute(select(Milestone).where(Milestone.household_id == hid).order_by(Milestone.milestone_date))).scalars().all()

    photo_map: dict[str, list] = {}
    for p in photos:
        photo_map.setdefault(str(p.memory_id), []).append({
            "filename": p.filename,
            "mime_type": p.mime_type,
            "size_bytes": p.size_bytes,
        })

    export = {
        "app": "twoof",
        "version": "1.0.0",
        "household": {
            "name": household.name,
            "user_a_id": str(household.user_a_id),
            "user_b_id": str(household.user_b_id) if household.user_b_id else None,
            "anniversary": household.anniversary.isoformat() if household.anniversary else None,
        },
        "memories": [
            {
                "title": m.title,
                "content": m.content,
                "memory_date": m.memory_date.isoformat(),
                "location": m.location,
                "mood": m.mood,
                "tags": m.tags or [],
                "pinned": m.pinned,
                "created_by": str(m.created_by),
                "photos": photo_map.get(str(m.id), []),
            }
            for m in memories
        ],
        "date_ideas": [
            {
                "title": d.title,
                "description": d.description,
                "category": d.category,
                "estimated_cost": d.estimated_cost,
                "location": d.location,
                "url": d.url,
                "done": d.done,
                "done_date": d.done_date.isoformat() if d.done_date else None,
                "priority": d.priority,
                "created_by": str(d.created_by),
            }
            for d in date_ideas
        ],
        "milestones": [
            {
                "title": m.title,
                "description": m.description,
                "milestone_date": m.milestone_date.isoformat(),
                "recurring": m.recurring,
                "icon": m.icon,
            }
            for m in milestones
        ],
    }

    content = json.dumps(export, indent=2, default=str)
    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=twoof-export.json"},
    )
