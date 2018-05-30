const env = require('env2')('.env');

import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { map, flatMap } from 'rxjs/operators';
const util = require('util');

var dbus = require('dbus-native');
var systemBus = dbus.systemBus();
let service = systemBus.getService('com.redhat.SubscriptionManager');
//console.log(util.inspect(service));
// console.log(util.inspect(service.bus.connection));
// service.bus.connection.on('message',function(ev){
//   console.log(ev);
// });

Observable.bindNodeCallback((serviceName,interfaceName, callback) => {
  return service.getInterface(serviceName, interfaceName, callback);
})('/EntitlementStatus',
   'com.redhat.SubscriptionManager.EntitlementStatus'
  ).flatMap((channel) => {
    return merge (
      Observable.fromEvent(channel,"entitlement_status_changed"),
      Observable.bindNodeCallback((callback) => {
        return channel.check_status(callback);
      })()
    );
  }).subscribe(status => {
    console.log('status arrived: ' + status);
  });

// service.getInterface (
//   '/EntitlementStatus',
//   'com.redhat.SubscriptionManager.EntitlementStatus',
//   function(err,channel){
//     console.log('error:' + err);
//     console.log('a service is openned');
//     channel.check_status((err,str) => {
//       console.log('error:' + err);
//       console.log(str);
//     });
//     channel.on('entitlement_status_changed', status => {
//       console.log(`received a change of entitlement status ${status}`);
//     });
//   });
