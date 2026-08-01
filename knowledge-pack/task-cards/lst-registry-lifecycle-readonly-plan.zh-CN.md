# LST Registry 生命周期只读计划

状态：默认可用

用途：导出任意 `.lst`，检查重复和引用闭合，并为新增 `ID + path` 生成冲突预览。

## 先读

- `dictionaries/lst-registry-lifecycle-fields.zh-CN.md`
- `workflows/lst-registry-lifecycle.zh-CN.md`

## 最小输入

- 目标 PVF 和目标 `.lst` 路径。
- 只读导出，或候选 `ID + TAB + relative path` 列表。
- 若登记新内容，提供引用方或业务目标。

## 执行

1. 按目标格式解析 ID / path，名称单列。
2. 输出 exact-existing、id-conflict、path-conflict、missing、malformed、clean-add。
3. 新脚本、registry 和引用方按一个原子计划审阅。
4. 默认只给 preview，不自动选择覆盖或去重策略。

## 禁止

- 只登记不创建文件，或只创建文件不登记。
- 用名称作为 registry 主键。
- 将一个 registry 的空闲 ID 外推到另一个 registry。
- 未预览冲突就追加行。

