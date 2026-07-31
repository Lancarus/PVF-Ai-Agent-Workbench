不能直接批量写回；98% 相同或结果集命中很多不等于安全。先把截断、解析失败和 unresolved 单独报告，再对差异文件读回目标 raw no-simplified 原始文本。任何修改都要重建最小 change-set，经过受控 `pvf-change` dry-run、授权码和 readback。
