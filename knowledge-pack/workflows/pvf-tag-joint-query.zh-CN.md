# PVF Tag 联合只读查询

状态：需验证

1. 先读 `dictionaries/pvf-tag-source-boundary-quick.zh-CN.md`，确认问题是 tag 语义、registry、目标文件结构还是运行时行为。
2. 用随包 `workbench.bat tag-knowledge query --exact` 查询；普通任务不配置外部目录。未命中时回到目标 PVF 和 clean knowledge，不猜字段。
3. 保持 `community`、`official-original`、翻译与 `tool-extension` 分层；冲突不静默合并。
4. 用 SHA 锁定目标 PVF，以 `observe-pvf` 对少量具体 tag 取最近邻样本；不要无目标地扫描全部 tag。
5. 读回样本原文，核对 tag 位置、闭合、列数、tab、空列、父块、文件类型和相关 registry。
6. 输出分别标记知识层、目标观察、registry 解析和运行未知；0 命中只记录为未观察到。
7. 若进入写入候选，仍走 raw no-simplified change-set、同源同 change-set dry-run、approval code、显式输出、备份、readback 和 manifest。

禁止把社区解释或拼写候选变成 registry 事实，禁止把工具扩展说成官方原文，禁止把机翻单独作为字段含义或写入依据。
