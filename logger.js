const log4js = require("log4js");
const { exec } = require("child_process");
const node_fs = require("fs");
const node_path = require("path");

log4js.configure({
  appenders: {
    // 控制台输出
    console: { type: "console" },
    // 文件输出
    file: {
      // 输出类型: fileSync | file
      type: "fileSync",
      // 最大文件大小
      maxLogSize: 51048760,
      // 最大文件数量
      backups: 5,
      // 压缩
      compress: true,
      // 文件名
      filename: node_path.join(__dirname, "logs", "app.log"),
      //"logs/app.log",
    },
  },
  categories: {
    default: {
      appenders: ["console", "file"],
      // 日志级别: trace | debug | info | warn | error | fatal
      //   level: "debug",
      level: "info",
    },
    debugger: {
      appenders: ["console"],
      level: "debug",
    },
  },
});

// 定义一个函数来发送通知
function sendNotification(title, message, serious = false) {
  // 构建notify-send命令
  const command = `notify-send ${
    serious ? "-u critical" : ""
  } "${title}" "${message}"`;

  // 执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
}

// // 使用函数发送通知
// sendNotification("Test Title", "This is a test notification");

const logger = log4js.getLogger("main");

// 创建一个代理对象
const loggerProxy = new Proxy(logger, {
  get(target, propKey) {
    const originalMethod = target[propKey];
    if (propKey === "error") {
      // 返回一个包装后的error方法
      return function (...args) {
        // 调用原始的error方法
        const result = originalMethod.apply(target, args);
        // 在调用原始方法之后执行 notify-send
        sendNotification(
          "SoftLinkEditor",
          "软链接编辑器发生错误：" + args[0],
          true
        );
        return result;
      };
    } else if (propKey === "warn") {
      return function (...args) {
        const result = originalMethod.apply(target, args);
        sendNotification("SoftLinkEditor", "软链接编辑器[warn]：" + args[0]);
        return result;
      };
    }
    // 对于其他方法，直接返回原始方法
    return originalMethod;
  },
});

module.exports = {
  logger: loggerProxy,
  debugger: log4js.getLogger("debugger"),
  sendNotification,
};
