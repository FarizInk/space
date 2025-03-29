#!/bin/sh

# Add cron job to run upload.ts every hour
echo "0 * * * * cd /app/scripts && bun upload.ts >> /var/log/cron.log 2>&1" | crontab -

# Start the cron service
service cron start

# Start the HonoJS server
bun run start