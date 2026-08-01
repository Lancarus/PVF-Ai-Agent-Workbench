# AttackInfo `.atk` 反引号 Token 路由

状态：需验证

反引号内容通常是父块内枚举 token，不是独立 Section。读取时必须同时保留父块与相邻数值。

- 攻击类型 token 只在 `[attack type]` 内解释。
- 元素 token 只在 `[elemental property]` 内解释。
- 命中与受击 token 只在 `[hit info]`、`[damage reaction]` 或 `[attack direction]` 内解释。
- 状态 token 只在 `[active status]` 内解释；列含义必须由目标同类样本或实机确认。
- 未知 token 原样保留，不自动改拼写，也不凭名称推断运行公式。
