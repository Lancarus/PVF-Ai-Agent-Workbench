# 统一 Workbench 查询 contract

`workbench.bat knowledge-query` 为随包 NUT API、tag、任务书签，以及任务明确提供的 source manifest、claim store、PVF 谱系、依赖 planner 和客户端矩阵提供同一个只读 envelope。

每次返回：

- `kind`
- portable artifact 标识或任务 artifact 路径与完整 SHA256
- 查询条件和 match/return/truncated 摘要
- `results` 数组
- 固定证据与写入边界
- 需要时的底层 delegated 命令元数据

```bat
workbench.bat knowledge-query source --manifest "D:\research\SOURCE-MANIFEST.json" --text declaration --limit 20
workbench.bat knowledge-query claims --store "D:\research\CLAIM-STORE.json" --text sq_GetSkillLevel --limit 20
workbench.bat knowledge-query nut --name sq_GetSkillLevel --kind function --group dnf --exact
workbench.bat knowledge-query tag --tag duration --exact
workbench.bat knowledge-query bookmark --text 商城
workbench.bat knowledge-query lineage --catalog "D:\research\PVF-LINEAGE-CATALOG.json" --golden blood-sword-tp-derivative
workbench.bat knowledge-query planner --report "D:\research\DEPENDENCY-PLAN.json" --unresolved-only
workbench.bat knowledge-query client --matrix "D:\research\CLIENT-COMPATIBILITY-MATRIX.json" --status divergent
```

统一 envelope 不改变原有证据边界：索引不是最终证据，0 命中不证明不存在，PVF 结论必须目标 readback，planner 不是导入计划，客户端资源存在不是实机证明。任何 PVF 写入仍只能进入 `workbench.bat pvf-change`；客户端写入不在本查询通道中。
