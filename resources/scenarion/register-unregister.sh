#!/bin/bash
SCENARIO="$(basename $0)"
TIMESTAMP=$(date -Isec)
MYDIR=$(mktemp -d "${TMPDIR:-/tmp/}$(basename $0).$TIMESTAMP.XXXX")
echo $MYDIR

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"start of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has started. Data are in a directory $MYDIR",
"time":"$(date -Ins)"}
EOF

subscription-manager unregister 2> $MYDIR/sub-man-unregister.stderr 1>$MYDIR/sub-man-unregister.stdout

(python - <<EOF
import json
with open("$MYDIR/sub-man-unregister.stdout") as rstdout:
  with open("$MYDIR/sub-man-unregister.stderr") as rstderr:
    data={"event":"subscription-manager run",
          "args":"register",
	        "stderr":rstderr.read(),
	        "stdout":rstdout.read(),
	        "time":"$(date -Ins)"}
    print(json.dumps(data,ensure_ascii=False))
EOF
) | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message

sleep 1

subscription-manager register --username testuser1 --password password --org admin 2> $MYDIR/sub-man-register.stderr 1> $MYDIR/sub-man-register.stdout

(python - <<EOF
import json
with open("$MYDIR/sub-man-register.stdout") as rstdout:
  with open("$MYDIR/sub-man-register.stderr") as rstderr:
    data={"event":"subscription-manager run",
          "args":"register --username testuser1 --password password --org admin",
	        "stderr":rstderr.read(),
	        "stdout":rstdout.read(),
	        "time":"$(date -Ins)"}
    print(json.dumps(data,ensure_ascii=False))
EOF
) | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"end of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has finished",
"time":"$(date -Ins)"}
EOF
