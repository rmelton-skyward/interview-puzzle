# Sample Application for DevOps Challenge

This is a simple Python Flask application provided for the DevOps challenge. You can use this application as-is for your infrastructure deployment, or create your own.

## What This App Does

- Serves a web page showing deployment information
- Connects to a SQLite database
- Records deployments in the database
- Provides a health check API endpoint
- Reads configuration from environment variables

## Environment Variables

- `ENVIRONMENT` - Environment name (dev/staging/prod)
- `PORT` - Port to run on (default: 8080)
- `DB_PATH` - Path to SQLite database file (default: /tmp/devops-challenge.db)
- `CLOUD_PROVIDER` - Your cloud provider name (for display)
- `CLOUD_REGION` - Your cloud region (for display)

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Or with environment variables
ENVIRONMENT=dev PORT=8080 python app.py
```

The app will be available at http://localhost:8080

## Endpoints

- `/` - Main page with deployment info
- `/api/health` - JSON health check endpoint

## Using This for Your Challenge

You have two options:

### Option 1: Use this app as-is
- Deploy this Python application with your IaC
- Configure environment variables via your IaC
- The database requirement is satisfied (uses SQLite)

### Option 2: Create your own app
- Write a simple app in any language (Node.js, Go, etc.)
- Must show deployment info (environment, timestamp, etc.)
- Must connect to a database (even just a simple read/write)

## Requirements Satisfied

This app satisfies the DevOps challenge requirements:
- ✅ Web application that runs on a server
- ✅ Connects to a database (SQLite)
- ✅ Shows deployment information
- ✅ Can be configured via environment variables
- ✅ Has a health check endpoint

## Notes

- SQLite is used for simplicity - you can deploy this on a single server without needing a separate database instance
- For more advanced setups, you could modify this to connect to PostgreSQL, MySQL, etc.
- The focus should be on your infrastructure code, not this application
