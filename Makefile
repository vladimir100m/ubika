# Ubika Database Management Makefile
# This Makefile provides commands to manage local PostgreSQL and sync with Neon database

# Variables
BACKUP_DIR = backups
BACKUP_FILE = $(BACKUP_DIR)/neondb_dump_$(shell date +%Y%m%d_%H%M%S).sql
LATEST_BACKUP = $(BACKUP_DIR)/neondb_latest.sql

# Local PostgreSQL connection settings
LOCAL_DB_HOST = localhost
LOCAL_DB_PORT = 5432
LOCAL_DB_USER = admin
LOCAL_DB_PASSWORD = admin
LOCAL_DB_NAME = ubika

# Neon database connection (from .env)
NEON_DB_URL = postgres://neondb_owner:npg_k57ZTioHCGpd@ep-purple-union-a4hnrrtg.us-east-1.aws.neon.tech/neondb?sslmode=require

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help up down status dump-neon load-dump sync clean setup-local

# Default target
help: ## Show this help message
	@echo "$(GREEN)Ubika Database Management Commands$(NC)"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

setup-local: ## Setup local environment (create backup directory, set permissions)
	@echo "$(GREEN)Setting up local environment...$(NC)"
	@mkdir -p $(BACKUP_DIR)
	@chmod +x infra/scripts/init-user-db.sh
	@echo "$(GREEN)Local environment setup complete!$(NC)"

up: setup-local ## Start local PostgreSQL with Docker Compose
	@echo "$(GREEN)Starting local PostgreSQL...$(NC)"
	@cd infra && docker compose up -d
	@echo "$(GREEN)Waiting for PostgreSQL to be ready...$(NC)"
	@sleep 10
	@echo "$(GREEN)PostgreSQL is running on localhost:5432$(NC)"
	@echo "$(YELLOW)Connection details:$(NC)"
	@echo "  Host: $(LOCAL_DB_HOST)"
	@echo "  Port: $(LOCAL_DB_PORT)"
	@echo "  Database: $(LOCAL_DB_NAME)"
	@echo "  Username: $(LOCAL_DB_USER)"
	@echo "  Password: $(LOCAL_DB_PASSWORD)"

down: ## Stop local PostgreSQL
	@echo "$(YELLOW)Stopping local PostgreSQL...$(NC)"
	@cd infra && docker compose down
	@echo "$(GREEN)PostgreSQL stopped$(NC)"

status: ## Check status of local PostgreSQL
	@echo "$(GREEN)Checking PostgreSQL status...$(NC)"
	@cd infra && docker compose ps

dump-neon: setup-local ## Dump Neon database to local file
	@echo "$(GREEN)Dumping Neon database...$(NC)"
	@echo "$(YELLOW)This may take a few minutes depending on database size...$(NC)"
	@docker run --rm \
		-v "$(PWD)/$(BACKUP_DIR):/backups" \
		postgres:17 \
		pg_dump "$(NEON_DB_URL)" \
		--verbose \
		--clean \
		--no-owner \
		--no-privileges \
		--format=plain \
		--file=/backups/$(shell basename $(BACKUP_FILE))
	@cp $(BACKUP_FILE) $(LATEST_BACKUP)
	@echo "$(GREEN)Database dump completed!$(NC)"
	@echo "$(YELLOW)Backup saved to: $(BACKUP_FILE)$(NC)"
	@echo "$(YELLOW)Latest backup link: $(LATEST_BACKUP)$(NC)"
	@ls -lh $(BACKUP_FILE)

load-dump: ## Load the latest dump into local PostgreSQL
	@if [ ! -f "$(LATEST_BACKUP)" ]; then \
		echo "$(RED)No backup file found at $(LATEST_BACKUP)$(NC)"; \
		echo "$(YELLOW)Run 'make dump-neon' first to create a backup$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Loading dump into local PostgreSQL...$(NC)"
	@echo "$(YELLOW)Dropping and recreating database...$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		dropdb -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) --if-exists $(LOCAL_DB_NAME)
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		createdb -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) $(LOCAL_DB_NAME)
	@echo "$(YELLOW)Importing data...$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		-v "$(PWD)/$(BACKUP_DIR):/backups" \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) -f /backups/$(shell basename $(LATEST_BACKUP))
	@echo "$(GREEN)Database import completed!$(NC)"

