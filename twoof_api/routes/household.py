import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from shelf_auth_middleware import get_current_user, ShelfUser

from ..database import get_db
from ..models import Household
from ..schemas import HouseholdCreate, HouseholdJoin, HouseholdUpdate, HouseholdResponse

router = APIRouter(prefix="/api", tags=["household"])


async def get_user_household(user_id: UUID, db: AsyncSession) -> Household | None:
    result = await db.execute(
        select(Household).where(
            or_(Household.user_a_id == user_id, Household.user_b_id == user_id)
        )
    )
    return result.scalar_one_or_none()


def _household_response(h: Household) -> HouseholdResponse:
    return HouseholdResponse(
        id=str(h.id),
        name=h.name,
        invite_code=h.invite_code,
        user_a_id=str(h.user_a_id),
        user_b_id=str(h.user_b_id) if h.user_b_id else None,
        anniversary=h.anniversary.isoformat() if h.anniversary else None,
        created_at=h.created_at.isoformat(),
    )


@router.post("/household", response_model=HouseholdResponse, status_code=201)
async def create_household(
    data: HouseholdCreate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    existing = await get_user_household(uid, db)
    if existing:
        raise HTTPException(status_code=409, detail="Already in a household")

    household = Household(
        name=data.name.strip(),
        invite_code=secrets.token_urlsafe(6)[:8].upper(),
        user_a_id=uid,
        anniversary=data.anniversary,
    )
    db.add(household)
    await db.commit()
    await db.refresh(household)
    return _household_response(household)


@router.get("/household", response_model=HouseholdResponse)
async def get_household(
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")
    return _household_response(household)


@router.post("/household/join", response_model=HouseholdResponse)
async def join_household(
    data: HouseholdJoin,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    existing = await get_user_household(uid, db)
    if existing:
        raise HTTPException(status_code=409, detail="Already in a household")

    code = data.invite_code.strip().upper()
    household = (
        await db.execute(select(Household).where(Household.invite_code == code))
    ).scalar_one_or_none()

    if not household:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    if household.user_b_id is not None:
        raise HTTPException(status_code=409, detail="Household is full")
    if household.user_a_id == uid:
        raise HTTPException(status_code=400, detail="Cannot join your own household")

    household.user_b_id = uid
    await db.commit()
    await db.refresh(household)
    return _household_response(household)


@router.put("/household", response_model=HouseholdResponse)
async def update_household(
    data: HouseholdUpdate,
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "name" and value:
            value = value.strip()
        setattr(household, key, value)

    await db.commit()
    await db.refresh(household)
    return _household_response(household)


@router.post("/household/regenerate-invite", response_model=HouseholdResponse)
async def regenerate_invite(
    user: ShelfUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    uid = UUID(user.id)
    household = await get_user_household(uid, db)
    if not household:
        raise HTTPException(status_code=404, detail="No household found")

    household.invite_code = secrets.token_urlsafe(6)[:8].upper()
    await db.commit()
    await db.refresh(household)
    return _household_response(household)
