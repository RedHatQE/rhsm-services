const env = require('env2')('.env');

import { Observable } from 'rxjs/Rx';
import { merge } from 'rxjs/observable/merge';
import { map, flatMap } from 'rxjs/operators';

var dbus = require('dbus-native');
var sessionBus = dbus.systemBus();

// export function getService(serviceName, interfaceName){
//   let service = sessionBus.getService(serviceName);
//   return Observable.bindNodeCallback((serviceName,interfaceName, callback) => {
//     return service.getInterface(serviceName, interfaceName, callback);
//   })('/EntitlementStatus',
//      'com.redhat.SubscriptionManager.EntitlementStatus'
//     ).flatMap((channel) => {
//       return merge (
//         Observable.fromEvent(channel,"entitlement_status_changed"),
//         Observable.bindNodeCallback((callback) => {
//           return channel.check_status(callback);
//         })()
//       );
//     });

  // service.getInterface(
  //   '/EntitlementStatus',
  //   'com.redhat.SubscriptionManager.EntitlementStatus',
  //   function(err,channel){
  //                        console.log(err);
  //                        console.log('a service is openned');
  //                        channel.check_status((err,str) => {
  //                          console.log(err);
  //                          console.log(str);
  //                        });
  //                        channel.on('entitlement_status_changed', status => {
  //                          console.log(`received a change of entitlement status ${status}`);
  //                        });
  //                      });
  //let entitlementStatus$ = Observable.fromEvent(channel,'entitlement_status_changed').share();
  // returns a stream of messages for the given request

//   let handler = ([ws,req]) => {
//     var msg = (name) => {
//       return [ws, req, {"time": (new Date()).toJSON(),
//                         "entitlementStatus":1}];
//     };
//   };
//   return handler;
// }
