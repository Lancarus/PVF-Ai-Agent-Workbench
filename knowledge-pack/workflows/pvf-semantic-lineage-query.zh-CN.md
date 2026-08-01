# 跨版本 PVF 语义谱系查询

状态：需验证

1. 收集每个候选 `Script.pvf` 的完整 SHA256；SHA 不匹配时停止复用旧结论。
2. 当前已配置外部目录时，用 `workbench.bat pvf-lineage query` 按路径、符号或 golden case 查询；未配置时只做目标 PVF 局部 readback。
3. 依次展示文件状态、registry entry、Section/tag 差分、NUT 函数/常量/调用差分和行为证据，不把层级折叠。
4. 对 bare ID 重新按当前版本正确 `.lst` 解析；字符/技能必须先锁定精确职业分支。
5. 对字段变化检查配套约束文件、同块其它列、入口脚本和目标最近邻。遇到相同长度未检查文件时不得声称未变化。
6. `behavior-pass` 只覆盖记录中的 PVF SHA、前置条件和测试范围；静态保留到后续版本不自动继承为新 PASS。
7. 需要写入时仍回到目标 PVF 原始文本和受控 change-set 生命周期；谱系目录不能直接输出 PVF。
