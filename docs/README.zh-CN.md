<table>
<tr>
<td width="50%"><a href="https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#film"><img src="../site/assets/edl-preview.gif" alt="点击观看影片：二维晶体管获得空间厚度，随后进入离子界面" width="100%"></a></td>
<td width="50%"><a href="https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#mcp"><img src="../films/mcp-explained/assets/mcp-preview.gif" alt="点击观看影片：程序窗口抬起，露出下面的几层" width="100%"></a></td>
</tr>
<tr>
<td><strong><a href="#edl">电双层栅控</a></strong> · 1 分 25 秒<br>为什么更大的栅电容，能用更低的栅压实现相同的沟道电荷变化？</td>
<td><strong><a href="#mcp">MCP, Explained in Motion</a></strong> · 2 分 17 秒<br>AI 模型只能写文字，它怎么操作一个程序？</td>
</tr>
<tr>
<td><em>一镜到底，从二维器件进入三维界面。</em><br>Three.js、Puppeteer、NumPy/SciPy，配合 Grok Bot 和 Codex</td>
<td><em>以旁白为时钟：每个节点都跟随说出的词。</em><br>Remotion、Canvas 2D、Node.js、ElevenLabs AI 配音，配合 Claude Code</td>
</tr>
</table>

# Scientific Animation Workflow

[English](README.md)

**用代码驱动的短片，讲清一个东西的工作原理。** 每部影片只讲一个机制，写明它主张什么、不主张什么，并探索一种制作技术。成片、可修改的源码和方法一起公开。

<a id="edl"></a>

## 电双层栅控

**[▶ 观看](https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#film) · [下载 MP4](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/download/edl-v6/edl-gating-v6.mp4) · [阅读案例](../films/edl-gating/README.md)**

**离子重排 → 界面电荷近距离分离 → 有效电容增大 → 相同 ΔQ 所需栅压降低。**

影片固定目标电荷变化，因此只比较栅压这一个问题。局限也直接放在画面里：较低的外部电压仍可对应很强的局部电场，材料本征击穿强度不会提高，电化学稳定性依然是限制。`C = εA/d` 中的 d 是界面电荷层的间距，不是电解质的厚度。

<a id="mcp"></a>

## MCP, Explained in Motion

**[▶ 观看](https://lix-works.github.io/Scientific-Animation-Workflow/gallery/index.html#mcp) · [下载 MP4](https://github.com/LiX-Works/Scientific-Animation-Workflow/releases/download/mcp-v1/mcp-explained-v1.mp4) · [阅读案例](../films/mcp-explained/README.md)**

**程序窗口只是最上面一层 → MCP 服务器把下面的接口包装成工具 → 模型读工具清单，写出请求 → 应用把请求发出去 → 程序完成工作 → 结果以文字返回，模型据此写下一个请求。**

模型始终碰不到软件。MCP 本身也不赋予 AI 控制程序的能力：控制来自程序自身的接口，协议统一的是这些接口的提供方式，所以一个程序只需一个服务器，所有兼容的应用都能使用。

## 同一种方法，两种时钟

两部影片都是时间的函数：每一帧、每个声音节点都由时间算出，因此可以复现，也便于修改。不同之处在于由什么决定时钟。

| | 电双层栅控 | MCP, Explained in Motion |
|---|---|---|
| **时钟** | 故事时间映射到播放时间 | AI 配音的逐词时间戳 |
| **适合** | 靠运动和屏幕文字推进的影片 | 脚本还在变化的旁白影片 |
| **修改的代价** | 改映射即可调整节奏 | 改一句旁白，后面的节点全部跟着移动 |

[共用工作流](workflow.md) · [以旁白为时钟](../films/mcp-explained/docs/method.md) · [新增案例](adding-a-case.md) · [实际检查范围](validation.md)

---

代码：[MIT](../LICENSE) · 原创影片、音频、图片与说明：[CC BY 4.0](legal/LICENSE-MEDIA.md) · [来源与致谢](legal/THIRD_PARTY_NOTICES.md)
