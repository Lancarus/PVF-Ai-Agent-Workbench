# Monster `.act` Tag 路由

状态：需验证

1. 从 `.mob` 的真实动作引用进入 `.act`，不要按同名文件猜路径。
2. 读取 `dictionaries/monster-action-animation-fields.zh-CN.md` 与 `task-cards/monster-action-animation-readonly-audit.zh-CN.md`。
3. `[MOTION]`、`[TRIGGER]`、`[BEHAVIOR]`、创建与召唤块必须读到结束标签。
4. PassiveObject、Monster 与 APC 的 `[INDEX]` 分别走正确 registry。
5. ANI、AttackInfo、appendage、声音和客户端资源继续按独立边界核对。

本路由不保存 tag 频次；目标是否使用某标签由当前 PVF readback 决定。
