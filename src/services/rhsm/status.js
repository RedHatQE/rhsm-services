const { exec } = require('child_process');
const fs = require('fs');
const dbus = require('dbus-native');

import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { zip } from 'rxjs/observable/zip';
import { map, flatMap } from 'rxjs/operators';

// function RHSMStatusMsg(time,error,stdout,stderr){
//   this.time = time;
//   this.error = error;
//   this.stdout = stdout;
//   this.stderr = stderr;
//   this.overallStatus = stdout.match(/^Overall Status:([^\n]+)/m)[1].trim();
// }
// export function getRhsmStatus (){
//   return Observable.bindCallback(exec,Array.of)("/usr/bin/subscription-manager status")
//     .map((x) => new RHSMStatusMsg((new Date()).toJSON(), x[0], x[1], x[2]));
// };

// export function rhsmStatus ([ws,req]){
//   let entitlementWatch = fs.watch('/etc/pki/entitlement');
//   return merge(getRhsmStatus(),
//                Observable.fromEvent(ws,'message').flatMap((x) => getRhsmStatus()),
//                Observable.fromEvent(entitlementWatch,'change').pipe(
//                  map((x) => {console.log('a system entitlement status has been changed'); return x;}),
//                  flatMap((x) => getRhsmStatus()))
//               ).map((msg) => { return [ws,req,msg]; });
// };

export function getOverallStatus(status){
  let statuses = {
    0: 'Current',
    1: 'Invalid',
    5: 'Unknown'
  };
  return statuses[status] || 'Unknown status number';
};

export function rhsmStatus ([ws,req]){
  console.log('rhsm status service');
  let sessionBus = dbus.systemBus();
  let service = sessionBus.getService('com.redhat.SubscriptionManager');
  return Observable.bindNodeCallback((serviceName,interfaceName, callback) => {
    return service.getInterface(serviceName, interfaceName, callback);
  })('/EntitlementStatus',
     'com.redhat.SubscriptionManager.EntitlementStatus'
    ).map(channel => {
      console.log('a channel was openned');
      return channel;
    }).flatMap((channel) => {
      return merge(
        Observable.fromEvent(ws,'message').flatMap(
          (x) => { return Observable.bindNodeCallback((callback) => {
            console.log('callback was fired');
            return channel.check_status(callback);
          })();}),
        Observable.fromEvent(channel,"entitlement_status_changed")
          .map((x) => {console.log('entitlement status changed event');
                       return x;}),
        Observable.bindNodeCallback((callback) => {
          console.log('callback was fired');
          return channel.check_status(callback);
        })()
      );
    }).map(status => {
      console.log(`got status: ${status}`);
      return [ws, req, {'time': (new Date()).toJSON(),
                        'entitlementStatus': status,
                        'overallStatus': getOverallStatus(status)}];
    });
};