load-specific: ## Load a specific dump file (usage: make load-specific DUMP_FILE=path/to/dump.sql)
	@if [ -z "$(DUMP_FILE)" ]; then \
		echo "$(RED)Please specify DUMP_FILE parameter$(NC)"; \
		echo "$(YELLOW)Usage: make load-specific DUMP_FILE=path/to/dump.sql$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(DUMP_FILE)" ]; then \
		echo "$(RED)Dump file not found: $(DUMP_FILE)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Loading $(DUMP_FILE) into local PostgreSQL...$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		dropdb -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) --if-exists $(LOCAL_DB_NAME)
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		createdb -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) $(LOCAL_DB_NAME)
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		-v "$(PWD):/workspace" \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) -f /workspace/$(DUMP_FILE)
	@echo "$(GREEN)Database import completed!$(NC)"

sync: ## Full sync: dump Neon database and load into local PostgreSQL
	@echo "$(GREEN)Starting full database sync...$(NC)"
	@$(MAKE) dump-neon
	@echo "$(YELLOW)Waiting 5 seconds before loading...$(NC)"
	@sleep 5
	@$(MAKE) load-dump
	@echo "$(GREEN)Full sync completed!$(NC)"

test-connection: ## Test connection to both local and Neon databases
	@echo "$(GREEN)Testing database connections...$(NC)"
	@echo "$(YELLOW)Testing local PostgreSQL connection...$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) -c "SELECT version();" || echo "$(RED)Local connection failed$(NC)"
	@echo "$(YELLOW)Testing Neon database connection...$(NC)"
	@docker run --rm postgres:17 psql "$(NEON_DB_URL)" -c "SELECT version();" || echo "$(RED)Neon connection failed$(NC)"
	@echo "$(GREEN)Connection tests completed$(NC)"

logs: ## Show PostgreSQL container logs
	@cd infra && docker compose logs -f db

restart: ## Restart local PostgreSQL
	@echo "$(YELLOW)Restarting local PostgreSQL...$(NC)"
	@$(MAKE) down
	@sleep 3
	@$(MAKE) up

clean: ## Clean up old backup files (keeps last 5)
	@echo "$(YELLOW)Cleaning up old backup files...$(NC)"
	@find $(BACKUP_DIR) -name "neondb_dump_*.sql" -type f | sort -r | tail -n +6 | xargs -r rm -f
	@echo "$(GREEN)Cleanup completed$(NC)"

clean-all: ## Remove all backup files and stop containers
	@echo "$(RED)Warning: This will remove all backup files and stop containers$(NC)"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		$(MAKE) down; \
		rm -rf $(BACKUP_DIR); \
		cd infra && docker compose down -v; \
		echo "$(GREEN)All cleanup completed$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled$(NC)"; \
	fi

# Quick commands
quick-sync: up sync ## Quick start: bring up local DB and sync with Neon

# Development helpers
psql-local: ## Connect to local PostgreSQL with psql
	@docker run --rm -it \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME)

psql-neon: ## Connect to Neon database with psql
	@docker run --rm -it postgres:17 psql "$(NEON_DB_URL)"

query-local: ## Run a SQL query on local database (usage: make query-local SQL="SELECT * FROM users LIMIT 5")
	@if [ -z "$(SQL)" ]; then \
		echo "$(RED)Please specify SQL parameter$(NC)"; \
		echo "$(YELLOW)Usage: make query-local SQL=\"SELECT * FROM users LIMIT 5\"$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Executing query on local database:$(NC)"
	@echo "$(YELLOW)$(SQL)$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) -c "$(SQL)"

list-tables: ## List all tables in local database
	@echo "$(GREEN)Listing all tables in local database:$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) \
		-c "SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

