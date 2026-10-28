import os
import sys
import tempfile
import pytest
from fastapi.testclient import TestClient

# Set isolated temporary database BEFORE importing database or main
temp_db_file = tempfile.NamedTemporaryFile(suffix="_test.db", delete=False)
temp_db_path = temp_db_file.name
temp_db_file.close()

os.environ["DATABASE_URL"] = f"sqlite:///{temp_db_path}"
os.environ["SECRET_KEY"] = "test_secret_key_for_jembertrip_test_suite_12345"
os.environ["ADMIN_MASTER_KEY"] = "test_admin_master_key_123"

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import Base, engine, SessionLocal
import models
import security

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    try:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
    except Exception:
        pass

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="session")
def client():
    # Import app after env vars are set
    from main import app
    with TestClient(app) as test_client:
        yield test_client
