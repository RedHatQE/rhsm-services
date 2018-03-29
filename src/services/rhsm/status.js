const { exec } = require('child_process');
const Rx = require('rxjs/Rx');

function RHSMStatusMsg(time,error,stdout,stderr){
  this.time = time;
  this.error = error;
  this.stdout = stdout;
  this.stderr = stderr;
  this.overallStatus = stdout.match(/^Overall Status:([^\n]+)/m)[1].trim();
}

function rhsmStatus (connectionsStream){
  let getRHSMStatus = (ws) => {
    return Rx.Observable.bindCallback(exec,Array.of)("/usr/bin/subscription-manager status")
      .map((x) => new RHSMStatusMsg((new Date()).toJSON(), x[0], x[1], x[2]))
      .map((x) => { return [ws,x]; });
  };
  return connectionsStream.filter(([ws,req]) => req.url.match(/^\/rhsm\/status/))
    .flatMap(([ws,req]) => getRHSMStatus(ws).merge(
      Rx.Observable.fromEvent(ws,'message').flatMap((x) => getRHSMStatus(ws))));
};
module.exports = rhsmStatus;
