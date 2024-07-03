/**
 * 输入对象列表，无输出

对于输入的列表使用 foreach

如果对象文件不存在，则创建

如果对象 children 不为空，则将 children 递归调用，若为空则继续

或者 softlinks 或 children 不为空，则进行软链接的更新

遍历 children，对于每个子对象，生成软链接，并在软链接列表中查找

- 若存在，则跳过，并删除软链接列表对应的数据
- 若不存在，则添加

然后对于剩余的软链接列表，删除
 */

const node_fs = require("fs");
const node_path = require("path");
const { logger, sendNotification } = require("./logger.js");

// 默认路径
const defaultPath = {
  Area: "/data/Desktop/Areas",
  Project: "/data/Desktop/Projects",
  Resource: "/data/Desktop/Resources",
  Task: "/data/Desktop/Tasks",
};

// 更新软链接函数
function linkUpdata(dirObjects) {
  let createLinkCount = 0;
  let deleteLinkCount = 0;
  let skipLinkCount = 0;
  let errorLinkCount = 0;

  dirObjects.forEach((dirObject) => {
    // 如果path为空，则创建，一个对应的文件夹
    if (dirObject.path === "") {
      dirObject.path = node_path.join(
        defaultPath[dirObject.type],
        dirObject.filename
      );
      node_fs.mkdirSync(dirObject.path, { recursive: true });
    }
    //  如果children不为空，则递归调用
    if (dirObject.children.length > 0) {
      linkUpdata(dirObject.children);
    }

    // 如果softlinks 或 children不为空，则进行软链接的更新
    if (dirObject.softLinks.length > 0 || dirObject.children.length > 0) {
      // 遍历children
      dirObject.children.forEach((child) => {
        let filePath = child.path;
        // dirObject 的 path的路径
        let softLink = node_path.join(
          node_path.join(dirObject.path, child.filename)
        );
        // 寻找
        let index = dirObject.softLinks.findIndex(
          (softLink_) =>
            softLink_.linkString === filePath && softLink_.filePath === softLink
        );
        if (index !== -1) {
          dirObject.softLinks.splice(index, 1);
          logger.log("软链接已存在，跳过:", softLink);
          skipLinkCount++;
        } else {
          try {
            node_fs.symlinkSync(filePath, softLink);
            logger.log("软链接创建:", softLink);
            createLinkCount++;
          } catch (error) {
            logger.warn("软链接创建失败,child:", child);
            errorLinkCount++;
          }
        }
      });
      // 删除剩余的软链接
      dirObject.softLinks.forEach((softLink) => {
        node_fs.unlinkSync(softLink.filePath);
        logger.log("软链接删除:", softLink.filePath);
        deleteLinkCount++;
      });
    }
  });

  // 如果有软链接更新，则发送通知
  if (createLinkCount + deleteLinkCount + errorLinkCount != 0) {
    sendNotification(
      `软链接更新完成`,
      `创建:${createLinkCount} 删除:${deleteLinkCount} 跳过:${skipLinkCount} 错误:${errorLinkCount}`
    );
  }
}

module.exports = { linkUpdata };
