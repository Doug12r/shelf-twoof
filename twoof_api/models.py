import uuid
from datetime import date, datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Date,
    DateTime,
    SmallInteger,
    BigInteger,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Household(Base):
    __tablename__ = "households"
    __table_args__ = (
        Index("idx_households_users", "user_a_id", "user_b_id"),
        {"schema": "twoof"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, default="Us")
    invite_code = Column(String(20), unique=True)
    user_a_id = Column(UUID(as_uuid=True), nullable=False)
    user_b_id = Column(UUID(as_uuid=True), nullable=True)
    anniversary = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    memories = relationship("Memory", back_populates="household", cascade="all, delete-orphan")
    date_ideas = relationship("DateIdea", back_populates="household", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="household", cascade="all, delete-orphan")


class Memory(Base):
    __tablename__ = "memories"
    __table_args__ = (
        Index("idx_memories_household", "household_id"),
        Index("idx_memories_date", "memory_date"),
        Index("idx_memories_tags", "tags", postgresql_using="gin"),
        {"schema": "twoof"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("twoof.households.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=True)
    memory_date = Column(Date, nullable=False)
    location = Column(String(500), nullable=True)
    mood = Column(String(20), nullable=True)
    tags = Column(ARRAY(Text), default=list)
    pinned = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    household = relationship("Household", back_populates="memories")
    photos = relationship("Photo", back_populates="memory", cascade="all, delete-orphan")


class Photo(Base):
    __tablename__ = "photos"
    __table_args__ = (
        Index("idx_photos_memory", "memory_id"),
        {"schema": "twoof"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    memory_id = Column(UUID(as_uuid=True), ForeignKey("twoof.memories.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(Text, nullable=False)
    filename = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    sort_order = Column(SmallInteger, nullable=False, default=0)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    memory = relationship("Memory", back_populates="photos")


class DateIdea(Base):
    __tablename__ = "date_ideas"
    __table_args__ = (
        Index("idx_dateideas_household", "household_id"),
        {"schema": "twoof"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("twoof.households.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    estimated_cost = Column(String(50), nullable=True)
    location = Column(String(500), nullable=True)
    url = Column(Text, nullable=True)
    done = Column(Boolean, nullable=False, default=False)
    done_date = Column(Date, nullable=True)
    priority = Column(SmallInteger, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    household = relationship("Household", back_populates="date_ideas")


class Milestone(Base):
    __tablename__ = "milestones"
    __table_args__ = (
        Index("idx_milestones_household", "household_id"),
        {"schema": "twoof"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(UUID(as_uuid=True), ForeignKey("twoof.households.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    milestone_date = Column(Date, nullable=False)
    recurring = Column(Boolean, nullable=False, default=False)
    icon = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    household = relationship("Household", back_populates="milestones")
