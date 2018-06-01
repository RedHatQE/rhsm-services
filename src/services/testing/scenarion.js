import { exec } from 'child_process';
const path = require('path');

export function runScenario (scenarionDirectory) {
  let handler = (req,res) => {
    let scenario = req.body.scenario;
    let cmd = path.join(scenarionDirectory,scenario);
    exec(cmd,(error,stdout,stderr) => {
      res.send({"error": error,
                "stdout": stdout,
                "stderr": stderr});
    });
  };
  return handler;
};
