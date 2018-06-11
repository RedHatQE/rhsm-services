#!/bin/bash
SCENARIO="$(basename $0)"
TIMESTAMP=$(date -Isec)
MYDIR=$(mktemp -d "${TMPDIR:-/tmp/}$(basename $0).$TIMESTAMP.XXXX")
echo $MYDIR

cp /etc/rhsm/rhsm.conf $MYDIR

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"start of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has started. $TIMESTAMP Data are in a directory $MYDIR",
"time":"$(date -Ins)"}
EOF

sed -i "s/^hostname[ \t]*=[ \t].*$/hostname = $TIMESTAMP.subscription.rhsm.stage.redhat.com/" /etc/rhsm/rhsm.conf 2> $MYDIR/sed.01.stderr 1> $MYDIR/sed.01.stdout

(python - <<EOF
import json
with open("$MYDIR/sed.01.stdout") as rstdout:
  with open("$MYDIR/sed.01.stderr") as rstderr:
    data={"event":"sed run",
          "args":"/etc/rhsm/rhsm.conf",
	        "stderr":rstderr.read(),
	        "stdout":rstdout.read(),
	        "time":"$(date -Ins)"}
    print(json.dumps(data,ensure_ascii=False))
EOF
) | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message

subscription-manager config --list 2> $MYDIR/sub-man-config.stderr 1> $MYDIR/sub-man-config.stdout
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

cp $MYDIR/rhsm.conf /etc/rhsm/rhsm.conf

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"end of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has finished",
"time":"$(date -Ins)"}
EOF
