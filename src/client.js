const WebSocket = require('ws');
const Rx = require('rxjs/Rx');
const wss = [
  new WebSocket('ws://localhost:9091/monitor/etc/rhsm/rhsm.conf'), // wss[0]
  new WebSocket('ws://localhost:9091/monitor/etc/rhsm/rhsm.conf'), // wss[1]
  new WebSocket('ws://localhost:9091/monitor/etc/rhsm/rhsm.conf'), // wss[2]
  new WebSocket('ws://localhost:9091/execute/usr/bin/touch'),      // wss[3]
  new WebSocket('ws://localhost:9091/execute/usr/bin/subscription-manager'), //wss[4]
  new WebSocket('ws://localhost:9091/rhsm/status'),         //wss[5]
  new WebSocket('ws://localhost:9091/rhsm/status'),         //wss[6]
  new WebSocket('ws://localhost:9091/dbus/com.redhat.SubscriptionManager/EntitlementStatus')         //wss[7]
];

const wssOpenStream = wss.map((ws) => {
  return Rx.Observable.fromEvent(ws,'open').take(1);
});


Rx.Observable.fromEvent(wss[0],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws00 ${typeof data}, "${data.event}", "${data.file}"`);
  });

Rx.Observable.fromEvent(wss[1],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws01 ${typeof data}, "${data.event}", "${data.file}"`);
  });

Rx.Observable.fromEvent(wss[2],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws02 ${typeof data}, "${data.event}", "${data.file}"`);
  });

Rx.Observable.fromEvent(wss[4],'message')
  .subscribe((ev) => {
    let data = JSON.parse(ev.data);
    console.log(`response for /usr/bin/subscription-manager ${ev.data}`);
  });

Rx.Observable.fromEvent(wss[5],'message')
  .subscribe((ev) => {
    let data = JSON.parse(ev.data);
    console.log(`response for 01 /rhsm/status "${JSON.stringify(data)}"`);
  });

Rx.Observable.fromEvent(wss[6],'message')
  .subscribe((ev) => {
    let data = JSON.parse(ev.data);
    console.log(`response for 02 /rhsm/status "${JSON.stringify(data)}"`);
  });

Rx.Observable.fromEvent(wss[7],'message')
  .subscribe((ev) => {
    let data = JSON.parse(ev.data);
    console.log(`response for dbus service "${JSON.stringify(data)}"`);
  });

// wait till all ws's are openned
Rx.Observable.forkJoin(...wssOpenStream)
  .subscribe((values) => {
    console.log("all websockets are up");
    wss[3].send('/etc/rhsm/rhsm.conf'); // touch that file
    setTimeout(()=> wss[4].send('unregister'), 10000);
    setTimeout(() => wss[5].send('ping'),5000);
    setTimeout(() => wss[4].send('register --username testuser1 --password password --org admin'),
               20000);
  });

