const WebSocket = require('ws');
const fs = require('fs');
const env = require('env2')('.env');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const util = require('util');

import { Observable, pipe, Subject } from 'rxjs/Rx';
import { filter, map, flatMap, scan, zip, withLatestFrom, catchError, combineLatest } from 'rxjs/operators';
import { merge } from 'rxjs/observable/merge';
import { monitorFile } from './services/monitor/file.js';
import { rhsmStatus } from './services/rhsm/status.js';
import { executeBinary } from './services/execute/binary.js';
import { runScenario } from './services/testing/scenarion.js';
import { sendMessage } from './services/testing/message.js';
import { dbusSystemMonitor } from './services/dbus/monitor.js';

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

app.post('/testing/run/scenario', runScenario(process.env.SCENARION_DIR));

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

// -------------------------------------------------------------------------
// system dbus monitor

let connectionsForDBusSystemMonitor = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/ws\/dbus\/system\/monitor/)),
  scan((acc,curr) => {
    let opennedConnections = acc.concat([curr]).filter(([ws,req]) => {
      let isOpen = ws && (ws.readyState === WebSocket.OPEN);
      return isOpen;});
    return opennedConnections;
  },[])
).share();

let dbusSystemMonitor$ = dbusSystemMonitor();

let broadcastOfDbusSystemMonitor$ = dbusSystemMonitor$.pipe(
  withLatestFrom(connectionsForDBusSystemMonitor),
  flatMap(([msg,connections]) => {
    return Observable.from(connections.map(([ws,req]) => [ws,req,msg]));
  }),
  catchError((error,caught) => {
    console.log(error);
    return Observable.of([null,null,""]);
  })
);

// -----------------------------------------------------------------------
// testware monitor
// it is used for sending messages from an application
let testingSignals$ = new Subject();
app.post('/testing/message', sendMessage(testingSignals$));

let connectionsForTestingSignals = connectionsStream.pipe(
  filter(([ws,req]) => req.url.match(/^\/ws\/testware\/monitor/)),
  scan((acc,curr) => {
    let opennedConnections = acc.concat([curr]).filter(([ws,req]) => {
      let isOpen = ws && (ws.readyState === WebSocket.OPEN);
      return isOpen;});
    return opennedConnections;
  },[])
).share();

let broadcastOfTestingSignals$ = testingSignals$.pipe(
  withLatestFrom(connectionsForTestingSignals),
  flatMap(([msg,connections]) => {
    return Observable.from(connections.map(([ws,req])=> [ws,req,msg]));
  }),
  catchError((error,caught) => {
    console.log(error);
    return Observable.of([null,null,""]);
  })
);
// ------------------------------------------------------------------------

let socketError$ = connectionsStream.pipe(
  flatMap(([ws,req]) => Observable.fromEvent(ws,'error').map((ev) => { let msg = `error from ws: ${ev.error}`;
                                                                       //console.log(ev);
			                                                                 console.log(msg);
			                                                                 return [ws,req,msg]; })
         )
);

merge(socketError$,
      fileMonitor$,
      rhsmStatus$,
      executeBinary$,
      broadcastOfDbusSystemMonitor$,
      broadcastOfTestingSignals$
     ).filter(([ws,req,msg]) => { let isOpen = ws && (ws.readyState === WebSocket.OPEN);
                                  //console.log(`is a socket open? ${isOpen}`);
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
