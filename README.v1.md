# 软链接编辑器 | SoftLinkEditor

在基于 TPARA 的资源管理中，PARA 这一部分常常以文件的方式管理

根据文件名的格式规范，可以设计一个软链接编辑器，将某个项目下的子项目资源以软链接的形式放到该项目的目录下

并且使用 cron 来定时更新这些软链接

## 需求

使用 nodejs，对于指定的复述个文件夹中的项目进行处理

软链接生成

1. 读取目录下的全部一级文件夹，并识别为对象
2. 寻找每个对象的上下级，构成树形结构
3. 对于每个节点，将其所有子节点的文件夹软链接到该节点的文件夹下，若已存在则跳过；对于不存在的软链接，给予删除

## 项目设计

#### 对象识别 | Object Recognize

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

- [x] 考虑使用 map 将简写转化为全称，并对于使用全称的文件夹发出提示

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
      "filePath": "filePath1",
      "linkString": "linkString1"
    },
    {
      "filePath": "filePath2",
      "linkString": "linkString2"
    }
  ],
  "children": []
}
```

### 父子关系寻找

现在我们有了一堆类似下面结构的对象

```json
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
      "filePath": "filePath1",
      "linkString": "linkString1"
    },
    {
      "filePath": "filePath2",
      "linkString": "linkString2"
    }
  ],
  "children": []
}
```

遍历文件对象，`info` 中在依次确认级别高一级的对象，若存在，则在列表中寻找确切的父类对象，并挂到父类的 children 中

为了避免父类被放到父类的父类中导致找不到，所以要循环 4 遍，依次对 RES，……进行寻找

可以考虑添加 4 个数组来解决，循环速度较慢的问题

若对应父类尚未存在，则创建一个空的父类对象，处理后存入队列

- 若存在，则将自身添加到父节点的 children 中
- 若不存在，并且存在相应父节点，则创建一个空的父节点，并将该节点添加到父节点的 children 中，将父节点添加列表中
- 若无父节点信息，则直接添加到下一个处理列表中

### 软链接更新

遍历队列中的每个节点

对于每个节点，根据其子节点，生成对应的软链接列表，与原有的软链接列表进行对比

- 若存在，则跳过，并删除软链接列表对应的数据
- 若不存在，则添加
- 若原有的软链接列表中存在，但是子节点中不存在，则删除

#### 父文件夹创建

对于空的对象，需要向指定的目录中创建文件夹

#### 函数

输入对象列表，无输出

对于输入的列表使用 foreach

如果对象文件不存在，则创建

如果对象 children 不为空，则将 children 递归调用，若为空则继续

或者 softlinks 或 children 不为空，则进行软链接的更新

遍历 children，对于每个子对象，生成软链接，并在软链接列表中查找

- 若存在，则跳过，并删除软链接列表对应的数据
- 若不存在，则添加

然后对于剩余的软链接列表，删除

## 项目管理

采用日志（需要单独文件），每个模块分为一个文件，然后留一个主文件

对于 worn 弹窗提示，对于 error，重要弹窗提示

## todo

- [ ] 对于软链接列表，考虑使用 json 对象代替
