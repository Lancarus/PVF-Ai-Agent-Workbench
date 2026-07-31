# Monster 创建 PassiveObject：`.act` 路由

状态：需验证

从 Monster `.act` 遇到对象创建时，执行 `task-cards/monster-created-passiveobject-readonly-audit.zh-CN.md`。

- `[CREATE PASSIVEOBJECT] [INDEX]` 走 `passiveobject/passiveobject.lst`。
- `[SUMMON MONSTER] [INDEX]` 走 `monster/monster.lst`。
- `[SUMMON APC] [INDEX]` 走 `aicharacter/aicharacter.lst`。
- 随机候选逐个解析，未注册和缺失文件保持 unresolved。
- 继续闭合 `.obj/.act/.atk/.ani`，直到不再出现新引用。
