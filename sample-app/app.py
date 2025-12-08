#!/usr/bin/env python3
"""
Simple web application for DevOps challenge.
Displays environment info and connects to a database.
"""
import os
import sqlite3
from datetime import datetime
from flask import Flask, jsonify

app = Flask(__name__)

# Configuration from environment variables
ENV = os.getenv('ENVIRONMENT', 'dev')
DB_PATH = os.getenv('DB_PATH', '/tmp/devops-challenge.db')


def init_db():
    """Initialize the database with a simple table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS deployments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            environment TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def record_deployment():
    """Record this deployment in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO deployments (timestamp, environment) VALUES (?, ?)',
        (datetime.utcnow().isoformat(), ENV)
    )
    conn.commit()
    conn.close()


@app.route('/')
def home():
    """Main page with deployment information."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>DevOps Challenge - {ENV}</title>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }}
            h1 {{ color: #333; }}
            .info {{ background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 10px 0; }}
            .success {{ color: green; }}
        </style>
    </head>
    <body>
        <h1>DevOps Challenge Application</h1>
        <div class="info">
            <strong>Environment:</strong> {ENV}<br>
            <strong>Deployment Time:</strong> {datetime.utcnow().isoformat()}<br>
            <strong>Cloud Provider:</strong> {os.getenv('CLOUD_PROVIDER', 'Not specified')}<br>
            <strong>Region:</strong> {os.getenv('CLOUD_REGION', 'Not specified')}
        </div>
        <p class="success">✓ Database connection successful</p>
        <p>For API endpoint, visit: <a href="/api/health">/api/health</a></p>
    </body>
    </html>
    """


@app.route('/api/health')
def health():
    """Health check endpoint with database verification."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM deployments')
        count = cursor.fetchone()[0]
        conn.close()

        return jsonify({
            'status': 'healthy',
            'environment': ENV,
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'deployment_count': count
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    init_db()
    record_deployment()
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
