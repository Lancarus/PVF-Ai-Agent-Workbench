# 副本与世界标准化模型

状态：默认可用

## 它解决什么问题

普通字段词典只能回答“这个标签大概是什么”，而副本与世界任务常常要同时处理多个文件、多个 registry 和客户端候选资源。标准化模型把它们组织成可复用的业务单元：定义输入、引用闭环、匹配键、阻断条件、输出计划和实机验收点。

它主要覆盖四类新增模型：

1. `.map` 的布局层迁移与玩法层隔离。
2. `.wdm` 与 worldmap `.ui` 的副本接口一致性。
3. `.dgn`、hell map 与 `hellparty.etc` 的深渊组闭环。
4. 副本难度 `.tbl` 与地狱名单的分层管理。

既有的副本编辑、城镇预览和 ANI/客户端资源检查不重复造知识，统一由能力路由组合。

## 四个层次

```text
registry 层
  worldmap.lst / dungeon.lst / map.lst / monster.lst /
  aicharacter.lst / passiveobject.lst
        ↓
结构层
  .wdm / .ui / .dgn / .map / .etc / .tbl
        ↓
客户端候选层
  .img / .ani / .act / .til / UI 背景与按钮资源
        ↓
行为层
  可见、可点、可进图、边界正常、深渊波次正确、结算正常
```

上层引用只能为下层提供候选。结构闭合不能替代客户端存在性检查，客户端存在性也不能替代实机行为验证。

## 迁移的基本含义

“迁移”不是把一个来源文件整段覆盖到目标文件。安全迁移至少要区分：

- 身份：ID、registry、文件路径和组号。
- 玩法：怪物、触发条件、AI、特殊对象和波次逻辑。
- 布局：坐标、地形、背景、镜头、入口和显示控件。
- 表现：客户端 IMG、ANI、TIL、音频和 UI 资源。
- 格式：TAB、缩进、注释、换行、未知块和原有顺序。

只有明确授权的层可以进入迁移计划，未知内容默认保留目标值。

## 可视化的基本含义

“可视化”在 Workbench 中首先是一份结构化只读报告：

- 显示每个根对象及其解析路径。
- 显示每条引用使用了哪个 registry。
- 显示匹配、缺失、分歧、条件入口和候选关系。
- 显示会阻止自动迁移的玩法冲突。
- 显示客户端资源候选与仍需实机验证的项目。

它不要求携带特定 GUI，也不把颜色、按钮或某个工具的界面布局作为知识本体。

## 首选入口

- `indexes/dungeon-world-standardization-capability-router.zh-CN.md`
- `task-cards/map-widescreen-structural-migration-readonly-plan.zh-CN.md`
- `task-cards/worldmap-dungeon-interface-layout-readonly-plan.zh-CN.md`
- `task-cards/hellparty-visualization-readonly-plan.zh-CN.md`
- `task-cards/dungeon-difficulty-ultimate-list-readonly-audit.zh-CN.md`
