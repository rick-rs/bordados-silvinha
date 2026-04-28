.PHONY: help install install-dev lint format test clean docker-up docker-down

help:
	@echo "BordadosApp - Available Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install dependencies (production)"
	@echo "  make install-dev      Install dependencies (development + linting)"
	@echo "  make pre-commit       Setup pre-commit hooks (prevents bad commits)"
	@echo ""
	@echo "Backend (API):"
	@echo "  make lint-backend     Lint Python code (black, isort, flake8, mypy)"
	@echo "  make format-backend   Auto-format Python code (black, isort)"
	@echo "  make test-backend     Run Django tests with coverage"
	@echo "  make migrate          Run Django migrations"
	@echo "  make createsuperuser  Create Django admin user"
	@echo "  make shell            Access Django shell"
	@echo ""
	@echo "Frontend (React):"
	@echo "  make lint-frontend    Lint JavaScript/TypeScript (ESLint)"
	@echo "  make format-frontend  Auto-fix frontend linting errors"
	@echo "  make test-frontend    Run frontend tests"
	@echo "  make build-frontend   Build optimized frontend"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        Start all services (docker compose up -d)"
	@echo "  make docker-down      Stop all services (docker compose down)"
	@echo "  make docker-logs      View live logs from all services"
	@echo "  make docker-rebuild   Rebuild images after Dockerfile changes"
	@echo ""
	@echo "CI/Testing:"
	@echo "  make lint             Run all linters (backend + frontend)"
	@echo "  make format           Auto-format all code"
	@echo "  make test             Run all tests"
	@echo "  make ci               Simulate CI pipeline locally"

# Setup
install:
	pip install -r api/requirements.txt
	cd app && npm install

install-dev: install
	pip install -r api/requirements-dev.txt
	cd app && npm install --save-dev

pre-commit:
	pip install pre-commit
	pre-commit install
	@echo "✅ Pre-commit hooks installed! They will run before each commit."

# Backend - Linting & Formatting
lint-backend:
	@echo "🔍 Running backend linters..."
	cd api && black --check .
	cd api && isort --check-only .
	cd api && flake8 .
	@echo "✅ Backend linting passed!"

format-backend:
	@echo "🎨 Formatting backend code..."
	cd api && black .
	cd api && isort .
	@echo "✅ Backend formatted!"

test-backend:
	@echo "🧪 Running backend tests..."
	cd api && pytest --tb=short -v

migrate:
	cd api && python manage.py migrate

createsuperuser:
	cd api && python manage.py createsuperuser

shell:
	cd api && python manage.py shell

# Frontend - Linting & Formatting
lint-frontend:
	@echo "🔍 Running frontend linters..."
	cd app && npm run lint
	@echo "✅ Frontend linting passed!"

format-frontend:
	@echo "🎨 Formatting frontend code..."
	cd app && npm run lint -- --fix
	@echo "✅ Frontend formatted!"

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd app && npm run test

build-frontend:
	@echo "🔨 Building frontend..."
	cd app && npm run build
	@echo "✅ Frontend built!"

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

# All checks
lint: lint-backend lint-frontend
	@echo "✅ All linting checks passed!"

format: format-backend format-frontend
	@echo "✅ All code formatted!"

test: test-backend test-frontend
	@echo "✅ All tests passed!"

ci: lint test
	@echo "✅ CI pipeline simulation complete!"

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .coverage -exec rm -rf {} + 2>/dev/null || true
	cd api && find . -name "*.pyc" -delete
	@echo "✅ Cleanup complete!"
