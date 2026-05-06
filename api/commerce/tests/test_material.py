import pytest


@pytest.mark.django_db
def test_material_crud_api(api_client):
    resp = api_client.post("/api/materiais/", {"nome": "Linha"}, format="json")
    assert resp.status_code == 201
    mid = resp.json()["id"]

    resp = api_client.get(f"/api/materiais/{mid}/")
    assert resp.status_code == 200

    resp = api_client.patch(
        f"/api/materiais/{mid}/", {"estoque_minimo": "1.0"}, format="json"
    )
    assert resp.status_code in (200, 202)

    resp = api_client.delete(f"/api/materiais/{mid}/")
    assert resp.status_code in (204, 200, 202)
