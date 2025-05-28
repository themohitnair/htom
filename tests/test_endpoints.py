from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_convert_success():
    """Test successful HTML to Markdown conversion"""
    response = client.post("/convert", json={"html": "<h1>Hello</h1><p>World</p>"})

    assert response.status_code == 200
    data = response.json()
    assert data["success"] == "ok"
    assert "Hello" in data["markdown"]


def test_convert_empty_html():
    """Test conversion with empty HTML"""
    response = client.post("/convert", json={"html": ""})

    assert response.status_code == 200
    assert response.json()["success"] == "ok"


@patch("main.html_to_markdown")
def test_convert_error_handling(mock_convert):
    """Test error handling in conversion"""
    mock_convert.side_effect = Exception("Test error")

    response = client.post("/convert", json={"html": "<h1>Test</h1>"})

    assert response.status_code == 200
    assert response.json()["success"] == "error"


def test_convert_invalid_input():
    """Test validation error"""
    response = client.post("/convert", json={"wrong_field": "value"})

    assert response.status_code == 422
