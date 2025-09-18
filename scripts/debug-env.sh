#!/bin/bash

echo "🔍 COMPREHENSIVE Environment Variables Debug"
echo "================================================"

echo ""
echo "📋 NODE ENVIRONMENT:"
echo "NODE_ENV: ${NODE_ENV:-'❌ Not set'}"
echo "PORT: ${PORT:-'❌ Not set'}"
echo "PWD: ${PWD:-'❌ Not set'}"

echo ""
echo "🗄️ DATABASE CONFIGURATION:"
echo "DATABASE_URL: ${DATABASE_URL:-'❌ Not set'}"
echo "DATABASE_HOST: ${DATABASE_HOST:-'❌ Not set'}"
echo "DATABASE_PORT: ${DATABASE_PORT:-'❌ Not set'}"
echo "DATABASE_USERNAME: ${DATABASE_USERNAME:-'❌ Not set'}"
echo "DATABASE_PASSWORD: ${DATABASE_PASSWORD:+'✅ Set'}"
echo "DATABASE_NAME: ${DATABASE_NAME:-'❌ Not set'}"

if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL (masked): ${DATABASE_URL/\/\/.*:.*@/\/\/***:***@}"
fi

echo ""
echo "🔴 REDIS CONFIGURATION:"
echo "REDIS_HOST: ${REDIS_HOST:-'❌ Not set'}"
echo "REDIS_PORT: ${REDIS_PORT:-'❌ Not set'}"
echo "REDIS_PASSWORD: ${REDIS_PASSWORD:+'✅ Set'}"
echo "REDIS_DB: ${REDIS_DB:-'❌ Not set (defaulting to 0)'}"

echo ""
echo "🔐 AUTH CONFIGURATION:"
echo "AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:+'✅ Set'}"
echo "AUTH_REFRESH_SECRET: ${AUTH_REFRESH_SECRET:+'✅ Set'}"
echo "AUTH_FORGOT_SECRET: ${AUTH_FORGOT_SECRET:+'✅ Set'}"
echo "AUTH_CONFIRM_EMAIL_SECRET: ${AUTH_CONFIRM_EMAIL_SECRET:+'✅ Set'}"

echo ""
echo "📧 MAIL CONFIGURATION:"
echo "MAIL_HOST: ${MAIL_HOST:-'❌ Not set'}"
echo "MAIL_PORT: ${MAIL_PORT:-'❌ Not set'}"
echo "MAIL_USER: ${MAIL_USER:-'❌ Not set'}"
echo "MAIL_PASSWORD: ${MAIL_PASSWORD:+'✅ Set'}"

echo ""
echo "🌐 OTHER CONFIGURATION:"
echo "ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-'❌ Not set'}"
echo "APP_HOST: ${APP_HOST:-'❌ Not set'}"

echo ""
echo "🔍 ALL ENV VARS (for debugging):"
echo "Total environment variables: $(env | wc -l)"

echo ""
echo "📊 ENV VARS containing 'DATABASE':"
env | grep -i database || echo "No DATABASE env vars found"

echo ""
echo "📊 ENV VARS containing 'REDIS':"
env | grep -i redis || echo "No REDIS env vars found"

echo ""
echo "📊 ENV VARS containing 'RENDER':"
env | grep -i render || echo "No RENDER env vars found" 