describe-table: ## Describe table structure (usage: make describe-table TABLE=users)
	@if [ -z "$(TABLE)" ]; then \
		echo "$(RED)Please specify TABLE parameter$(NC)"; \
		echo "$(YELLOW)Usage: make describe-table TABLE=users$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Describing table structure for: $(TABLE)$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) \
		-c "\\d+ $(TABLE)"

table-size: ## Show size of all tables in local database
	@echo "$(GREEN)Table sizes in local database:$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) \
		-c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

db-info: ## Show general database information
	@echo "$(GREEN)Database information:$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) \
		-c "SELECT version(); SELECT current_database(), current_user, inet_server_addr(), inet_server_port();"

count-records: ## Count records in a specific table (usage: make count-records TABLE=users)
	@if [ -z "$(TABLE)" ]; then \
		echo "$(RED)Please specify TABLE parameter$(NC)"; \
		echo "$(YELLOW)Usage: make count-records TABLE=users$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Counting records in table: $(TABLE)$(NC)"
	@docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) \
		-c "SELECT COUNT(*) as total_records FROM $(TABLE);"

sample-data: ## Show sample data from a table (usage: make sample-data TABLE=users LIMIT=10)
	@if [ -z "$(TABLE)" ]; then \
		echo "$(RED)Please specify TABLE parameter$(NC)"; \
		echo "$(YELLOW)Usage: make sample-data TABLE=users LIMIT=10$(NC)"; \
		exit 1; \
	fi
	@LIMIT_VALUE=$${LIMIT:-5}; \
	echo "$(GREEN)Sample data from table: $(TABLE) (limit: $$LIMIT_VALUE)$(NC)"; \
	docker run --rm \
		--network host \
		-e PGPASSWORD=$(LOCAL_DB_PASSWORD) \
		postgres:17 \
		psql -h $(LOCAL_DB_HOST) -p $(LOCAL_DB_PORT) -U $(LOCAL_DB_USER) -d $(LOCAL_DB_NAME) \
		-c "SELECT * FROM $(TABLE) LIMIT $$LIMIT_VALUE;"

# Show current configuration
show-config: ## Show current database configuration
	@echo "$(GREEN)Current Configuration:$(NC)"
	@echo "$(YELLOW)Local Database:$(NC)"
	@echo "  Host: $(LOCAL_DB_HOST):$(LOCAL_DB_PORT)"
	@echo "  Database: $(LOCAL_DB_NAME)"
	@echo "  User: $(LOCAL_DB_USER)"
	@echo ""
	@echo "$(YELLOW)Neon Database:$(NC)"
	@echo "  URL: $(shell echo '$(NEON_DB_URL)' | sed 's/:npg_[^@]*@/:***@/')"
	@echo ""
	@echo "$(YELLOW)Backup Directory:$(NC) $(BACKUP_DIR)"
	@if [ -f "$(LATEST_BACKUP)" ]; then \
		echo "$(YELLOW)Latest Backup:$(NC) $(LATEST_BACKUP) ($(shell ls -lh $(LATEST_BACKUP) | awk '{print $$5}'))"; \
	else \
		echo "$(YELLOW)Latest Backup:$(NC) No backup found"; \
	fi

test-queries: ## Test all database query commands with sample data
	@echo "$(GREEN)Running comprehensive database query tests...$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Database Info:$(NC)"
	@$(MAKE) db-info
	@echo ""
	@echo "$(YELLOW)2. List Tables:$(NC)"
	@$(MAKE) list-tables
	@echo ""
	@echo "$(YELLOW)3. Table Sizes:$(NC)"
	@$(MAKE) table-size
	@echo ""
	@echo "$(YELLOW)4. Count Properties:$(NC)"
	@$(MAKE) count-records TABLE=properties
	@echo ""
	@echo "$(YELLOW)5. Sample Property Types:$(NC)"
	@$(MAKE) sample-data TABLE=property_types LIMIT=3
	@echo ""
	@echo "$(YELLOW)6. Sample Properties:$(NC)"
	@$(MAKE) query-local SQL="SELECT id, title, price, city, type FROM properties LIMIT 3"
	@echo ""
	@echo "$(GREEN)All database query tests completed successfully!$(NC)"
