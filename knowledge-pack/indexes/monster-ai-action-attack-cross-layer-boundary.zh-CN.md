# Monster AI / Action / Attack 跨层边界

状态：默认可用

本文件把现有 Monster、Monster AI、Monster Action / Animation、Monster AttackInfo、Monster Created PassiveObject 与 PassiveObject / AttackInfo / Hitbox 索引串成一条总边界。它是纯知识路由，不证明运行效果。

## 资料线索吸收位置

- Monster/Object 资料线索只用于提示 `.mob/.obj/.act/.atk/.ani` 这些文件族和字段名可能相关。
- PassiveObject / AttackInfo / Hitbox 资料线索只用于提示 `.obj -> .act/.atk/.ani` 和 hitbox 分层。
- Dungeon/Map 资料线索只用于提示出生、map/dungeon 入边和资源边界。

## 总边界

- `.mob` 定位怪物入口；`.ai` 决定结构化选择；`.act` 承接动作、触发和创建；`.obj` 承接对象生命周期；`.atk` 承接攻击 payload；`.ani` 承接帧级盒字段。
- 任意一层存在都不能替代其他层。
- 数字 ID 必须按父块和上下文选择正确 registry。
- 路径必须按 owner-relative 规则解析；相邻同名文件和其他目录同名文件不能补猜。
- 静态只读不证明 AI 正常、怪物刷出、召唤成功、对象销毁、命中、伤害、卡肉、击退、浮空、掉率、客户端资源完整或服务端放行。

## 可可用结论

本主题作为跨层总边界整理后，日常 Monster 行为或攻击问题默认先读本文件，再按命中层跳转到对应细分 task-card。除非出现未覆盖字段、断链或 registry 缺口，不默认重开 Monster、PassiveObject、AttackInfo 或 Hitbox 大范围采样。
