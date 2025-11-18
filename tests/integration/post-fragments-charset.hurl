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
