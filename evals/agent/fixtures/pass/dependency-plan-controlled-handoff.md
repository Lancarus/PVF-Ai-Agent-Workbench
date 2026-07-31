先重新读取目标 PVF 的 raw no-simplified 精确文本并核对最近邻样本，再建立受控 change-set。随后对同源同 change-set 做未阻塞 dry-run，使用 approval code、显式 output、备份、readback 和 manifest；不能直接 apply planner 报告。

