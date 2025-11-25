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
