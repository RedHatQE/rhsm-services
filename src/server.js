const WebSocket = require('ws');
const fs = require('fs');
const { exec } = require ('child_process');
const env = require('env2')('.env');
const wss = new WebSocket.Server({port: 9091});

import { Observable, pipe } from 'rxjs/Rx';
import { filter, map, flatMap, scan, zip, withLatestFrom, combineLatest } from 'rxjs/operators';
import { merge } from 'rxjs/observable/merge';
import { monitorFile } from './services/monitor/file.js';
import { rhsmStatus } from './services/rhsm/status.js';
import { executeBinary } from './services/execute/binary.js';
//import { dbusService } from './services/dbus/service.js';

// Observable streams accepts just one argument. 'connection' event provides two arguments. There is a pre-processing function to merge the args into an array
var connectionsStream = Observable.fromEvent(wss,'connection', null, (ws,req) => [ws,req]).share();

let fileMonitor$ = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/monitor\/.+/)),
  flatMap(monitorFile('monitor'))
);

let executeBinary$ = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/execute\/.*/)),
  flatMap(executeBinary('execute'))
);

let rhsmStatus$ = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/rhsm\/status/)),
  flatMap(rhsmStatus)
);

// let rhsmStatusWebsockets = rhsmStatusConnections.scan (
//   (acc, [ws,req]) => {
//     acc.push([ws,req]);
//     return acc;
//   }, []);

// let statusWhenSubscriptionManagerIsExecuted = executeBinaryStream.pipe(
//   filter(([ws,req,msg]) => req.url.includes('/usr/bin/subscription-manager')),
//   map((x) => { console.log('great! subscription-manager has been executed'); return x; }),
//   withLatestFrom(rhsmStatusWebsockets), // once a binary execution appears, takes a list of rhsm status websockets
//   flatMap(([[ws,req,msg],wss]) => {
//     return getRhsmStatus().flatMap((status) => { return Observable.from(wss.map(([ws,req]) => { return [ws,req,status];}));});
//   })
// );
// statusWhenSubscriptionManagerIsExecuted.subscribe(([ws,req,msg]) => {
//   console.log('aa');
//   console.log(req.headers['sec-websocket-key']);
// });

// let dbusServiceStream = connectionsStream.pipe(
//   filter(([ws,req]) => req.url.match(/^\/dbus\/.*/)),
//   flatMap(dbusService('com.redhat.SubscriptionManager','/EntitlementStatus'))
// ).share();

merge(fileMonitor$,
      rhsmStatus$,
      executeBinary$
     ).filter(([ws,req,msg]) => { let isOpen = ws.readyState === WebSocket.OPEN;
                                  console.log(`is a socket open? ${isOpen}`);
                                  if (!isOpen) {
                                    console.log(`a socket is not openned, skip it. ${req}, ${msg}`);
                                  };
                                  return isOpen;})
  .subscribe(
    ([ws,req,msg]) =>{ console.log(msg);
                       ws.send(JSON.stringify(msg));},
    (err) => {console.log('error: %s', err);},
    () => {console.log('completed');}
  );
