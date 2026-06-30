#!/bin/bash
# Quick check if worker is running and processing jobs
ps aux | grep "tsx.*index" | grep -v grep && echo "✅ Worker process is running" || echo "❌ Worker is not running"
