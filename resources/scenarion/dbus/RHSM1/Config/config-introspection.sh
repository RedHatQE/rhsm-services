#!/bin/bash
SCENARIO="$(basename $0)"
TIMESTAMP=$(date +%s)
MYDIR=$(mktemp -d "${TMPDIR:-/tmp/}$(basename $0).$TIMESTAMP.XXXX")
echo $MYDIR

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"start of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has started. Data are in a directory $MYDIR",
"time":"$(date -Ins)"}
EOF

busctl introspect com.redhat.RHSM1 /com/redhat/RHSM1/Config 2>&1 | tee $MYDIR/busctl-introspect.out

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"busctl instrospect run",
"args":"config --list",
"time":"$(date -Ins)"}
EOF

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"end of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has finished",
"time":"$(date -Ins)"}
EOF
