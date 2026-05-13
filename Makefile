.PHONY: help test test-backend test-frontend ci clean docker-up docker-down docker-logs docker-rebuild migrations makemigrations migrate createsuperuser shell

help:
	@echo "BordadosApp - Available Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make docker-up        Start all services (docker compose up -d)"
	@echo "  make docker-down      Stop all services (docker compose down)"
	@echo "  make docker-rebuild   Rebuild images after Dockerfile changes"
	@echo ""
	@echo "Backend (API):"
	@echo "  make test-backend     Run Django tests (inside docker)"
	@echo "  make makemigrations   Create migrations (inside docker)"
	@echo "  make migrate          Apply migrations (inside docker)"
	@echo "  make createsuperuser  Create Django admin user (inside docker)"
	@echo "  make shell            Access Django shell (inside docker)"
	@echo ""
	@echo "Frontend (React):"
	@echo "  make test-frontend    Run frontend tests (inside docker)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        Start all services (docker compose up -d)"
	@echo "  make docker-down      Stop all services (docker compose down)"
	@echo "  make docker-logs      View live logs from all services"
	@echo "  make docker-rebuild   Rebuild images after Dockerfile changes"
	@echo ""
	@echo "CI/Testing:"
	@echo "  make test             Run all tests in containers"
	@echo "  make ci               Run the automated test pipeline"

test-backend:
	@echo "🧪 Running backend tests..."
	docker compose exec api pytest --tb=short -v

migrations:
	@echo "⚙️  Running makemigrations and migrate inside docker (api service)"
	docker compose exec api python manage.py makemigrations --noinput || true
	docker compose exec api python manage.py migrate --noinput

makemigrations:
	@echo "⚙️  Running makemigrations inside docker (api service)"
	docker compose exec api python manage.py makemigrations

migrate:
	@echo "⚙️  Running migrate inside docker (api service)"
	docker compose exec api python manage.py migrate

createsuperuser:
	@echo "⚙️  Creating superuser inside docker (interactive)"
	docker compose exec -it api python manage.py createsuperuser

shell:
	@echo "⚙️  Opening Django shell inside docker (interactive)"
	docker compose exec -it api python manage.py shell

test-frontend:
	@echo "🧪 Running frontend tests..."
	docker compose exec frontend npm run test -- --run

# Docker
docker-up:
	docker compose up -d
	@echo "✅ Services started. Frontend: http://localhost:5173, Backend: http://localhost:8000"

docker-down:
	docker compose down
	@echo "✅ Services stopped"

docker-logs:
	docker compose logs -f

docker-rebuild:
	docker compose up -d --build
	@echo "✅ Services rebuilt and started"

test: docker-up test-backend test-frontend
	@echo "✅ All tests passed!"

ci: test
	@echo "✅ CI test pipeline simulation complete!"

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .coverage -exec rm -rf {} + 2>/dev/null || true
	cd api && find . -name "*.pyc" -delete
	@echo "✅ Cleanup complete!"
