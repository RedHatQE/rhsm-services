const http = require('http');
const WebSocket = require('ws');
const Rx = require('rxjs/Rx');
const wss = [
  new WebSocket('ws://localhost:9091/ws/testware/monitor'), // wss[0]
  new WebSocket('ws://localhost:9091/ws/testware/monitor'), // wss[1]
];

const wssOpenStream = wss.map((ws) => {
  return Rx.Observable.fromEvent(ws,'open').take(1);
});


Rx.Observable.fromEvent(wss[0],'message')
  .subscribe((x) => {
    console.log(x.data);
    let data = JSON.parse(x.data);
    console.log(`response from ws00 ${typeof data}, "${data.event}", "${data.msg}"`);
  });

Rx.Observable.fromEvent(wss[1],'message')
  .subscribe((x) => {
    let data = JSON.parse(x.data);
    console.log(`response from ws01 ${typeof data}, "${data.event}", "${data.msg}"`);
  });

const axios = require('axios');
//axios.post("http://localhost:9091/testing/message",{"msg":"hello world"});

// wait till all ws's are openned
Rx.Observable.forkJoin(...wssOpenStream)
  .subscribe((values) => {
    console.log("all websockets are up");

    // wss[3].send('/etc/rhsm/rhsm.conf'); // touch that file
    // setTimeout(()=> wss[4].send('unregister'), 10000);
    // setTimeout(() => wss[5].send('ping'),5000);
    // setTimeout(() => wss[4].send('register --username testuser1 --password password --org admin'),
    //            20000);
  });

