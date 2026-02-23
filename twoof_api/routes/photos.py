import uuid as uuid_mod
from uuid import UUID
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from shelf_auth_middleware import get_current_user, ShelfUser

from ..config import settings
from ..database import get_db
from ..models import Memory, Photo
from ..schemas import PhotoResponse
from .household import get_user_household

router = APIRouter(prefix="/api", tags=["photos"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

EXT_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.post("/memories/{memory_id}/photos", response_model=list[PhotoResponse], status_code=201)
async def upload_photos(
    memory_id: str,
    files: list[UploadFile] = File(...),
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

    # Get current max sort order
    max_order = (
        await db.execute(
            select(func.coalesce(func.max(Photo.sort_order), -1)).where(
                Photo.memory_id == memory.id
            )
        )
    ).scalar() or -1

    photos_dir = Path(settings.data_dir) / "photos"
    photos_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for i, file in enumerate(files):
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not allowed. Use JPEG, PNG, WebP, or GIF.",
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large (max 10MB)")

        ext = EXT_MAP.get(file.content_type, ".bin")
        file_id = uuid_mod.uuid4()
        relative_path = f"photos/{file_id}{ext}"
        disk_path = Path(settings.data_dir) / relative_path
        disk_path.write_bytes(content)

        photo = Photo(
            memory_id=memory.id,
            file_path=relative_path,
            filename=file.filename or f"photo{ext}",
            mime_type=file.content_type,
            size_bytes=len(content),
            sort_order=max_order + 1 + i,
        )
        db.add(photo)
        results.append(photo)

    await db.commit()
    for p in results:
        await db.refresh(p)

    return [
        PhotoResponse(
            id=str(p.id),
            filename=p.filename,
            mime_type=p.mime_type,
            size_bytes=p.size_bytes,
            sort_order=p.sort_order,
            uploaded_at=p.uploaded_at.isoformat(),
        )
        for p in results
    ]


@router.get("/photos/{photo_id}/file")
async def serve_photo(
    photo_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    photo = (await db.execute(select(Photo).where(Photo.id == UUID(photo_id)))).scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Verify photo belongs to this household
    memory = (
        await db.execute(
            select(Memory).where(
                Memory.id == photo.memory_id,
                Memory.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = Path(settings.data_dir) / photo.file_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        media_type=photo.mime_type,
        filename=photo.filename,
    )


@router.delete("/photos/{photo_id}", status_code=204)
async def delete_photo(
    photo_id: str,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    photo = (await db.execute(select(Photo).where(Photo.id == UUID(photo_id)))).scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    memory = (
        await db.execute(
            select(Memory).where(
                Memory.id == photo.memory_id,
                Memory.household_id == household.id,
            )
        )
    ).scalar_one_or_none()

    if not memory:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = Path(settings.data_dir) / photo.file_path
    if file_path.exists():
        file_path.unlink()

    await db.delete(photo)
    await db.commit()
