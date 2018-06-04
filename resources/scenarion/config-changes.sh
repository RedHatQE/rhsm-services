#!/bin/bash
SCENARIO="config-changes.sh"
TIMESTAMP=$(date +%s)
MYDIR=$(mktemp -d "${TMPDIR:-/tmp/}$(basename $0).$TIMESTAMP.XXXX")
echo $MYDIR
exit 0

cp /etc/rhsm/rhsm.conf $MYDIR

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"start of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has started. $TIMESTAMP Data are in a directory $MYDIR",
"time":"$(date -Ins)"}
EOF

sed -i "s/^hostname[ \t]*=[ \t].*$/hostname = $TIMESTAMP.subscription.rhsm.stage.redhat.com/" /etc/rhsm/rhsm.conf;

subscription-manager config --list 2>&1 | tee $TMPDIR/sub-man-config.$TIMESTAMP.01.out

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"subscription-manager run",
"args":"config --list",
"time":"$(date -Ins)"}
EOF


cp $MYDIR/rhsm.conf /etc/rhsm/rhsm.conf
curl -X POST -H "Content-Type: application/json" -d @- http://localhost:9091/testing/message <<EOF
{"event":"end of scenario",
"scenario":"$SCENARIO",
"msg":"a scenario $SCENARIO has finished",
"time":"$(date -Ins)"}
EOF
