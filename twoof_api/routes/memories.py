import os
from uuid import UUID
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, extract
from shelf_auth_middleware import get_current_user, ShelfUser

from ..config import settings
from ..database import get_db
from ..models import Memory, Photo
from ..schemas import (
    MemoryCreate,
    MemoryUpdate,
    MemoryResponse,
    MemoryListResponse,
    PhotoResponse,
)
from .household import get_user_household

router = APIRouter(prefix="/api/memories", tags=["memories"])


def _photo_response(p: Photo) -> PhotoResponse:
    return PhotoResponse(
        id=str(p.id),
        filename=p.filename,
        mime_type=p.mime_type,
        size_bytes=p.size_bytes,
        sort_order=p.sort_order,
        uploaded_at=p.uploaded_at.isoformat(),
    )


def _memory_response(m: Memory, photos: list[Photo] | None = None) -> MemoryResponse:
    photo_list = photos if photos is not None else (m.photos if m.photos else [])
    return MemoryResponse(
        id=str(m.id),
        created_by=str(m.created_by),
        title=m.title,
        content=m.content,
        memory_date=m.memory_date.isoformat(),
        location=m.location,
        mood=m.mood,
        tags=m.tags or [],
        pinned=m.pinned,
        photos=[_photo_response(p) for p in sorted(photo_list, key=lambda x: x.sort_order)],
        created_at=m.created_at.isoformat(),
    )


@router.get("", response_model=MemoryListResponse)
async def list_memories(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    year: int | None = Query(None),
    month: int | None = Query(None, ge=1, le=12),
    tag: str | None = Query(None),
    pinned: bool | None = Query(None),
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    query = select(Memory).where(Memory.household_id == household.id)

    if year:
        query = query.where(extract("year", Memory.memory_date) == year)
    if month:
        query = query.where(extract("month", Memory.memory_date) == month)
    if tag:
        query = query.where(Memory.tags.any(tag))
    if pinned is not None:
        query = query.where(Memory.pinned == pinned)

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Fetch with photos — pinned first, then by date desc
    query = (
        query
        .order_by(desc(Memory.pinned), desc(Memory.memory_date), desc(Memory.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    memories = (await db.execute(query)).scalars().all()

    # Fetch photos for these memories
    if memories:
        memory_ids = [m.id for m in memories]
        photos = (
            await db.execute(
                select(Photo).where(Photo.memory_id.in_(memory_ids)).order_by(Photo.sort_order)
            )
        ).scalars().all()
        photo_map: dict[UUID, list[Photo]] = {}
        for p in photos:
            photo_map.setdefault(p.memory_id, []).append(p)
    else:
        photo_map = {}

    return MemoryListResponse(
        memories=[_memory_response(m, photo_map.get(m.id, [])) for m in memories],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=MemoryResponse, status_code=201)
async def create_memory(
    data: MemoryCreate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    memory = Memory(
        household_id=household.id,
        created_by=uid,
        title=data.title.strip(),
        content=data.content,
        memory_date=data.memory_date,
        location=data.location,
        mood=data.mood,
        tags=data.tags,
        pinned=data.pinned,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return _memory_response(memory, [])


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    memory = (
        await db.execute(
            select(Memory).where(
                Memory.id == UUID(memory_id),
                Memory.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    photos = (
        await db.execute(
            select(Photo).where(Photo.memory_id == memory.id).order_by(Photo.sort_order)
        )
    ).scalars().all()

    return _memory_response(memory, list(photos))


@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    data: MemoryUpdate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    memory = (
        await db.execute(
            select(Memory).where(
                Memory.id == UUID(memory_id),
                Memory.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    update_data = data.model_dump(exclude_unset=True)
    if "title" in update_data and update_data["title"]:
        update_data["title"] = update_data["title"].strip()
    for key, value in update_data.items():
        setattr(memory, key, value)

    await db.commit()
    await db.refresh(memory)

    photos = (
        await db.execute(
            select(Photo).where(Photo.memory_id == memory.id).order_by(Photo.sort_order)
        )
    ).scalars().all()

    return _memory_response(memory, list(photos))


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    memory = (
        await db.execute(
            select(Memory).where(
                Memory.id == UUID(memory_id),
                Memory.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Delete photo files from disk
    photos = (
        await db.execute(select(Photo).where(Photo.memory_id == memory.id))
    ).scalars().all()

    for photo in photos:
        file_path = Path(settings.data_dir) / photo.file_path
        if file_path.exists():
            file_path.unlink()

    await db.delete(memory)
    await db.commit()
