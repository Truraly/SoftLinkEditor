// 文件模块
const fs = require("node:fs");
const path = require("node:path");

// 读取路径数组下的所有文件夹路径，返回为一个数组
function findDirsInPathsSync(paths) {
  let result = [];
  paths.forEach((dir) => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
          result.push(filePath);
        }
      });
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  });
  return result;
}

// 读取路径下的所有的软链接
function findSymlinksInDirSync(dir) {
  let result = [];
  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.lstatSync(filePath);

      if (stats.isSymbolicLink()) {
        const linkString = fs.readlinkSync(filePath);
        result.push({
          filePath: filePath,
          linkString: linkString,
        });
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
  return result;
}

module.exports = {
  findDirsInPathsSync,
  findSymlinksInDirSync,
};
