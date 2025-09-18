@echo off
echo ==========================================
echo 🌐 SmartChat CORS Test
echo ==========================================

echo 📋 Testing CORS configuration...
echo.

echo 1. Testing health endpoint without origin...
curl -X GET http://localhost:51213/api/v1 -H "Content-Type: application/json"

echo.
echo.
echo 2. Testing health endpoint with allowed origin...
curl -X GET http://localhost:51213/api/v1/health -H "Origin: http://localhost:3000" -H "Content-Type: application/json"

echo.
echo.
echo 3. Testing OPTIONS preflight request...
curl -X OPTIONS http://localhost:51213/api/v1/health -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type"

echo.
echo.
echo 4. Testing with Swagger UI origin...
curl -X GET http://localhost:51213/api/v1/health -H "Origin: http://localhost:51213" -H "Content-Type: application/json"

echo.
echo.
echo 5. Testing auth register endpoint...
curl -X POST http://localhost:51213/api/v1/auth/email/register -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"Test123456\"}"

echo.
echo.
echo ==========================================
echo ✅ CORS test completed!
echo ==========================================
echo.
echo 🌐 URLs to test in browser:
echo   - Swagger UI: http://localhost:51213/ambatukam
echo   - Health API: http://localhost:51213/api/v1
echo   - Detailed Health: http://localhost:51213/api/v1/health
echo   - Auth Register: http://localhost:51213/api/v1/auth/email/register
echo   - Users API: http://localhost:51213/api/v1/users
echo.
echo 📋 Route structure:
echo   - Global prefix: api
echo   - Versioning: v1
echo   - Final structure: /api/v1/controller/action
echo. 