const { logger } = require("./logger.js");
const node_fs = require("node:fs");
const node_path = require("node:path");
const { findDirsInPathsSync, findSymlinksInDirSync } = require("./fstool.js");
const { objectRecognize } = require("./objectRecognize.js");
const { paternitySearch } = require("./paternitySearch.js");
const { linkUpdata } = require("./linkUpdata.js");
// 原始文件路径
const OriginPaths = [
  "/data/Desktop/Projects/",
  "/data/Desktop/Areas/",
  "/data/Desktop/Resources/",
  "/data/Desktop/Archives/",
];

logger.info("SoftLinkEditor started.");
logger.info("初始化检查...");

// 检查系统是否为Linux，否则退出
if (process.platform !== "linux") {
  logger.error("This program only supports Linux system.");
  process.exit(1);
}

// 检查目标路径是否存在，以及是否有写入权限，否则退出
OriginPaths.forEach((path) => {
  // 检查路径是否存在
  if (!node_fs.existsSync(path)) {
    logger.error(`The path ${path} does not exist.`);
    process.exit(1);
  }
  // 检查路径是否有写入权限
  try {
    node_fs.accessSync(path, node_fs.constants.W_OK);
  } catch (error) {
    logger.error(`The path ${path} does not have write permission.`);
    process.exit(1);
  }
  try {
    node_fs.accessSync(path, node_fs.constants.R_OK);
  } catch (error) {
    logger.error(`The path ${path} does not have read permission.`);
    process.exit(1);
  }
});

logger.info("初始化检查通过。");

// 读取文件夹
let dirs = findDirsInPathsSync(OriginPaths);
logger.info(`共找到 ${dirs.length} 个文件夹。`);
logger.info(`识别文件夹...`);
// 对于每个文件夹进行处理
let dirObjects = [];
dirs.forEach((dir) => {
  // 对于每个文件夹进行处理
  let dirObject = objectRecognize(dir);
  if (dirObject !== null) {
    dirObject.softLinks = findSymlinksInDirSync(dir);
    dirObjects.push(dirObject);
  }
});

logger.info(`识别父子关系...`);
// 对于每个文件夹进行父子关系搜索
dirObjects = paternitySearch(dirObjects);
logger.info(`共合并为 ${dirObjects.length} 个文件夹。`);

// 更新软链接
linkUpdata(dirObjects);

// 存入json
// node_fs.writeFileSync("data.json", JSON.stringify(dirObjects, null, 2));
