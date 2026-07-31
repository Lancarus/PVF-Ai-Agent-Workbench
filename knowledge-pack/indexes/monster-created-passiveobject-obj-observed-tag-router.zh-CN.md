# Monster 创建 PassiveObject：`.obj` 路由

状态：需验证

解析对象 ID 后读取真实 `.obj`，再按 `dictionaries/passiveobject-obj-fields.zh-CN.md` 展开动作、动画、AttackInfo、追踪、生命、数据块与销毁条件。

- 相对路径从当前 `.obj` 目录解析。
- `name_数字` 不是 registry ID。
- `[homing follow]` 后的数字按 token 选择 registry。
- 生命周期、阵营、碰撞和追踪字段只证明配置入口，不证明运行效果。
