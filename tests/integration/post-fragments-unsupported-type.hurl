# Try POST with unsupported content type
POST http://localhost:8080/v1/fragments
Content-Type: application/x-randomtype

[BasicAuth]
user1@email.com:password1

`random data`

HTTP/1.1 415
