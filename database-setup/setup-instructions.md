# Supabase Advanced Configuration Setup Instructions

## Step 1: Update Database Password

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `gkwzdnzwpfpkvgpcbeeq`
3. Go to Settings → Database
4. Copy your database password
5. Update the `.env` file by replacing `YOUR_DB_PASSWORD` with your actual password

## Step 2: Run the Advanced Configuration

1. In your Supabase dashboard, go to the SQL Editor
2. Create a new query
3. Copy and paste the entire contents of `01-supabase-advanced-config.sql`
4. Click "Run" to execute the configuration

## Step 3: Verify the Setup

After running the configuration, execute this validation query in the SQL Editor:

```sql
SELECT * FROM validate_supabase_setup();
```

You should see output like:
```
component          | status | details
Extensions         | OK     | Required extensions: uuid-ossp, pgcrypto, vector, pg_trgm, btree_gin, pg_stat_statements
Row Level Security | OK     | Global RLS setting: on
Custom Roles       | OK     | Custom roles created: 4
Audit System       | OK     | Audit log table status
```

## Step 4: Test Database Connection

Run this command to test the connection:

```bash
node test-db-connection.js
```

## What This Configuration Provides

### 🔒 **Security Features**
- Row Level Security (RLS) enabled globally
- Custom roles for different access levels
- Comprehensive audit logging
- Cultural data protection functions
- IP-based access controls

### ⚡ **Performance Optimizations**
- Optimized PostgreSQL settings for document processing
- Connection pooling configuration
- Query performance monitoring
- Automatic statistics updates

### 🛡️ **Data Protection**
- Cultural sensitivity access controls
- Audit trails for all data access
- Backup integrity validation
- Automated maintenance tasks

### 📊 **Monitoring & Analytics**
- Performance metrics collection
- Slow query logging
- Database health monitoring
- Scheduled maintenance tasks

### 🌍 **Indigenous Data Sovereignty**
- Community-based data ownership
- Cultural sensitivity levels (public, community, restricted, sacred)
- CARE+ principles implementation
- Community-controlled access policies

## Next Steps

Once this configuration is complete, you'll be ready to:

1. Create the community management tables
2. Implement user management with cultural protocols
3. Build the scalable document storage system
4. Add AI analysis capabilities
5. Implement real-time collaboration features

## Troubleshooting

### If Extensions Fail to Install
Some extensions may require superuser privileges. Contact Supabase support or:
1. Try installing them one by one
2. Check the Supabase dashboard Extensions tab
3. Enable them through the UI if SQL installation fails

### If Performance Settings Don't Apply
Some settings require a database restart:
1. Contact Supabase support for system-level changes
2. Focus on application-level optimizations
3. Use connection pooling and query optimization

### If Scheduled Tasks Don't Work
pg_cron may not be available on all Supabase plans:
1. Implement scheduled tasks in your application
2. Use Supabase Edge Functions for periodic tasks
3. Set up external cron jobs if needed

## Security Notes

- Never commit database passwords to version control
- Use environment variables for all sensitive configuration
- Regularly rotate database passwords
- Monitor audit logs for suspicious activity
- Test backup and recovery procedures regularly

This advanced configuration provides a world-class foundation for your Indigenous research platform with proper data sovereignty, security, and performance optimization.