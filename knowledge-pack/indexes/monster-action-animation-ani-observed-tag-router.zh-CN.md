# Monster `.ani` Tag 路由

状态：需验证

二进制 ANI 必须实际反编译后再解释帧、图层、坐标、攻击框与受击框。读取 `dictionaries/monster-action-animation-fields.zh-CN.md` 和 `task-cards/monster-action-animation-readonly-audit.zh-CN.md`。

- `[ATTACK BOX]` 不证明一定造成伤害。
- `[DAMAGE BOX]` 不等于攻击输出。
- 空帧、空图层与缺失客户端资源分别记录。
- ANI 引用存在不证明 NPK/IMG 齐全或实机显示正常。
