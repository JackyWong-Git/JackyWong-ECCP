import os
from pathlib import Path


TEST_DATABASE = Path("/tmp/eccp-api-test.db")
TEST_STORAGE = Path("/tmp/eccp-api-test-storage")
TEST_DATABASE.unlink(missing_ok=True)
os.environ["ECCP_API_DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DATABASE}"
os.environ["ECCP_API_STORAGE_DIR"] = str(TEST_STORAGE)
os.environ["ECCP_API_INTERNAL_AUTH_SECRET"] = "test-secret"
os.environ["ECCP_API_REDIS_URL"] = ""
os.environ["ECCP_API_AUTO_CREATE_SCHEMA"] = "true"
