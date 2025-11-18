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
