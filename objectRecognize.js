// 对象识别 | Object Recognize
/**
 * #### 对象识别 | Object Recognize

##### 目录格式参考

- `key1_value1-key2_value2-key3_value3`

```json
{
  "path": "/path/to/file",
  "filename": "file",
  "type": "Area", // Area, Project, Resource
  "tags": [],
  "info": {
    "key1": ["value1"],
    "key2": ["value2"],
    "key3": ["value3"]
  },
  "softLinks": [],
  "children": []
}
```

- `key1_value1_value2-key3_value3`

```json
{
  "path": "/path/to/file",
  "filename": "file",
  "type": "Task",
  "tags": [],
  "info": {
    "key1": ["value1", "value2"],
    "key3": ["value3"]
  },
  "softLinks": [],
  "children": []
}
```

- `key1_value1-key2_value2-key3`

```json
{
  "path": "/path/to/file",
  "filename": "file",
  "type": "Task",
  "tags": ["key3"],
  "info": {
    "key1": ["value1"],
    "key2": ["value2"]
  },
  "softLinks": [],
  "children": []
}
```

- `__`代替`_`
- `--`代替`-`
  - 对于替换，可以先将`--`替换为`<->`，然后分割后再替换回`-`，因为目录中不允许存在`<->`，所以不用担心冲突
- 对于 Keys，需要至少需要存在`A` | `P` | `RES` | `TASK` 中的一个
- 没有`value`的`key`，识别为`tags`

##### Keys 排序

- `A` | `P` | `RES` | `RE` | `T` |`TAGS`

##### 文件夹命名规范参考

- `A`：Area 领域
- `P`：Project 项目
- `RES`: Resource 资源
- `TASK`: Task 任务
- `RE`：Remark 备注
- `T`: 时间
- `TAGS`: tag 标签
  - `Archived`: 已归档
  - `git`：git 仓库
  - `github`：github 仓库

##### 类型识别

存在 4 类文件夹，对于的 标识 为`A` | `P` |`TASK` |`RES`

标识度依次递增，例如：

- 存在`A`，则为 Area
- 存在`A` 和 `P`，则为 Project
- 存在`A` 和 `P` 和 `TASK`，则为 Task
- 存在`A` 和 `P` 和 `RES` 和 `TASK`，则为 Resource
- 存在`A` 和 `P` 和 `RES` 和 `TASK` 和 `RE`，则为 Resource

##### 识别文件夹下软链接

对于文件夹下符合规范软链接，存入 `"softLinks": []`

eg:

```json
{
  "path": "/path/to/file",
  "filename": "file",
  "type": "Area", // Area, Project, Resource
  "tags": [],
  "info": {
    "key1": ["value1"],
    "key2": ["value2"],
    "key3": ["value3"]
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
```
 */
const { logger } = require("./logger.js");
const node_fs = require("node:fs");
const node_path = require("node:path");

const { findDirsInPathsSync, findSymlinksInDirSync } = require("./fstool.js");

// 恢复函数
function recoverStr(element_) {
  let count = 0;
  // 对于 element_ 回复原样
  while (/\<\-\>/.test(element_)) {
    element_ = element_.replace(/\<\-\>/g, "-");
    count++;
    if (count > 10) {
      logger.warn("在解码<->时超出最大循环次数：" + folderPath);
      return null;
    }
  }
  count = 0;
  while (/\<_\>/.test(element_)) {
    element_ = element_.replace(/\<_\>/g, "_");
    count++;
    if (count > 10) {
      logger.warn("在解码<_>时超出最大循环次数：" + folderPath);
      return null;
    }
  }
  return element_;
}

// 输入文件夹名称，输出对象，若对象不合法则返回 null
function objectRecognize(folderPath) {
  // 初始化 folgerObject
  let folgerObject = {
    path: folderPath,
    filename: node_path.basename(folderPath),
    type: null, // Area, Project, Resource
    tags: [],
    info: {},
    softLinks: [],
    children: [],
  };

  // 检测大致符合规范的文件夹
  if (/.*_.*/.test(folgerObject.filename) === false) {
    return null;
  }

  // 对于文件夹名称进行处理
  let folderNameProcessed = folgerObject.filename
    .replace(/--/g, "<->")
    .replace(/__/g, "<_>");
  // 对于文件夹名称进行分割
  let folderNameSplit = folderNameProcessed.split(/(?<!<)-(?!>)/);

  // 替换字典
  const replaceDict = {
    A: "Area",
    P: "Project",
    RES: "Resource",
    TASK: "Task",
    RE: "Remark",
    T: "Time",
  };
  // 需要提醒的key
  const warnKeys = ["Area", "Project", "Resource", "Task", "Remark", "Time"];

  // 对于分割后的数组进行处理
  folderNameSplit.forEach((element) => {
    // 对于 element 进行处理
    // 对于 elementProcessed 进行分割
    let elementSplit = element.split(/(?<!<)_(?!>)/);

    elementSplit = elementSplit.map(recoverStr);

    // 对于 elementSplit 进行处理
    let key = elementSplit[0];

    // 检查key是否合法
    if (warnKeys.includes(key)) {
      logger.warn("请使用缩写代替全拼：" + folderPath);
      return;
    }
    // 检查是否需要替换
    if (replaceDict[key] !== undefined) {
      key = replaceDict[key];
    }

    let value = elementSplit.slice(1);
    // 对于 key ，value进行处理
    if (value.length > 0) {
      folgerObject.info[key] = value;
    } else {
      folgerObject.tags.push(key);
    }
  });
  // 检查类型
  if (folgerObject.info["Resource"] !== undefined) {
    folgerObject.type = "Resource";
  } else if (folgerObject.info["Task"] !== undefined) {
    folgerObject.type = "Task";
  } else if (folgerObject.info["Project"] !== undefined) {
    folgerObject.type = "Project";
  } else if (folgerObject.info["Area"] !== undefined) {
    folgerObject.type = "Area";
  } else {
    logger.warn("Type not found：" + folderPath);
    return null;
  }
  // 合法性检测
  // RES 和 Archived 不允许同时存在
  //   if (
  //     folgerObject.type === "Resource" &&
  //     folgerObject.tags.includes("Archived")
  //   ) {
  //     logger.warn(
  //       "Resource and Archived cannot exist at the same time：" + folderPath
  //     );
  //     return null;
  //   }
  return folgerObject;
}

module.exports = {
  objectRecognize,
};
