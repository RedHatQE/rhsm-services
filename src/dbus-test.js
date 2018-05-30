const WebSocket = require('ws');
const Rx = require('rxjs/Rx');
const wss = [
  new WebSocket('ws://localhost:9091/monitor/etc/rhsm/rhsm.conf'), // wss[0]
  new WebSocket('ws://localhost:9091/execute/usr/bin/subscription-manager'), //wss[1]
  new WebSocket('ws://localhost:9091/rhsm/status'),         //wss[2]
  //new WebSocket('ws://localhost:9091/dbus/com.redhat.SubscriptionManager/EntitlementStatus')         //wss[3]
];

const wssOpenStream = wss.map((ws) => {
  return Rx.Observable.fromEvent(ws,'open').take(1);
});


Rx.Observable.fromEvent(wss[0],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws00 "${data.event}", "${data.file}"`);
  });

Rx.Observable.fromEvent(wss[1],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws01 ${data.command} "${data.args}", "${data.stdout}"`);
  });

Rx.Observable.fromEvent(wss[2],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws02 "${data.time}", "${data.entitlementStatus}", "${data.overallStatus}"`);
  });

// Rx.Observable.fromEvent(wss[3],'message')
//   .subscribe((x) => {
//     let data = JSON.parse(x.data);
//     console.log(`response from ws02 ${typeof data}, "${data.event}", "${data.file}"`);
//   });

// wait till all ws's are openned
Rx.Observable.forkJoin(...wssOpenStream)
  .subscribe((values) => {
    console.log("all websockets are up");
    //wss[3].send('/etc/rhsm/rhsm.conf'); // touch that file
    //wss[4].send('unregister');
    wss[1].send('register --username testuser1 --password password --org admin');
  });

