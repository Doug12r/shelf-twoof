from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


# ── Household ─────────────────────────────────────────────────────────

class HouseholdCreate(BaseModel):
    name: str = Field("Us", max_length=200)
    anniversary: Optional[date] = None


class HouseholdJoin(BaseModel):
    invite_code: str = Field(..., min_length=1, max_length=20)


class HouseholdUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    anniversary: Optional[date] = None


class HouseholdResponse(BaseModel):
    id: str
    name: str
    invite_code: Optional[str]
    user_a_id: str
    user_b_id: Optional[str]
    anniversary: Optional[str]
    created_at: str


# ── Memory ────────────────────────────────────────────────────────────

class MemoryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    memory_date: date
    location: Optional[str] = Field(None, max_length=500)
    mood: Optional[str] = Field(None, max_length=20)
    tags: list[str] = Field(default_factory=list)
    pinned: bool = False


class MemoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    memory_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=500)
    mood: Optional[str] = Field(None, max_length=20)
    tags: Optional[list[str]] = None
    pinned: Optional[bool] = None


class PhotoResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    size_bytes: int
    sort_order: int
    uploaded_at: str


class MemoryResponse(BaseModel):
    id: str
    created_by: str
    title: str
    content: Optional[str]
    memory_date: str
    location: Optional[str]
    mood: Optional[str]
    tags: list[str]
    pinned: bool
    photos: list[PhotoResponse] = []
    created_at: str


class MemoryListResponse(BaseModel):
    memories: list[MemoryResponse]
    total: int
    page: int
    per_page: int


# ── Date Idea ─────────────────────────────────────────────────────────

class DateIdeaCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    estimated_cost: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=500)
    url: Optional[str] = None
    priority: int = Field(0, ge=0, le=3)


class DateIdeaUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    estimated_cost: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=500)
    url: Optional[str] = None
    priority: Optional[int] = Field(None, ge=0, le=3)


class DateIdeaResponse(BaseModel):
    id: str
    created_by: str
    title: str
    description: Optional[str]
    category: Optional[str]
    estimated_cost: Optional[str]
    location: Optional[str]
    url: Optional[str]
    done: bool
    done_date: Optional[str]
    priority: int
    created_at: str


# ── Milestone ─────────────────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    milestone_date: date
    recurring: bool = False
    icon: Optional[str] = Field(None, max_length=10)


class MilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    milestone_date: Optional[date] = None
    recurring: Optional[bool] = None
    icon: Optional[str] = Field(None, max_length=10)


class MilestoneResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    milestone_date: str
    recurring: bool
    icon: Optional[str]
    days_until: Optional[int]  # calculated field
    created_at: str


# ── Search ────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    id: str
    title: str
    snippet: str
    memory_date: str
    location: Optional[str]
