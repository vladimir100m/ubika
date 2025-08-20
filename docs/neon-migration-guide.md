# Neon Database Migration Guide

## Overview
This document outlines the migration from local PostgreSQL to Neon Database (serverless PostgreSQL) for the Ubika real estate application.

## What Changed

### 1. Database Configuration (`src/utils/db.ts`)
- **Before**: Used individual connection parameters (host, user, password, database, port)
- **After**: Uses connection string with SSL configuration for Neon
- **Key Changes**:
  - Connection pooling optimized for serverless environment
  - SSL configuration for secure Neon connections
  - Increased connection timeout for serverless cold starts
  - Added utility functions for connection testing and transactions

### 2. API Routes Updated
All API routes in `src/pages/api/` have been updated:
- `properties.ts` - Main property search and filtering
- `property-types.ts` - Property type management
- `neighborhoods.ts` - Neighborhood data
- `property-features.ts` - Property features
- `property-statuses.ts` - Property status management

**Changes Made**:
- Removed direct `pg.Client` instantiation
- Now uses centralized `query` function from `db.ts`
- Automatic connection management via connection pool
- No manual connection opening/closing required

### 3. Infrastructure Scripts Updated
All scripts in `infra/scripts/` have been updated:
- `setupAdvancedDatabase.js` - Creates advanced database schema
- `setupDatabase.js` - Initial data population
- `listProperties.js` - Property listing utility
- `populatePropertyFeatures.js` - Feature data population
- `deleteDatabase.js` - Modified for Neon (truncates tables instead of dropping database)
- `testConnection.js` - New script for testing Neon connectivity

### 4. Environment Variables
The `.env` file now uses Neon-specific variables:

```bash
# Primary Neon Database URL
DATABASE_URL=postgres://neondb_owner:npg_k57ZTioHCGpd@ep-purple-union-a4hnrrtg-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Alternative Neon URLs (for different use cases)
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_k57ZTioHCGpd@ep-purple-union-a4hnrrtg.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_k57ZTioHCGpd@ep-purple-union-a4hnrrtg-pooler.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

## Benefits of Neon Database

1. **Serverless**: Automatically scales to zero when not in use
2. **Branching**: Database branching for development/staging
3. **Point-in-time Recovery**: Built-in backup and recovery
4. **Global Edge**: Reduced latency with edge caching
5. **Cost Effective**: Pay only for what you use
6. **Vercel Integration**: Seamless deployment with Vercel

## Setup Instructions

### 1. Database Connection Test
```bash
node infra/scripts/testConnection.js
```

### 2. Complete Database Setup
```bash
./infra/scripts/setupNeonDatabase.sh
```

### 3. Manual Setup (if needed)
```bash
# 1. Test connection
node infra/scripts/testConnection.js

# 2. Create schema
node infra/scripts/setupAdvancedDatabase.js

# 3. Populate initial data
node infra/scripts/setupDatabase.js

# 4. Add property features
node infra/scripts/populatePropertyFeatures.js
```

## Database Schema

The application uses the following main tables:
- `properties` - Main property listings
- `property_types` - Property categories (apartment, house, etc.)
- `property_statuses` - Property statuses (available, sold, etc.)
- `property_features` - Available features (parking, pool, etc.)
- `property_feature_assignments` - Many-to-many relationship
- `neighborhoods` - Neighborhood information

## Performance Considerations

### Connection Pooling
- Maximum 20 concurrent connections
- 30-second idle timeout
- 10-second connection timeout (increased for serverless)

### Query Optimization
- All queries use parameterized statements
- Proper indexing on frequently queried columns
- Connection reuse via pooling

### Serverless Best Practices
- Connection pooling to handle cold starts
- SSL configuration for security
- Proper error handling for network issues

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if `DATABASE_URL` is correctly set
   - Verify SSL configuration
   - Ensure firewall allows HTTPS connections

2. **SSL Certificate Issues**
   - Verify `sslmode=require` in connection string
   - Check if `rejectUnauthorized: false` is set

3. **Query Errors**
   - Ensure tables exist by running setup scripts
   - Check parameter indexing in SQL queries
   - Verify data types match schema

### Debug Commands
```bash
# Test basic connectivity
node infra/scripts/testConnection.js

# List all properties (verify data)
node infra/scripts/listProperties.js

# Reset database (truncate all tables)
node infra/scripts/deleteDatabase.js
```

## Migration Checklist

- [x] Update database configuration in `src/utils/db.ts`
- [x] Migrate all API routes to use new connection method
- [x] Update infrastructure scripts for Neon compatibility
- [x] Create connection testing utility
- [x] Create automated setup script
- [x] Update documentation
- [x] Test database connectivity
- [ ] Run full application test
- [ ] Deploy to Vercel with Neon integration
- [ ] Performance testing

## Next Steps

1. **Testing**: Run comprehensive tests to ensure all functionality works
2. **Deployment**: Deploy to Vercel with Neon database
3. **Monitoring**: Set up monitoring for database performance
4. **Optimization**: Monitor and optimize queries based on usage patterns

## Support

For issues related to:
- **Neon Database**: Check [Neon Documentation](https://neon.tech/docs)
- **Application Code**: Review this migration guide and test locally
- **Deployment**: Refer to Vercel + Neon integration guides
