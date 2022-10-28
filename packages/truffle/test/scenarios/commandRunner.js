const { exec } = require("child_process");
const { EOL } = require("os");
const path = require("path");

module.exports = {
  getExecString: function () {
    return process.env.NO_BUILD
      ? `node ${path.join(__dirname, "../", "../", "../", "core", "cli.js")}`
      : `node ${path.join(__dirname, "../", "../", "build", "cli.bundled.js")}`;
  },
  run: function (command, config) {
    const execString = `${this.getExecString()} ${command}`;

    return new Promise((resolve, reject) => {
      let child = exec(execString, {
        cwd: config.working_directory
      });

      child.stdout.on("data", data => {
        data = data.toString().replace(/\n$/, "");
        console.log(data);
        config.logger.log(data);
      });
      child.stderr.on("data", data => {
        data = data.toString().replace(/\n$/, "");
        config.logger.log(data);
        console.log(data);
      });
      child.on("close", code => {
        // If the command didn't exit properly, show the output and throw.
        if (code !== 0) {
          reject(new Error("Unknown exit code: " + code));
        }
        resolve();
      });

      if (child.error) {
        reject(child.error);
      }
    });
  },
  /**
   * This is a function to test the output of a truffle develop/console command with arguments.
   * @param {string[]} inputCommands - An array of input commands to enter when the prompt is ready.
   * @param {TruffleConfig} config - Truffle config to be used for the test.
   * @param {string} executableCommand - Truffle command to be tested (develop/console).
   * @param {string} executableArgs - Space separated arguments/options to be used with the executableCommand.
   * @param {string} displayHost - Name of the network host to be displayed in the prompt.
   * @returns a Promise
   */
  runInREPL: function ({
    inputCommands = [],
    config,
    executableCommand,
    executableArgs = "",
    displayHost
  } = {}) {
    const cmdLine = `${this.getExecString()} ${executableCommand} ${executableArgs}`;

    const readyPrompt =
      executableCommand === "debug"
        ? `debug(${displayHost})>`
        : `truffle(${displayHost})>`;

    // seems safe to escape parens only, as the readyprompt is constructed from
    // [a-zA-Z] strings and wrapping parens.
    const escapedPrompt = readyPrompt.replace("(", "\\(").replace(")", "\\)");
    const readyPromptRex = new RegExp(`^${escapedPrompt}`, "m");

    let outputBuffer = "";

    return new Promise((resolve, reject) => {
      const child = exec(cmdLine, { cwd: config.working_directory });

      if (child.error) return reject(child.error);

      child.stderr.on("data", data => {
        config.logger.log("ERR: ", data);
      });

      child.stdout.on("data", data => {
        // accumulate buffer from chunks
        outputBuffer += data;

        if (readyPromptRex.test(outputBuffer)) {
          // Set outputBuffer to remaining segment after final match.
          // This will match the next prompt. There can only ever be one
          // readyPrompt as the prompt is presented only after the REPL
          // *evaluates* a command.
          const segments = outputBuffer.split(readyPromptRex);
          outputBuffer = segments.pop();

          if (inputCommands.length === 0) {
            // commands exhausted, close stdin
            child.stdin.end();
          } else {
            // fifo pop next command and let the REPL evaluate the next
            // command.
            const nextCmd = inputCommands.shift();
            child.stdin.write(nextCmd + EOL);
          }
        }
        config.logger.log("OUT: ", data);
      });

      child.on("close", code => {
        config.logger.log("EXIT: ", code);
        resolve();
      });
    });
  }
};
