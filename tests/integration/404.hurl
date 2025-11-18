# 404 Test - Unknown Route Should Return Not Found
GET http://localhost:8080/no-such-route

# Expect an HTTP 404 response
HTTP/1.1 404
