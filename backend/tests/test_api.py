import pytest
from datetime import timedelta
from jose import jwt
import security
import models

def test_password_hashing():
    raw_pwd = "passwordRahasia123!"
    hashed = security.get_password_hash(raw_pwd)
    assert hashed != raw_pwd
    assert security.verify_password(raw_pwd, hashed) is True
    assert security.verify_password("wrongPassword", hashed) is False

def test_jwt_token_creation_and_expiry():
    data = {"sub": "user_tester", "role": "user"}
    token = security.create_access_token(data, expires_delta=timedelta(minutes=30))
    assert token is not None

    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == "user_tester"
    assert payload["role"] == "user"

def test_register_and_login_flow(client):
    unique_user = "testuser_qa"
    unique_email = "testuser_qa@example.com"
    reg_payload = {
        "username": unique_user,
        "email": unique_email,
        "full_name": "QA Tester User",
        "password": "securepassword123"
    }

    # Register
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    assert res.json()["status"] == "success"

    # Duplicate username check
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 400
    assert "Username sudah dipakai" in res_dup.json()["detail"]

    # Login Success
    login_res = client.post("/api/auth/login", json={"username": unique_user, "password": "securepassword123"})
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["user"]["username"] == unique_user

    # Login Bad Credentials
    bad_login = client.post("/api/auth/login", json={"username": unique_user, "password": "wrong_password"})
    assert bad_login.status_code == 401

def test_rbac_and_admin_protection(client, db_session):
    # Create regular user
    user_token = security.create_access_token({"sub": "regular_user", "role": "user"})
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Ensure user exists in db
    u = models.User(username="regular_user", email="reg@example.com", hashed_password="x", role="user")
    db_session.add(u)
    db_session.commit()

    # Create admin user
    admin_token = security.create_access_token({"sub": "admin_boss", "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    admin = models.User(username="admin_boss", email="boss@example.com", hashed_password="x", role="admin")
    db_session.add(admin)
    db_session.commit()

    # 1. Unauthenticated request to admin endpoint -> 401
    res_no_auth = client.get("/api/admin/stats")
    assert res_no_auth.status_code == 401

    # 2. Regular user requesting admin stats -> 403 Forbidden
    res_forbidden = client.get("/api/admin/stats", headers=user_headers)
    assert res_forbidden.status_code == 403

    # 3. Admin user requesting admin stats -> 200 OK
    res_admin = client.get("/api/admin/stats", headers=admin_headers)
    assert res_admin.status_code == 200
    assert res_admin.json()["status"] == "success"

def test_chat_session_idor_protection(client, db_session):
    # User A setup
    user_a = models.User(username="alice", email="alice@example.com", hashed_password="x", role="user")
    db_session.add(user_a)
    db_session.commit()
    db_session.refresh(user_a)

    token_a = security.create_access_token({"sub": "alice", "role": "user"})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B setup
    user_b = models.User(username="bob", email="bob@example.com", hashed_password="x", role="user")
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)

    token_b = security.create_access_token({"sub": "bob", "role": "user"})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Create session owned by Alice
    session_alice = models.ChatSession(user_id=user_a.id, title="Percakapan Rahasia Alice")
    db_session.add(session_alice)
    db_session.commit()
    db_session.refresh(session_alice)

    # Add a message to Alice's session
    msg = models.ChatMessage(session_id=session_alice.id, sender="user", content="Data pribadi Alice")
    db_session.add(msg)
    db_session.commit()

    # 1. Alice can read her own messages
    res_alice = client.get(f"/api/chat/{session_alice.id}/messages", headers=headers_a)
    assert res_alice.status_code == 200
    assert len(res_alice.json()["data"]) == 1

    # 2. Bob tries to read Alice's messages (IDOR attempt) -> 404
    res_bob = client.get(f"/api/chat/{session_alice.id}/messages", headers=headers_b)
    assert res_bob.status_code == 404

    # 3. Bob tries to delete Alice's session (IDOR attempt) -> 404
    del_bob = client.delete(f"/api/chat/{session_alice.id}", headers=headers_b)
    assert del_bob.status_code == 404

    # 4. Alice can delete her own session -> 200
    del_alice = client.delete(f"/api/chat/{session_alice.id}", headers=headers_a)
    assert del_alice.status_code == 200

def test_upload_authorization_and_validation(client):
    # 1. Anonymous upload to /api/upload/wisata -> 401
    dummy_file = ("test.png", b"fake-png-content", "image/png")
    res_anon = client.post("/api/upload/wisata", files={"file": dummy_file})
    assert res_anon.status_code == 401

    # 2. Non-admin user upload -> 403
    user_token = security.create_access_token({"sub": "alice", "role": "user"})
    res_user = client.post("/api/upload/wisata", files={"file": dummy_file}, headers={"Authorization": f"Bearer {user_token}"})
    assert res_user.status_code == 403

def test_boundary_inputs(client):
    # Empty body to login -> 422 Unprocessable Entity
    res_empty = client.post("/api/auth/login", json={})
    assert res_empty.status_code == 422

    # Very long string in question (10,000 chars) -> handled without 500 error
    long_question = "A" * 5000
    res_val = client.post("/api/v1/rekomendasi", json={"query": long_question, "k": 5})
    assert res_val.status_code in [200, 422]


def test_recommendations_and_seo_endpoints(client):
    user_token = security.create_access_token({"sub": "alice", "role": "user"})
    headers = {"Authorization": f"Bearer {user_token}"}

    # 1. Cold-start personal recommendations (6 items)
    res_pers = client.get("/api/v1/recommendations/personal", headers=headers)
    assert res_pers.status_code == 200
    data_pers = res_pers.json().get("data", [])
    assert len(data_pers) == 6

    # 2. Cold-start hybrid recommendations (6 items)
    res_hyb = client.get("/api/v1/recommendations/hybrid", headers=headers)
    assert res_hyb.status_code == 200
    data_hyb = res_hyb.json().get("data", [])
    assert len(data_hyb) == 6

    # 3. Robots.txt and Sitemap.xml
    robots_res = client.get("/robots.txt")
    assert robots_res.status_code == 200
    assert "Disallow: /admin/" in robots_res.text

    sitemap_res = client.get("/sitemap.xml")
    assert sitemap_res.status_code == 200
    assert "application/xml" in sitemap_res.headers.get("content-type", "")

