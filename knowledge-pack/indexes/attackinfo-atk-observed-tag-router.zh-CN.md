# AttackInfo `.atk` Tag 路由

状态：需验证

用途：为 `.atk` 标签问题提供短入口，不保存版本命中次数或样本清单。

1. 先读 `dictionaries/attackinfo-atk-fields.zh-CN.md`。
2. 用 `workbench.bat knowledge-query tag --tag <tag> --exact` 查询分层解释。
3. 在目标 PVF 读取完整 `.atk`，确认父块、闭合、列数、tab 与原始大小写。
4. 若 `.atk` 来自 PassiveObject，继续闭合 `.obj/.act/.ani`；来自 Monster 时继续闭合 `.mob/.act/.ani`。
5. `[active status]`、`[damage reaction]`、`[hit info]`、`[attack direction]`、`[elemental property]` 和 `[pvp]` 都按父块解释。

静态标签不能证明伤害、命中、异常概率、击退、浮空、PVP 规则或客户端表现。
