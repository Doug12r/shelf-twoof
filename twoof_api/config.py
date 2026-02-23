from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_url: str = "postgresql+asyncpg://shelf:changeme@shelf-db:5432/shelf"
    auth_url: str = "http://shelf-auth:8001"
    data_dir: str = "/data"
    db_pool_size: int = 5
    db_max_overflow: int = 3
    log_level: str = "INFO"
    workers: int = 1

    model_config = {"env_prefix": "SHELF_"}


settings = Settings()
