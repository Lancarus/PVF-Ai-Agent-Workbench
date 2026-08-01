# Content Lifecycle / Dungeon Full Lifecycle 只读审计卡

状态：默认可用

用途：从区域入口一路闭合到副本、地图、怪物、对象、掉落、UI、音频和客户端资源候选，不保存特定副本的历史样本账。

## 默认链路

1. `region -> town -> worldmap -> dungeon`：每个数字按父块使用对应 `.lst`。
2. `.dgn -> map`：普通图、Boss 图、路径门、难度和门票块分别记录。
3. `.map -> monster / passiveobject / APC`：逐个解析 registry，并保留坐标、条件与重复项。
4. Monster 继续闭合 `.mob/.ai/.aic/.act/.atk/.ani`。
5. PassiveObject 继续闭合 `.obj/.act/.atk/.ani`。
6. 掉落、清算和翻牌分别进入独立掉落、clear reward 与 item registry 路线。
7. worldmap / UI / ANI / 音频只生成客户端资源候选，不把引用存在写成资源完整。

## 通过标准

- 每个 ID 都按父块解析到正确 registry，未解析项保持 unresolved。
- 所有引用文件已从当前目标 PVF raw readback。
- 回环、重复项、缺失文件和客户端候选没有被静默删除。
- 静态结论与进入、刷怪、AI、机关、扣票、掉落、翻牌、UI 和音频等运行行为明确分层。

## 何时需要实机

只有任务依赖真实进入、门票扣除、刷怪、Boss 判定、机关、奖励、UI 点击或音频播放时，才为高风险分支设计少量高收益测试。
