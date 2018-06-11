#!/bin/bash
SCENARIO="$(basename $0)"
TIMESTAMP=$(date -Isec)
MYDIR=$(mktemp -d "${TMPDIR:-/tmp/}$(basename $0).$TIMESTAMP.XXXX")
echo $MYDIR

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"type":"start of scenario",
"scenario":"$SCENARIO",
"scenario_id":"$TIMESTAMP",
"msg":"a scenario $SCENARIO has started. Data are in a directory $MYDIR",
"time":"$(date -Ins)"}
EOF

busctl tree com.redhat.RHSM1 2> $MYDIR/busctl-tree.stderr 1> $MYDIR/busctl-tree.stdout

(python - <<EOF
import json
with open("$MYDIR/busctl-tree.stdout") as rstdout:
  with open("$MYDIR/busctl-tree.stderr") as rstderr:
    data={"type":"shell command",
	  "command":"busctl",
	  "args":"tree com.redhat.RHSM1",
	  "stderr":rstderr.read(),
	  "stdout":rstdout.read(),
	  "time":"$(date -Ins)"}
    print(json.dumps(data,ensure_ascii=False))
EOF
) | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"type":"end of scenario",
"scenario":"$SCENARIO",
"scenario_id":"$TIMESTAMP",
"msg":"a scenario $SCENARIO has finished",
"time":"$(date -Ins)"}
EOF
