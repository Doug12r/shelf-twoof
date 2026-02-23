from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from shelf_auth_middleware import get_current_user, ShelfUser

from ..database import get_db
from ..models import DateIdea
from ..schemas import DateIdeaCreate, DateIdeaUpdate, DateIdeaResponse
from .household import get_user_household

router = APIRouter(prefix="/api/dates", tags=["dates"])


def _idea_response(d: DateIdea) -> DateIdeaResponse:
    return DateIdeaResponse(
        id=str(d.id),
        created_by=str(d.created_by),
        title=d.title,
        description=d.description,
        category=d.category,
        estimated_cost=d.estimated_cost,
        location=d.location,
        url=d.url,
        done=d.done,
        done_date=d.done_date.isoformat() if d.done_date else None,
        priority=d.priority,
        created_at=d.created_at.isoformat(),
    )


@router.get("", response_model=list[DateIdeaResponse])
async def list_date_ideas(
    category: str | None = Query(None),
    done: bool | None = Query(None),
    priority: int | None = Query(None, ge=0, le=3),
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    query = select(DateIdea).where(DateIdea.household_id == household.id)

    if category:
        query = query.where(DateIdea.category == category)
    if done is not None:
        query = query.where(DateIdea.done == done)
    if priority is not None:
        query = query.where(DateIdea.priority == priority)

    query = query.order_by(desc(DateIdea.priority), desc(DateIdea.created_at))
    rows = (await db.execute(query)).scalars().all()
    return [_idea_response(d) for d in rows]


@router.post("", response_model=DateIdeaResponse, status_code=201)
async def create_date_idea(
    data: DateIdeaCreate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    idea = DateIdea(
        household_id=household.id,
        created_by=uid,
        title=data.title.strip(),
        description=data.description,
        category=data.category,
        estimated_cost=data.estimated_cost,
        location=data.location,
        url=data.url,
        priority=data.priority,
    )
    db.add(idea)
    await db.commit()
    await db.refresh(idea)
    return _idea_response(idea)


@router.put("/{idea_id}", response_model=DateIdeaResponse)
async def update_date_idea(
    idea_id: str,
    data: DateIdeaUpdate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    idea = (
        await db.execute(
            select(DateIdea).where(
                DateIdea.id == UUID(idea_id),
                DateIdea.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not idea:
        raise HTTPException(status_code=404, detail="Date idea not found")

    update_data = data.model_dump(exclude_unset=True)
    if "title" in update_data and update_data["title"]:
        update_data["title"] = update_data["title"].strip()
    for key, value in update_data.items():
        setattr(idea, key, value)

    await db.commit()
    await db.refresh(idea)
    return _idea_response(idea)


@router.delete("/{idea_id}", status_code=204)
async def delete_date_idea(
    idea_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    idea = (
        await db.execute(
            select(DateIdea).where(
                DateIdea.id == UUID(idea_id),
                DateIdea.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not idea:
        raise HTTPException(status_code=404, detail="Date idea not found")

    await db.delete(idea)
    await db.commit()


@router.patch("/{idea_id}/done", response_model=DateIdeaResponse)
async def toggle_done(
    idea_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    idea = (
        await db.execute(
            select(DateIdea).where(
                DateIdea.id == UUID(idea_id),
                DateIdea.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not idea:
        raise HTTPException(status_code=404, detail="Date idea not found")

    idea.done = not idea.done
    idea.done_date = date.today() if idea.done else None

    await db.commit()
    await db.refresh(idea)
    return _idea_response(idea)
