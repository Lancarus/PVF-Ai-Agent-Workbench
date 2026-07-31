# NUT API 目录维护

普通任务直接查询随包 `knowledge-pack/indexes/nut-api-facts.compact.json`，不需要额外知识目录。维护者可从明确授权的声明资料在 Workbench 外重建候选目录，再经 facts-only 过滤刷新随包紧凑事实。

目录保留 `dnf`、`squirrel`、`frontend`、`tooling` 分组，避免把前端或工具 API 误认为 DNF 运行时 API。声明版本不等于目标运行时；最终仍要检查目标 PVF 调用点或运行证据。

```bat
workbench.bat nut-api build --source "D:\research\nut-declarations" --out "D:\research\nut-catalog"
workbench.bat nut-api query --catalog "D:\research\nut-catalog\NUT-API-CATALOG.json" --name sq_GetSkill --exact
workbench.bat nut-api observe-pvf --catalog "D:\research\nut-catalog\NUT-API-CATALOG.json" --pvf "D:\target\Script.pvf" --label baseline --out "D:\research\observations\baseline"
```

未知符号、同名冲突或版本不明时不得猜测 API。目录或观察 0 命中不证明目标运行时不存在该符号；最终仍要读取目标 PVF 脚本。
