# PVF 语义谱系快速边界

状态：需验证

用途：处理跨 PVF 版本的文件、registry、Section/tag、NUT 符号与行为变化。完整 PVF SHA256 是唯一版本主键；日期、目录名和“最终版”称呼不足以识别版本。

## 分层状态

- 文件清单的路径/长度只能定位 `introduced / removed / length-changed`；相同长度不证明内容相同。
- `.lst`、NUT 和选定语义文件必须从每个目标 PVF 原始 no-simplified 文本读回并单独哈希。
- `introduced / changed / removed / retained` 是静态谱系；`behavior-pass / behavior-fail` 只能来自独立、SHA 绑定的实机记录。文档陈述和行为事实分开显示。
- 任何 registry 结论都要显示 registry 路径、ID 和解析目标；职业分支必须精确，`Swordman` 与 `DemonicSwordman` 等同名后缀不能模糊匹配。
- 单字段变化不能覆盖跨字段约束。例如 `[maximum level] 20` 与六个 `[growtype maximum level] 10` 并存时，只能说明字段上限和可学上限分层，不能写成实际可学 20 级。
- NUT 函数、常量、调用点观察是静态证据；入口是否执行、运行时条件和最终行为仍按目标链或既有 PASS 判断。

外部 `pvf-lineage` 目录、文件清单、私有回归 profile 和历史证据不进入 clean Workbench。查询后仍需读回涉及的目标文件。
