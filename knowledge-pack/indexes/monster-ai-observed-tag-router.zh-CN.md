# Monster AI Tag 路由

状态：需验证

AI 标签必须结合 `.ai/.aic` 文件、父块、条件表达式与目标对象范围读取。先读 `dictionaries/monster-ai-action-attack-cross-layer-fields.zh-CN.md` 和 `task-cards/monster-ai-action-attack-cross-layer-readonly-audit.zh-CN.md`。

- 不把标签名直接翻译成运行语义。
- 不把裸数字当作 ID；按父块判断 registry 或状态/概率参数。
- 条件与动作必须保持顺序和闭合。
- 静态结构不证明 AI 分支可达、时序正确或实机会触发。
