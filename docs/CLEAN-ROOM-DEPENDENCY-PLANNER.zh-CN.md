# Clean-room 统一依赖 Planner

`workbench.bat dependency-plan` 把既有 scope 与 item/stackable planner 统一为只读 contract，覆盖副本、城镇、怪物、PassiveObject、APC、ANI、装备、stackable、礼包、宝珠、任务与套装。

实现只依据 Workbench clean knowledge、公开 PVF 结构、目标 PVF raw readback 和独立 fixture；商业工具只提供能力类别，不复制源码方法体、UI、认证或商业限制逻辑。

```bat
workbench.bat dependency-plan plan --pvf "D:\target\Script.pvf" --domain dungeon --id 11 --out "D:\research\plans"
workbench.bat dependency-plan plan --pvf "D:\target\Script.pvf" --domain package --path "stackable/cash/package_adventurer.stk" --out "D:\research\plans"
workbench.bat dependency-plan batch --profile "D:\research\PRIVATE-DEPENDENCY-PLANNER-PROFILE.json" --out "D:\research\batch"
```

每次只允许 ID、path、query 或受支持 sample 中一个选择器。批量 profile 必须以完整 PVF SHA256 锁定来源。`--reuse-raw` 只接受同时匹配 PVF SHA、完整请求 fingerprint 和底层 planner lane 的缓存。

Planner 只输出节点、registry 边、缺失依赖、客户端资源候选和风险。它不会生成可直接 apply 的 patch；任何输出候选仍必须转入 raw no-simplified change-set、同源同 change-set dry-run、approval code、显式 output、backup、readback 和 manifest。

NPK/IMG 只做另行授权的存在性与路径预览，不支持写、删、合并或替换。
