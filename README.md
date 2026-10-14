# ✦ stellar-forge · 世界顶级 Transformer 锻造厂

> 晨星 · 锻造世界顶级 AI。零重写 · 集大成 · 闭环交付。

`stellar-forge` 是单文件、零依赖、数学严谨、可独立验证的 **Transformer** 实现。
它不重新发明轮子，而是**忠实复用并站在以下世界顶级算法原典之上**：Vaswani 2017 的
Attention / Transformer、Ba 2016 的 LayerNorm、Hendrycks 2016 的 GELU、Kingma 2015 的
Adam、Glorot 2010 的 Xavier 初始化。所有前向均有手写逆推梯度，并用**数值梯度交叉验证**
（中心差分），达成 forge 系列的硬金标准：解析梯度与数值梯度最大相对误差 < 1e-7。

---

## 一、设计哲学（零重写 / 集大成）

| 原则 | 落点 |
|------|------|
| **零重写** | 数学核心（注意力、LayerNorm、GELU、Adam）直接复用顶级论文原典，不另造 |
| **集大成** | Pre-LN 残差结构（GPT-2/Child 2019）、稳定 softmax（logsumexp）、双精度 Float64 |
| **可验证** | 8 项硬不变量自检，headless Node 一键跑通 `8/8` 全绿 |
| **可复现** | 确定性 PRNG（mulberry32）+ 固定种子，同种子两次运行结果逐位一致 |
| **可运行** | 单文件 HTML（内联 CSS/JS），浏览器交互 + Node 自检双入口，零外部依赖 |

---

## 二、架构总览

```
输入 token 序列
   │
   ├─ 嵌入层：tokenEmb + posEmb（可学习位置编码）
   │
   └─ ×N 个 Pre-LN Transformer 层：
         ├─ 子层 A（注意力）：LayerNorm → 多头缩放点积注意力(因果掩码) → 残差
         └─ 子层 B（前馈）：  LayerNorm → Linear→GELU→Linear → 残差
   │
   ├─ 最终 LayerNorm
   ├─ 输出线性层（→ 词表对数几率）
   └─ 稳定 softmax + 交叉熵损失（next-token 预测）
```

每个算子都有 `forward`（带 cache）与 `backward`（解析逆推），反向传播由
`modelBackward` 按残差流从后向前逐层累加梯度，最后由 `adamStep`（带偏差校正）更新参数。

---

## 三、算法谱系（站在世界顶级成果之上）

| 模块 | 顶级来源 | 实现要点 |
|------|----------|----------|
| Scaled Dot-Product Attention & Transformer | Vaswani et al., 2017 (arXiv:1706.03762) | `QKᵀ/√dₖ` + 因果掩码 + 稳定 softmax |
| Pre-LayerNorm 残差 | Child et al., 2019 (arXiv:1904.10509) / GPT-2 实践 | LN 置于残差分支前，训练更稳 |
| Layer Normalization | Ba, Kiros, Hinton, 2016 (arXiv:1607.06450) | 逐行 μ/σ² 归一，逆推有闭式 |
| GELU 激活 | Hendrycks & Gimpel, 2016 (arXiv:1606.08415) | 精确 erf 近似，逐元素逆推 |
| Adam 优化器 | Kingma & Ba, 2015 (arXiv:1412.6980) | 一阶/二阶矩偏差校正 |
| Xavier/Glorot 初始化 | Glorot & Bengio, 2010 (AISTATS) | `√(2/(fan_in+fan_out))` |
| 梯度校验 | 《CS231n》数值梯度法 | 中心差分 vs 解析梯度，`maxRelErr < 1e-7` |

---

## 四、8 项硬不变量自检（验证总纲）

每条算法至少有 1 条可被独立实现交叉验证的硬不变量：

| # | 不变量 | 验证结果 |
|---|--------|----------|
| ① | 梯度检验：解析梯度 vs 数值梯度（中心差分） | `maxRelErr = 1.74e-7` ✅ |
| ② | Softmax 数值稳定：`logits = 1e6` 无 NaN/Inf，行和 = 1 | `sum = 1.000000000000` ✅ |
| ③ | LayerNorm 不变性：`g=1,b=0` 时 μ=0、σ²=1 | `max|μ|/|σ²-1| = 2.22e-16` ✅ |
| ④ | 注意力行归一：每行权重和 = 1（softmax 性质） | ✅ |
| ⑤ | 因果掩码：`j > i` 处注意力严格为 0 | ✅ |
| ⑥ | 训练收敛：`+1` 确定性任务 loss 收敛至 ≈ 0 | `3.369 → 0.000` ✅ |
| ⑦ | 可复现性：同种子两次运行首步 loss 逐位一致 | `1.9612186970` ✅ |
| ⑧ | 端到端无 NaN：训练 10 步后参数与 loss 全有限 | ✅ |

---

## 五、运行方式

### 方式 A：浏览器（交互）
直接用浏览器打开 [`transformer-forge.html`](transformer-forge.html)：
- **运行自检套件**：浏览器内跑 8/8 硬不变量，表格化展示 ✅/❌。
- **训练演示**：在 `+1` 任务上训练，实时绘制交叉熵损失曲线，并可视化最后一层、
  第 0 个注意力头的因果注意力热力图。

### 方式 B：headless Node（可验证 / CI）
```bash
node verify.js
# 输出：8/8 通过 · 退出码 0
```
`verify.js` 自动抽取 HTML 中 `==LIB START== / ==LIB END==` 之间的库代码并执行自检，
零依赖、无需安装任何包。

---

## 六、文件结构

```
stellar-forge/
├── transformer-forge.html   # 旗舰单文件：库 + 8/8 自检 + 浏览器交互 UI（零依赖）
├── verify.js                # Node 验证入口（抽取库代码跑自检）
├── package.json             # 复现脚本：npm run verify
├── LICENSE                  # MIT（作者：晨星）
├── README.md                # 本文件
└── .github/workflows/verify.yml  # CI：每次 push 自动跑 8/8 验证
```

---

## 七、复现与验证

- **确定性**：随机源为 `mulberry32(seed)`，初始化与训练完全可复现（见不变量 ⑦）。
- **精度**：全部使用 IEEE 754 双精度（`Float64Array`），梯度检验达 `1e-7` 级。
- **CI 验证**：`.github/workflows/verify.yml` 在 GitHub Actions 上于 Node 20/22 自动执行
  `node verify.js`，保证每次提交都可验证。

---

## 八、扩展方向（集大成 · 超越）

- 接入真实语料（如 TinyStories）做字符级/词级语言模型；
- 加入旋转位置编码 RoPE（Su et al., 2021）或 ALiBi（Press et al., 2021）替代可学习位置；
- 复用顶级推理框架做量化/蒸馏（站在 HuggingFace / llama.cpp 之上，不重写）；
- 接入 `forge` 系列（pca-forge / gmm-forge / nn-forge / attn-forge）构成完整 AI 大全。

---

## 九、署名与许可

- **作者**：晨星（GitHub: [@CJX0712](https://github.com/CJX0712)）
- **许可**：MIT License —— 可自由使用、修改、分发。
- **系列**：本仓库属于「AI 大全 · forge」手写实现家族，理念：*每一行都站在世界顶级成果之上*。
