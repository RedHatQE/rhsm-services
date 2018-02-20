const WebSocket = require('ws');
const Rx = require('rxjs/Rx');
const ws = new WebSocket('ws://localhost:9091/');

Rx.Observable.fromEvent(ws,'open')
    .subscribe((x) => { console.log("connection established") });

Rx.Observable.fromEvent(ws,'message')
    .subscribe((x) => { console.log(x.data)});
