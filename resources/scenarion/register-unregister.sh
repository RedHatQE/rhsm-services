#!/bin/bash
curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"start of scenario",
"scenario":"register-unregister.sh",
"msg":"a scenario register-unregister.sh has started",
"time":"$(date -Ins)"}
EOF

subscription-manager unregister
subscription-manager register --username testuser1 --password password --org admin

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"end of scenario",
"scenario":"register-unregister.sh",
"msg":"a scenario register-unregister.sh has finished",
"time":"$(date -Ins)"}
EOF
