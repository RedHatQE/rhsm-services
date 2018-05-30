const WebSocket = require('ws');
const fs = require('fs');
const env = require('env2')('.env');
const express = require('express');
const http = require('http');

import { Observable, pipe } from 'rxjs/Rx';
import { filter, map, flatMap, scan, zip, withLatestFrom, catchError, combineLatest } from 'rxjs/operators';
import { merge } from 'rxjs/observable/merge';
import { monitorFile } from './services/monitor/file.js';
import { rhsmStatus } from './services/rhsm/status.js';
import { executeBinary } from './services/execute/binary.js';
import { runScenario } from './services/testing/scenarion.js';
//import { dbusService } from './services/dbus/service.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
//const wss = new WebSocket.Server({port: 9091});

app.post('/run/testing/scenario',runScenario);

// Observable streams accepts just one argument. 'connection' event provides two arguments. There is a pre-processing function to merge the args into an array
var connectionsStream = Observable.fromEvent(wss,'connection', null, (ws,req) => [ws,req]).share();

let fileMonitor$ = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/ws\/monitor\/.+/)),
  flatMap(monitorFile('ws/monitor')),
  catchError((error,caught) => {
    console.log(error);
    return Observable.of([null,null,""]);
  })
);

let executeBinary$ = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/ws\/execute\/.*/)),
  flatMap(executeBinary('ws/execute')),
  catchError((error,caught) => {
    console.log(error);
    return Observable.of([null,null,""]);
  })
);

let rhsmStatus$ = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/ws\/rhsm\/status/)),
  flatMap(rhsmStatus),
  catchError((error,caught) => {
    console.log(error);
    return Observable.of([null,null,""]);
  })
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

let socketError$ = connectionsStream.pipe(
  flatMap(([ws,req]) => Observable.fromEvent(ws,'error')
	        .map((ev) => { let msg = `error from ws: ${ev.error}`;
                          //console.log(ev);
			                    console.log(msg);
			                    return [ws,req,msg]; })
         )
);

merge(socketError$,
      fileMonitor$,
      rhsmStatus$,
      executeBinary$
     ).filter(([ws,req,msg]) => { let isOpen = ws && (ws.readyState === WebSocket.OPEN);
                                  console.log(`is a socket open? ${isOpen}`);
                                  if (!isOpen) {
                                    console.log(`a socket is not openned, skip it. ${req}, ${msg}`);
                                  };
                                  return isOpen;})
  .subscribe(
    ([ws,req,msg]) =>{ //console.log(msg);
                       ws.send(JSON.stringify(msg));},
    (err) => {console.log('error happened: %s', err);},
    () => {console.log('completed');}
  );

server.listen(process.env.PORT || 9091, () => {
  console.log(`Server started on port ${server.address().port}`);
});
