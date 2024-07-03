// Paternity search

/**
 * 
{
  "path": "/path/to/file",
  "filename": "file",
  "type": "Area", // Area, Project, Resource
  "tags": ["tag1", "tag2"],
  "info": {
    "key1": ["value1"],
    "key2": ["value2"],
    "key3": ["value3"],
    "key4": ["value4", "value5"]
  },
  "softLinks": [
    {
      "name": "name1",
      "path": "path1"
    },
    {
      "name": "name2",
      "path": "path2"
    }
  ],
  "children": []
}
 */

const typeMap = {
  Area: 3,
  Project: 2,
  Task: 1,
  Resource: 0,
};

const typeSimpleMap = {
  Area: "A",
  Project: "P",
  Task: "TASK",
  Resource: "RES",
};

const typeList = ["Resource", "Task", "Project", "Area"];

// 寻找父子关系
function paternitySearch(dirObjects) {
  // 循环4次
  typeList.forEach((pType) => {
    for (let j = 0; j < dirObjects.length; j++) {
      // 依次遍历 Resource, Task, Project, Area 类型的文件夹
      if (dirObjects[j].type !== pType) {
        continue;
      }
      // 寻找其是否存在父文件夹的信息
      let fatherType = null;
      let fatherName = null;
      let findFather = false;
      for (let i = typeMap[pType] + 1; i <= typeList.length; i++) {
        if (dirObjects[j].info[typeList[i]] != undefined) {
          fatherType = typeList[i];
          fatherName = dirObjects[j].info[typeList[i]];
          findFather = true;
          // console.log("存在父文件夹");
          break;
        }
      }
      //
      if (fatherType === null) {
        // console.log("不存在父文件夹");
        continue;
      }

      // 寻找父文件夹
      fatherName.forEach((fatherName) => {
        // console.log("fatherName:" + fatherName);
        // console.log("fatherType:" + fatherType);
        // 寻找父文件夹
        let fatherIndex = dirObjects.findIndex((dirObject) => {
          //   console.log("dirObject:", dirObject);

          return (
            dirObject.type === fatherType &&
            dirObject.info[fatherType].includes(fatherName)
          );
        });

        if (fatherIndex != -1) {
          // 找到了父文件夹
          //   console.log(
          //     "-找到了父文件夹 fatherType:" +
          //       fatherType +
          //       " fatherName:" +
          //       fatherName
          //   );
          dirObjects[fatherIndex].children.push(dirObjects[j]);
        } else {
          //   console.log(
          //     "未找到父文件夹 fatherType:" +
          //       fatherType +
          //       " fatherName:" +
          //       fatherName
          //   );
          // 创建一个父文件夹
          let father = {
            path: "",
            filename: typeSimpleMap[fatherType] + "_" + fatherName,
            type: fatherType,
            tags: [],
            info: {},
            softLinks: [],
            children: [],
          };
          father.info[fatherType] = fatherName;
          // 添加其他信息
          // TODO

          father.children.push(dirObjects[j]);
          dirObjects.push(father);
          //   console.log("创建了一个父文件夹", father);
        }

        // 删除当前文件夹在数组中的位置
        dirObjects.splice(j, 1);
        j--;
      });
    }
  });
  return dirObjects;
}

module.exports = {
  paternitySearch,
};
