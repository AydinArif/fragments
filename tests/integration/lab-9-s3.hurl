# Combined integration tests
# This file concatenates all other tests in `tests/integration/*.hurl`

# 404 Test - Unknown Route Should Return Not Found
GET http://localhost:8080/no-such-route

# Expect an HTTP 404 response
HTTP/1.1 404

# Health Check Test
GET http://localhost:8080

# We should get back an HTTP 1.1 200 response
HTTP/1.1 200
# We should get back a non-cacheable response (cache-control header)
Cache-Control: no-cache

# Extra checks to perform against the response
[Asserts]
# We expect to get back a JSON response with { "status": "ok", ... }
jsonpath "$.status" == "ok"
# We expect to get back a JSON response with { ..., "author": "..." }
jsonpath "$.author" isString
# We expect to get back a JSON response with { ..., "githubUrl": "..." }
jsonpath "$.githubUrl" matches /^https:\/\/github.com\/.+/
# We expect to get back a JSON response with { ..., "version": "x.y.z" }
jsonpath "$.version" matches /^\d+\.\d+\.\d+$/

# tests/integration/post-fragments.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`This is a fragment!`

# Expect 201 Created
HTTP/1.1 201

[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"

# UUID format for fragment id
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

# Your server returns the email directly
jsonpath "$.fragment.ownerId" == "user1@email.com"

jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# Server stores type as "text/plain"
jsonpath "$.fragment.type" == "text/plain"

# Size of "This is a fragment!"
jsonpath "$.fragment.size" == 19

# Capture the Location header URL
[Captures]
url: header "Location"

# ---------------------------------------------
# GET the fragment we just created
# ---------------------------------------------
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
# GET responses include charset=utf-8, so accept both
header "Content-Type" matches "^text/plain(; charset=utf-8)?$"

# Body should match exactly
body == "This is a fragment!"

# POST without authentication
POST http://localhost:8080/v1/fragments
Content-Type: text/plain

`No auth here`

HTTP/1.1 401

# POST with charset parameter
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8

[BasicAuth]
user1@email.com:password1

`Hello charset!`

HTTP/1.1 201

[Asserts]
# Server stores only "text/plain"
jsonpath "$.fragment.type" == "text/plain"

[Captures]
url: header "Location"

# GET the fragment
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
# Now header checks must be inside Asserts
header "Content-Type" matches "^text/plain(; charset=utf-8)?$"
body == "Hello charset!"

POST http://localhost:8080/v1/fragments
Content-Type: application/json

[BasicAuth]
user1@email.com:password1

`{"name":"Aydin","role":"dev"}`

HTTP/1.1 201

[Asserts]
jsonpath "$.fragment.type" == "application/json"

[Captures]
url: header "Location"

GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
header "Content-Type" matches "^application/json(; charset=utf-8)?$"
jsonpath "$.name" == "Aydin"
jsonpath "$.role" == "dev"


# -----------------------------
# File: post-fragments-unsupported-type.hurl
# -----------------------------
# Try POST with unsupported content type
POST http://localhost:8080/v1/fragments
Content-Type: application/x-randomtype

[BasicAuth]
user1@email.com:password1

`random data`

HTTP/1.1 415

# S3 Integration Test
# -------------------------------------------------------------
# 1. POST a new fragment as an authorized user
# -------------------------------------------------------------
POST http://localhost:8080/v1/fragments
Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Hello S3!`

# Expect 201 Created
HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"

# Capture Location header for later GET + DELETE steps
[Captures]
url: header "Location"

# -------------------------------------------------------------
# 2. GET the fragment we just created
# -------------------------------------------------------------
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
header "Content-Type" matches "^text/plain(; charset=utf-8)?$"
body == "Hello S3!"

# -------------------------------------------------------------
# 3. DELETE the fragment
# -------------------------------------------------------------
DELETE {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"

# -------------------------------------------------------------
# 4. Try getting the fragment again (should be gone)
# -------------------------------------------------------------
GET {{url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
