import pytest


@pytest.mark.django_db
def test_movimentacao_create(api_client, material):
    payload = {"material": material.id, "tipo": "entrada", "quantidade": "2.5"}
    resp = api_client.post("/api/movimentacoes-estoque/", payload, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert int(data["material"]) == material.id
