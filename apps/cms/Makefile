.PHONY: help build up down restart logs shell backup clean deploy update

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs (use: make logs SERVICE=app)
	docker-compose logs -f $(SERVICE)

shell: ## Open shell in app container
	docker-compose exec app sh

backup: ## Backup MongoDB database
	@mkdir -p backups
	docker-compose exec -T mongodb mongodump --archive --gzip > backups/mongodb-$$(date +%Y%m%d-%H%M%S).archive.gz
	@echo "✅ Backup created in backups/"

clean: ## Remove unused Docker resources
	docker system prune -f

deploy: ## Full deployment (build and start)
	chmod +x scripts/deploy-hetzner.sh
	./scripts/deploy-hetzner.sh

update: ## Update application (pull code and rebuild)
	chmod +x scripts/update-hetzner.sh
	./scripts/update-hetzner.sh

ps: ## Show running containers
	docker-compose ps

stats: ## Show container resource usage
	docker stats

# Production specific commands
prod-up: ## Start with production overrides
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

atlas-up: ## Start with MongoDB Atlas (instead of self-hosted)
	docker-compose -f docker-compose.yml -f docker-compose.atlas.yml up -d

atlas-down: ## Stop with MongoDB Atlas
	docker-compose -f docker-compose.yml -f docker-compose.atlas.yml down

