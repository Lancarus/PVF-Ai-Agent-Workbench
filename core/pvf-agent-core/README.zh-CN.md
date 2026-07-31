# pvf-agent-core

这里是 PVF-Agent-Workbench 的本地能力核心。

## 主要入口

- `cli/pvf-readonly.js`: 只读 open/list/search/read/read-batch/resolve-lst/resolve-path。
- `cli/pvf-index.js`: 生成和查询本地只读索引。
- `cli/pvf-change-set.js`: 受控写入执行器；校验、dry-run、apply 到显式 output，并强制备份、readback、manifest。
- `cli/pvf-backend-contract.js`: 对 PVF backend 做只读 contract 检查。
- `cli/unified-knowledge-query.js`: 查询随包内置 NUT、tag、任务书签及任务显式提供的研究 artifact。
- `scripts/workbench-profile.js`: 创建、选择和查看本机私有 profile。
- `scripts/runtime-absorb-checklist.js`: 生成实机验证结论吸收清单。

权限边界：

- `config/pvf-adapter.json` 只启动随包内置 backend，不依赖宿主插件或外部服务。
- `config/write-policy.json` 定义 `pvf-change-set.js` 的受控写入通道；写入只能保存到显式 output，不能覆盖源 PVF，不能写客户端资源。
