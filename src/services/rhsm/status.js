const { exec } = require('child_process');
const fs = require('fs');

import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { map, flatMap } from 'rxjs/operators';

function RHSMStatusMsg(time,error,stdout,stderr){
  this.time = time;
  this.error = error;
  this.stdout = stdout;
  this.stderr = stderr;
  this.overallStatus = stdout.match(/^Overall Status:([^\n]+)/m)[1].trim();
}

function rhsmStatus ([ws,req]){
  let getRHSMStatus = (ws) => {
    return Observable.bindCallback(exec,Array.of)("/usr/bin/subscription-manager status").pipe(
      map((x) => new RHSMStatusMsg((new Date()).toJSON(), x[0], x[1], x[2])),
      map((msg) => { return [ws,msg]; })
    );};
  let entitlementWatch = fs.watch('/etc/pki/entitlement');
  return merge(getRHSMStatus(ws),
               Observable.fromEvent(ws,'message').flatMap((x) => getRHSMStatus(ws)),
               Observable.fromEvent(entitlementWatch,'change').pipe(
                 map((x) => {console.log('a system entitlement status has been changed'); return x;}),
                 flatMap((x) => getRHSMStatus(ws)))
              );
};
module.exports = rhsmStatus;
