"""Initial TwoOf schema

Revision ID: 001
Revises:
Create Date: 2026-02-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS twoof")
    op.execute("SET search_path TO twoof, public")

    # Households
    op.create_table(
        "households",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False, server_default="Us"),
        sa.Column("invite_code", sa.String(20), unique=True),
        sa.Column("user_a_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_b_id", UUID(as_uuid=True), nullable=True),
        sa.Column("anniversary", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        schema="twoof",
    )
    op.create_index("idx_households_users", "households", ["user_a_id", "user_b_id"], schema="twoof")

    # Memories
    op.create_table(
        "memories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("household_id", UUID(as_uuid=True), sa.ForeignKey("twoof.households.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("memory_date", sa.Date, nullable=False),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("mood", sa.String(20), nullable=True),
        sa.Column("tags", sa.dialects.postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("pinned", sa.Boolean, nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        schema="twoof",
    )
    op.create_index("idx_memories_household", "memories", ["household_id"], schema="twoof")
    op.create_index("idx_memories_date", "memories", ["memory_date"], schema="twoof")
    op.create_index("idx_memories_tags", "memories", ["tags"], schema="twoof", postgresql_using="gin")

    # Photos
    op.create_table(
        "photos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("memory_id", UUID(as_uuid=True), sa.ForeignKey("twoof.memories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.Text, nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger, nullable=False),
        sa.Column("sort_order", sa.SmallInteger, nullable=False, server_default=sa.text("0")),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        schema="twoof",
    )
    op.create_index("idx_photos_memory", "photos", ["memory_id"], schema="twoof")

    # Date Ideas
    op.create_table(
        "date_ideas",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("household_id", UUID(as_uuid=True), sa.ForeignKey("twoof.households.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("estimated_cost", sa.String(50), nullable=True),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("url", sa.Text, nullable=True),
        sa.Column("done", sa.Boolean, nullable=False, server_default=sa.text("FALSE")),
        sa.Column("done_date", sa.Date, nullable=True),
        sa.Column("priority", sa.SmallInteger, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        schema="twoof",
    )
    op.create_index("idx_dateideas_household", "date_ideas", ["household_id"], schema="twoof")

    # Milestones
    op.create_table(
        "milestones",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("household_id", UUID(as_uuid=True), sa.ForeignKey("twoof.households.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("milestone_date", sa.Date, nullable=False),
        sa.Column("recurring", sa.Boolean, nullable=False, server_default=sa.text("FALSE")),
        sa.Column("icon", sa.String(10), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        schema="twoof",
    )
    op.create_index("idx_milestones_household", "milestones", ["household_id"], schema="twoof")


def downgrade() -> None:
    op.drop_table("milestones", schema="twoof")
    op.drop_table("date_ideas", schema="twoof")
    op.drop_table("photos", schema="twoof")
    op.drop_table("memories", schema="twoof")
    op.drop_table("households", schema="twoof")
