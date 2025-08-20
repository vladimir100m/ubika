# Database Management Guide

This guide explains how to use the Makefile to manage your local PostgreSQL database and sync it with your Neon database.

## Prerequisites

Before using the Makefile commands, ensure you have the following installed:
- Docker and Docker Compose
- PostgreSQL client tools (`psql`, `pg_dump`)
- Make utility

### Installing PostgreSQL Client Tools

**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

## Quick Start

### 1. Full Database Sync (Recommended)
```bash
make quick-sync
```
This command will:
- Start the local PostgreSQL container
- Dump the Neon database
- Load the dump into your local database

### 2. Step by Step Process
```bash
# Start local PostgreSQL
make up

# Dump Neon database
make dump-neon

# Load dump into local database
make load-dump
```

## Available Commands

Run `make help` to see all available commands:

```bash
make help
```

### Main Commands

| Command | Description |
|---------|-------------|
| `make up` | Start local PostgreSQL with Docker Compose |
| `make down` | Stop local PostgreSQL |
| `make dump-neon` | Dump Neon database to local file |
| `make load-dump` | Load the latest dump into local PostgreSQL |
| `make sync` | Full sync: dump Neon and load into local |
| `make quick-sync` | Quick start: bring up local DB and sync with Neon |

### Utility Commands

| Command | Description |
|---------|-------------|
| `make status` | Check status of local PostgreSQL |
| `make logs` | Show PostgreSQL container logs |
| `make restart` | Restart local PostgreSQL |
| `make test-connection` | Test connection to both databases |
| `make psql-local` | Connect to local PostgreSQL with psql |
| `make psql-neon` | Connect to Neon database with psql |
| `make show-config` | Show current database configuration |

### Cleanup Commands

| Command | Description |
|---------|-------------|
| `make clean` | Clean up old backup files (keeps last 5) |
| `make clean-all` | Remove all backup files and stop containers |

## Using Local Database in Your Application

### Option 1: Environment File Override
Create a `.env.local` file based on the template:
```bash
cp .env.local.template .env.local
```

Then uncomment the local database variables in `.env.local` to override the Neon database settings.

### Option 2: Modify .env Directly
Temporarily comment out the Neon database variables and uncomment the local ones:

```bash
# Comment out Neon database
# DATABASE_URL=postgres://neondb_owner:...

# Uncomment local database
DATABASE_URL=postgres://admin:admin@localhost:5432/ubika
```

## Backup Management

- Backups are stored in the `backups/` directory
- Each backup is timestamped: `neondb_dump_YYYYMMDD_HHMMSS.sql`
- Latest backup is always available as `backups/neondb_latest.sql`
- Old backups are automatically cleaned up (keeps last 5) with `make clean`

## Troubleshooting

### Connection Issues
1. Check if Docker is running: `docker ps`
2. Check if PostgreSQL container is running: `make status`
3. Test connections: `make test-connection`

### Permission Issues
```bash
# Fix script permissions
chmod +x infra/scripts/init-user-db.sh
```

### Port Conflicts
If port 5432 is already in use:
1. Stop other PostgreSQL services
2. Or modify the port in `infra/docker-compose.yml`

### Dump/Load Issues
- Ensure you have PostgreSQL client tools installed
- Check network connectivity to Neon database
- Verify credentials in `.env` file

## Examples

### Daily Development Workflow
```bash
# Start development
make up

# Sync with latest production data
make dump-neon
make load-dump

# During development, connect to local database
make psql-local

# At end of day
make down
```

### Loading a Specific Backup
```bash
make load-specific DUMP_FILE=backups/neondb_dump_20241201_143022.sql
```

### Checking Database Status
```bash
make show-config
make status
make test-connection
```

## Database Connection Details

### Local PostgreSQL
- **Host:** localhost
- **Port:** 5432
- **Database:** ubika
- **Username:** admin
- **Password:** admin

### Neon Database
- Connection details are loaded from your `.env` file
- Uses the `DATABASE_URL` or `POSTGRES_URL` variables

## Security Notes

- Local database uses simple credentials for development
- Neon database credentials are stored in `.env` file
- Never commit database credentials to version control
- Use `.env.local` for local overrides (it's gitignored)
