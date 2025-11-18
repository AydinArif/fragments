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
