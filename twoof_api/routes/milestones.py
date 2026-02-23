from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shelf_auth_middleware import get_current_user, ShelfUser

from ..database import get_db
from ..models import Milestone
from ..schemas import MilestoneCreate, MilestoneUpdate, MilestoneResponse
from .household import get_user_household

router = APIRouter(prefix="/api/milestones", tags=["milestones"])


def _days_until(milestone_date: date, recurring: bool) -> int | None:
    today = date.today()
    if not recurring:
        delta = (milestone_date - today).days
        return delta if delta >= 0 else None

    # For recurring milestones, find the next occurrence
    this_year = milestone_date.replace(year=today.year)
    if this_year >= today:
        return (this_year - today).days
    next_year = milestone_date.replace(year=today.year + 1)
    return (next_year - today).days


def _milestone_response(m: Milestone) -> MilestoneResponse:
    return MilestoneResponse(
        id=str(m.id),
        title=m.title,
        description=m.description,
        milestone_date=m.milestone_date.isoformat(),
        recurring=m.recurring,
        icon=m.icon,
        days_until=_days_until(m.milestone_date, m.recurring),
        created_at=m.created_at.isoformat(),
    )


@router.get("", response_model=list[MilestoneResponse])
async def list_milestones(
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    rows = (
        await db.execute(
            select(Milestone)
            .where(Milestone.household_id == household.id)
            .order_by(Milestone.milestone_date)
        )
    ).scalars().all()

    results = [_milestone_response(m) for m in rows]
    # Sort by upcoming first (non-null days_until, ascending)
    results.sort(key=lambda m: (m.days_until is None, m.days_until or 0))
    return results


@router.post("", response_model=MilestoneResponse, status_code=201)
async def create_milestone(
    data: MilestoneCreate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    milestone = Milestone(
        household_id=household.id,
        title=data.title.strip(),
        description=data.description,
        milestone_date=data.milestone_date,
        recurring=data.recurring,
        icon=data.icon,
    )
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return _milestone_response(milestone)


@router.put("/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: str,
    data: MilestoneUpdate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    milestone = (
        await db.execute(
            select(Milestone).where(
                Milestone.id == UUID(milestone_id),
                Milestone.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = data.model_dump(exclude_unset=True)
    if "title" in update_data and update_data["title"]:
        update_data["title"] = update_data["title"].strip()
    for key, value in update_data.items():
        setattr(milestone, key, value)

    await db.commit()
    await db.refresh(milestone)
    return _milestone_response(milestone)


@router.delete("/{milestone_id}", status_code=204)
async def delete_milestone(
    milestone_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    milestone = (
        await db.execute(
            select(Milestone).where(
                Milestone.id == UUID(milestone_id),
                Milestone.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    await db.delete(milestone)
    await db.commit()
