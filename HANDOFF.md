# Mini Sales Handoff

## 文档用途

本文档是 Mini Sales 微信小程序的持续交接入口，用于记录当前范围、设计来源、工程约束、接口占位规则、任务状态和最近变更。

后续每次确认设计或完成页面后，应直接更新本文档，确保设计人员、前端开发人员和后端开发人员对当前实现边界有一致理解。

本文档不替代产品需求、Figma 设计稿或后端 API 文档；当内容冲突时，按“信息来源与优先级”执行。

## 相关文档

- `AGENTS.md`：本仓库内开发人员和 AI Agent 必须遵守的稳定工程、协作、隐私与验证规则；不承载具体功能定义。
- `docs/home-page-prd.md`：首页 `107:6040` 的功能清单、组件分析、开发顺序和 Mock 数据准备文档。

## 信息来源与优先级

1. 用户在当前项目中最新确认的需求。
2. 已确认的 Figma 目标 Frame、组件和设计变量。
3. 本文档中已明确标记为“已确认”的实现约定。
4. 微信小程序平台规范和当前代码库既有约定。

当前 Figma 来源：

- 文件：[Untitled](https://www.figma.com/design/kpT2Xd5s7zHkwDsiN1vzrm/Untitled?node-id=107-6040&m=dev)。
- 首个目标 Frame：`107:6040`，销售小程序首页。
- 分析页顶部参考节点：`279:15071`，顶部状态栏、导航栏和分析标签区域使用白色背景。
- 分析页筛选控件参考节点：`166:9097`，日/周/月/总/日历筛选与完播数排序控件。
- 分析页汇总数据卡片参考节点：`127:7894`，总发布、总阅读次数和总转发三项统计卡片。
- 分析页内容卡片参考节点：`107:7553`，内容缩略图、标题日期、打开图标和四项指标布局。
- 分析详情页参考节点：`173:11084`，内容分析导航、内容卡片和意向用户区域。
- 设计稿基准：iPhone 16，画板宽度 393px。
- 确认日期：2026-08-19。

未经确认的示例数据、占位文案和推测性交互不属于正式产品需求。

## 项目目标

根据 Figma 设计稿实现销售素材分享与潜在客户分析小程序。销售人员可以发布或选择图片、视频、文档、PDF、表格等素材并分享；访问者进入小程序内容页后，系统在合规、可识别的前提下记录本系统内的访问行为，帮助销售人员判断客户意向并及时跟进。

系统不能读取微信朋友圈原生浏览名单，也不能识别未进入小程序承载页或未合法授权的朋友圈浏览者。匿名访问与已识别访问必须在数据和 UI 中明确区分。

当前阶段不开发真实后端服务。所有依赖业务数据的位置使用可替换的模拟数据，并为后续开发人员保留明确、集中、可追踪的 API 接入位置。

## 当前范围

### 本期包含

- 按已确认的 Figma Frame 实现 WXML 页面结构。
- 使用 Less 还原颜色、字号、间距、圆角、阴影和响应式布局。
- 提取跨页面复用的视觉组件。
- 接入并本地保存 Figma 导出的图片和图标资源。
- 为列表、详情、统计、用户信息等动态内容准备类型定义和模拟数据。
- 为加载、空数据、错误和正常状态预留可展示的 UI 结构；具体状态以设计稿和用户确认为准。
- 为后续真实 API 接入保留统一入口和注释。

### 本期不包含

- 真实后端接口、数据库和管理后台。
- 真实登录、支付、订单提交、消息推送等业务闭环。
- 未在 Figma 或用户确认范围内的功能扩展。
- 以“看起来成功”的方式伪造支付、提交或服务端写入结果。

## 技术栈

- 微信原生小程序。
- TypeScript。
- WXML。
- Less。
- 微信开发者工具编译。
- 当前基础库版本：`2.32.3`。
- 当前渲染配置：Skyline + glass-easel。

引入第三方组件库、状态管理库或网络请求库前必须先确认；当前优先使用微信小程序原生能力。

## 当前工程基线

项目目前是微信官方 TypeScript + Less 快速启动模板：

- 页面：`pages/index/index`、`pages/logs/logs`。
- 公共组件：`components/navigation-bar/navigation-bar`。
- 全局样式：`miniprogram/app.less`。
- 页面配置：`miniprogram/app.json`。
- 尚未开始 Figma 页面实现。
- 尚未建立业务组件、设计变量、模拟数据和 API 接入层。
- 当前目录尚未初始化为 Git 仓库。

默认模板页面不是正式业务设计。收到并确认 Figma 页面范围后，可以替换或删除无用的模板内容。

## 建议目录边界

以下结构是当前交接约定，开始实现前可根据 Figma 页面规模进一步收敛：

```text
miniprogram/
  assets/               # Figma 导出的本地图片与图标
  components/           # 跨页面复用的展示组件
  pages/                # 页面级 WXML / Less / TypeScript / JSON
  services/             # 未来真实 API 的唯一接入层
  mocks/                # 开发阶段模拟数据
  types/                # 页面与 API 共用的数据类型
  utils/                # 无业务状态的通用工具
  app.less              # 全局样式与设计变量
```

页面不应直接散落 `wx.request` 调用。真实接口接入时，由 `services/` 统一处理请求、响应转换和错误归一化。

## Figma 还原规则

收到设计稿后，应补充并确认以下内容：

- 设计稿画板宽度与 `rpx` 换算方式。
- 状态栏、自定义导航栏和安全区处理方式。
- 全局颜色、字体、字号、行高、间距、圆角、边框和阴影变量。
- 可复用组件及其不同状态。
- 图片裁切模式、图标尺寸和资源格式。
- 长文案、超长数字、小屏幕及底部安全区适配规则。

实现时以设计意图和实际设备适配为准，不机械复制 Figma 的绝对定位。重复出现的视觉值应优先沉淀为全局变量或组件约定。

## 静态资源规则

- Figma 中的图片和图标应导出并保存到 `miniprogram/assets/`，不得长期依赖临时 Figma 资源 URL。
- 不凭空重绘无法确认的品牌图标或插画。
- 文件名使用小写英文和连字符，例如 `sales-empty-state.png`。
- 同一资源只保留一份，页面通过统一路径引用。
- 动态图片字段在模拟数据中使用本地占位资源；未来由 API 或 CDN 地址替换。

## 数据与 API 占位约定

### 分层原则

- `types/` 定义页面需要的数据结构，不把未知的后端字段写成既定事实。
- `mocks/` 提供可重复、无随机性的展示数据，覆盖正常、空数据和必要的异常状态。
- `services/` 暴露页面调用的方法；当前可返回模拟数据，后期在此替换为真实请求。
- 页面只消费 service 返回的数据，不直接依赖 mock 文件。
- UI 展示模型与未来后端响应不一致时，由 service 层完成转换。

### 接口占位格式

每个待接接口应保留以下信息：

```ts
// TODO(API): 接入「接口用途」真实接口
// Method: GET | POST | PUT | DELETE（待后端确认时明确标注）
// Endpoint: 待后端确认
// Request: 对应 TypeScript 类型
// Response: 对应 TypeScript 类型
// Error states: 待后端确认
```

不得把猜测的 URL、字段或成功结果描述为已确认合同。真实 API 接入后，应删除对应 mock 分支和 `TODO(API)`，并同步更新本文档。

### 页面状态

所有依赖数据的主要区域原则上需考虑：

- `loading`：正在加载。
- `success`：有数据。
- `empty`：请求成功但无数据。
- `error`：请求失败，可按需求提供重试入口。

如果 Figma 只提供正常状态，应先复用同一视觉体系补齐最小状态方案，并在实现前向用户确认。

## 组件边界

满足以下任一条件时，优先抽为公共组件：

- 在两个或以上页面重复出现。
- 存在多个明确视觉状态。
- 具有独立、稳定的输入属性。
- 页面内结构复杂，拆分后能明显降低维护成本。

组件以展示职责为主，不直接发起业务请求。页面负责组织数据流，service 负责数据来源。

## 任务状态约定

任务状态统一使用：

- `pending`：尚未开始。
- `in_progress`：正在处理。
- `done`：已实现并完成约定验证。
- `blocked`：存在无法继续的外部依赖，并需写明阻塞原因。

### 当前任务

| 任务 | 状态 | 说明 |
| --- | --- | --- |
| 初始化微信小程序工程 | done | 官方 TypeScript + Less 模板已存在 |
| 建立交接文档 | done | 创建本 `HANDOFF.md` |
| 建立 Agent 工作规则 | done | 创建 `AGENTS.md`，只维护稳定工程与协作边界 |
| 整理首版产品模块 | done | 素材发布、数据分析、意向分类、动态提醒、我的 |
| 获取并分析 Figma 设计稿 | done | 已读取首页节点 `107:6040` |
| 整理首页准备文档 | done | 已创建 `docs/home-page-prd.md`，等待用户确认 |
| 确认页面清单与实现范围 | done | 首页 `107:6040` 已确认，首轮仅静态 UI |
| 建立设计变量与公共组件 | done | 页面局部 Less 变量、复用 `navigation-bar`、新增 `bottom-tab-bar` |
| 实现页面视觉样式 | done | 首页三张摘要卡、AI 问候区和底部导航已实现 |
| 建立 mock 与 API 占位层 | done | 新增 `HomeOverviewViewModel`、Mock 与首页 service |
| 实现通知页面与首页通知跳转 | done | Figma `107:6253` 通知列表、通知 service/mock、本地资源与首页 tab 跳转已实现 |
| 首页像素级与真机适配验收 | in_progress | 开发者工具已打开；当前环境无法截取 GUI 画面，需人工核对 Figma |
| 其他页面视觉与真机适配验收 | pending | 后续页面实现后执行 |

## 验收基线

每个页面完成时至少检查：

- 页面结构、间距、字号、颜色、圆角和图片比例与已确认设计一致。
- 常见微信小程序屏幕宽度下无横向溢出或关键内容遮挡。
- 自定义导航栏、状态栏和底部安全区显示正常。
- 点击区域尺寸合理，滚动容器和固定元素不互相冲突。
- 动态区域可以切换正常、加载、空数据和错误状态。
- 页面没有直接请求尚未确认的真实接口。
- 所有后续接口位置都能通过 `TODO(API)` 搜索定位。
- 微信开发者工具编译无错误；有条件时补充至少一台真机预览。

## 更新约定

- 开始任务时，将状态改为 `in_progress`。
- 完成任务并验证后，将状态改为 `done`。
- 阻塞时改为 `blocked` 并在说明中写明原因。
- 新增页面、公共组件、API 占位或重要设计决定时，同步更新本文档。
- 最近变更按时间倒序记录，只保留对后续接手者有价值的信息。
- 不在文档中记录密钥、AppSecret、用户隐私数据或生产接口凭证。

## 最近变更

### 2026-08-19：按 Figma `166:9097` 重做分析页筛选控件

- 按节点还原两个 `32px` 高的 `#d3d8e0` 外框、`6px` 圆角、左侧五个 `34px` 单元格和右侧白色排序按钮。
- 使用用户提供的 `Frame 23.svg`，复制为 `miniprogram/assets/analysis/frame-23.svg` 后由分析页本地引用；未写入 Figma 临时资源 URL。
- 验证：`node --test tests/home-page.test.mjs`（18 tests passed）；新增筛选控件尺寸、颜色和本地图标资源断言。

### 2026-08-19：固定分析页顶部导航与标签栏

- 问题：分析页顶部导航已固定，但“作品分析 / 用户分析 / 总数据”标签栏仍会随页面上移。
- 处理：新增 `analysis-page__header`，将公共导航栏与标签栏组合为同一个 `position: sticky; top: 0` 的白色顶部区域；分析内容继续在下方滚动。
- 验证：`node --test tests/home-page.test.mjs`（17 tests passed）；新增顶部组合区域的结构与 sticky 样式断言。

### 2026-08-19：扩展分析标签栏白色背景到全屏宽度

- 问题：分析标签栏本身已是白色，但其左右 40rpx 页面留白仍显示浅蓝色。
- 处理：为 `.analysis-tabs` 增加 `margin: 0 -40rpx` 和 `padding: 0 40rpx`，让白色背景覆盖整屏，同时保持标签文字和下划线的原有横向对齐。
- 验证：`node --test tests/home-page.test.mjs`（17 tests passed）；新增样式断言覆盖全宽白色背景。

### 2026-08-19：按 Figma `279:15071` 将分析页顶部改为白色

- 调整分析页 `navigation-bar` 的背景为 `#ffffff`，并将作品分析/用户分析/总数据标签栏背景设为 `#ffffff`。
- 页面主体分析卡片区域继续使用原有浅蓝背景，避免扩大白色区域影响内容视觉。
- 验证：`node --test tests/home-page.test.mjs`（17 tests passed）；新增分析页顶部白色样式回归测试。

### 2026-08-19：公共导航栏滚动时固定在顶部

- 问题：分析页使用页面级滚动，公共 `navigation-bar` 处于普通文档流，滚动后顶部标题和返回按钮会随内容移出视口。
- 处理：在 `components/navigation-bar/navigation-bar.less` 的公共根节点增加 `position: sticky`、`top: 0` 和 `z-index: 1000`；保留原有导航栏高度占位，不遮挡页面首屏内容。
- 影响范围：所有复用 `navigation-bar` 的页面统一生效，包括首页、通知、分析和日志页。
- 验证：`node --test tests/home-page.test.mjs`（16 tests passed）；新增公共导航栏固定行为回归测试。微信开发者工具中的真实滚动视觉仍需人工核对。

### 2026-08-19：按 Figma `107:6723` 校准通知卡片

- 按目标节点修正通知卡片：固定高度 150px（`300rpx`）、内边距 12px（`24rpx`）、子项间距 16px（`32rpx`）、圆角 12px、头像 40px、正面缩略图 50×68px、按钮高度 24px。
- 按 Figma 坐标修正通知徽标与三层素材缩略图叠放；分隔线使用 `#F4F5F5`。
- 使用节点导出的头像与阅读徽标资源；未引用的高体积 PNG 已清理，继续使用仓库现有的压缩 JPG 缩略图以满足小程序预览包预算。
- 验证：`node --test tests/home-page.test.mjs`（15 tests passed）。

### 2026-08-19：修复开发者工具预览源码包超过 2MB

- 问题：预览时报错 `80051`，源码包为约 7762KB，超过 2MB 上限；主要原因是首页机器人图和通知/分析缩略图使用了未优化的 PNG。
- 处理：机器人图保留透明 PNG 并缩小到 `512 × 512`；展示型缩略图按页面展示尺寸转换为 JPEG，更新 analysis/notifications mock 路径；未修改预览体积开关，避免用临时放宽限制替代资源治理。
- 结果：`miniprogram/assets/` 从约 7723KB 降至约 558KB；新增静态资源预算测试，防止预览资源再次超过阈值。
- 验证：`node --test tests/home-page.test.mjs`（15 tests passed）；页面 JSON 解析通过；旧 PNG 缩略图引用已无残留。微信开发者工具 GUI 预览仍需用户重新编译后确认。

### 2026-08-19：移除通知页重复的小程序胶囊按钮

- 问题：通知页同时绘制了 Figma 导出的胶囊按钮和微信运行时自动提供的原生右上角菜单按钮，顶部出现两个关闭/菜单控件。
- 处理：删除 `notifications.wxml` 中的 `nav-action.svg` 右侧插槽、对应 Less 样式和未使用资源，保留微信原生胶囊按钮。
- 验证：`node --test tests/home-page.test.mjs`（13 tests passed）；`nav-action.svg` 已无页面引用。

### 2026-08-19：实现通知页与首页通知跳转

- 状态：done。
- 按 Figma 节点 `107:6253` 新增 `pages/notifications/notifications`，包含通知导航栏、意向筛选、按日期分组的通知卡片、头像、素材缩略图和联系按钮视觉态。
- 新增 `Notification*ViewModel`、固定 mock 与 `services/notifications.ts`，页面不直接依赖 mock；“联系用户”保持视觉-only mock 行为，不代表真实联系或后端写入。
- 从首页底部“通知” tab 通过 `wx.navigateTo` 跳转到通知页，并在 `app.json` 注册页面路径。
- Figma 图片与 SVG 资源保存到 `miniprogram/assets/notifications/`；motion 数据仅为根 Frame 0° 到 0° 的无视觉变化旋转，未新增伪动画。
- 验证：`node --test tests/home-page.test.mjs`（11 tests passed）；页面 JSON 4 个文件解析通过；通知资源 11 个文件存在；页面与组件无直接 mock import 或 `wx.request`。
- 未完成验证：当前环境没有 `npx` 或 `tsc`，无法执行 TypeScript 编译；微信开发者工具中的 GUI 截图与真机适配仍需人工核对。

### 2026-08-19：首页准备阶段

- 状态：静态 UI 已实现，等待 Figma 像素级人工核对。
- 读取 Figma 首页节点 `107:6040`，设计基准为 393px 宽的 iPhone 16 画板。
- 新增 `docs/home-page-prd.md`，整理首页 PRD、组件边界、从简单到复杂的开发顺序和 typed mock 结构。
- 确认首轮只实现正常态静态 UI，不接真实接口、不创建尚未设计的目标页面、不伪造真实用户与统计数据。
- 组件策略：复用现有 `navigation-bar`，新增最小 `bottom-tab-bar`；问候区、摘要卡和头像叠放首轮保留为首页内部结构。
- 实现文件：`pages/index/*`、`components/bottom-tab-bar/*`、`types/home.ts`、`mocks/home.ts`、`services/home.ts`；Figma 导出资源保存到 `assets/home/`。
- 验证：`node --test tests/home-page.test.mjs`（4 tests passed）；已使用微信开发者工具内置 TypeScript 完成项目级类型检查；首页 JSON 已解析通过。
- 未完成验证：桌面截图因运行环境无可用显示权限失败，需在微信开发者工具中对照 Figma 检查机器人裁切、卡片间距和底部安全区。

### 2026-08-19：底部导航图标清晰度修正

- 问题：原 Figma 导出的底部导航 PNG 仅为 22–24px，在 iPhone 16 Pro Max 的高像素密度屏幕上按组件尺寸放大后产生模糊。
- 处理：改用用户提供的四个完整 `45 × 45` SVG 卡片图标，保存为 `assets/home/tab-*.svg` 并由 `bottom-tab-bar` 直接引用；SVG 自带白色圆角卡片，组件不再重复绘制图标底框。
- 清理：已删除不再使用的 `icon-*.png`，不保留兼容路径或降级方案。
- 验证：静态测试 4 项通过，项目级 TypeScript 类型检查与相关 JSON 解析通过；仍需在真机或微信开发者工具中重新编译后做最终视觉确认。

### 2026-08-19：首页摘要卡片 Figma 校准

- 对照 Figma 节点 `107:6099` 更新摘要卡片：卡片高度 64px、圆角 12px、主文案 16px、辅助文案 14px、头像 28px，均按小程序 `rpx` 换算落地。
- 三张摘要卡均加入 `hover-class` 按压态，按压时使用 `transform: scale(1.02)`，松开后恢复原尺寸。
- 验证：`node --test tests/home-page.test.mjs`（5 tests passed）；项目级 TypeScript 类型检查与相关 JSON 解析通过。

### 2026-08-19：首页内容基线调整

- 根据真机标注，将首页主要内容的横向 inset 统一为 40px（小程序样式使用 `80rpx`），问候区与三张摘要卡共用同一左侧基线。
- 验证：`node --test tests/home-page.test.mjs`（6 tests passed）；项目级 TypeScript 类型检查通过。

### 2026-08-19：开发者工具实时编译

- 问题：`project.config.json` 的 `setting.compileHotReLoad` 原为 `false`，代码修改后开发者工具不会自动重新编译，表现为模拟器 UI 不更新。
- 处理：改为 `true`，与本地私有配置保持一致。
- 验证：`node --test tests/home-page.test.mjs`（7 tests passed）；项目配置 JSON 解析通过。

### 2026-08-19：首页左侧基线统一

- 明确对齐目标：问候语、三张摘要卡和底部“通知”按钮使用同一条左侧基线。
- 处理：首页红框主内容区域改为左右各 20px 内边距（`40rpx`）；底部导航同样使用左右各 20px 外边距（`40rpx`），四个固定宽度图标卡使用 `space-between` 分布。
- 验证：`node --test tests/home-page.test.mjs`（8 tests passed）；项目级 TypeScript 类型检查通过。

### 2026-08-19：分析页首版静态 UI

- 新增 Figma 节点 `107:7390` 对应页面 `pages/analysis/index`，从首页“分析”导航项进入。
- 页面包含：顶部返回导航、作品分析/用户分析/总数据切换视觉态、日/周/月/总筛选、排序控件、三项汇总数据和内容分析卡片列表。
- 新增 `types/analysis.ts`、`mocks/analysis.ts`、`services/analysis.ts`；service 保留 `TODO(API)`，当前只使用静态 Mock。
- Figma 导出的内容缩略图保存到 `assets/analysis/`，页面不依赖临时远程 URL。
- 交互范围：分析卡片支持 2% 按压反馈；首页点击“分析”跳转分析页，真实筛选、用户分析和统计接口暂不实现。
- 已按节点二次校准：页面背景 `#e8edf5`、汇总卡 `108 × 66px`（`216rpx × 132rpx`）及卡片阴影均与 Figma 对齐。
- 验证：`node --test tests/home-page.test.mjs`（14 tests passed）；项目级 TypeScript 类型检查与页面 JSON 解析通过。

### 2026-08-19：分析页筛选控件交互与资源校准

- 读取 Figma 节点 `157:9069`，完播数排序控件按 `32px` 外框、`28px` 白色内框和用户提供的三角形资源还原。
- 日、周、月、总、自定义五个周期选项均可点击；选中态使用单独的白色滑块，并通过横向 `transform` 过渡到对应位置。
- 用户提供的 `Polygon 2.svg` 保存为 `assets/analysis/polygon-2.svg`；已有 `Frame 23.svg` 继续作为自定义周期图标。
- 验证：`node --test tests/home-page.test.mjs`（18 tests passed）；项目配置、应用配置和分析页 JSON 解析通过；分析页两个 SVG 资源存在；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：分析页汇总卡片 Figma 校准

- 读取 Figma 节点 `127:7894`，将三张汇总卡片调整为横向 `10px` 间距、等宽伸展布局、`8px` 圆角、`10px` 内边距和 `1px` 白色边框。
- 汇总标签使用 `13px`、`#666666`；数值使用 `20px`、中等字重；保留 Figma 的白到 `#f0f5fa` 渐变和轻微底部阴影。
- 验证：`node --test tests/home-page.test.mjs`（18 tests passed）；项目配置、应用配置和分析页 JSON 解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：分析页内容卡片 Figma 校准

- 读取 Figma 节点 `107:7553`，将内容卡片按 `16px` 圆角、`15px` 内边距、`60 × 80px` 缩略图、`15px` 标题、`14px` 日期和 `12px/14px` 指标字体还原。
- 使用用户提供的 `Frame 2137.svg` 作为右上角打开图标，保存为 `assets/analysis/frame-2137.svg`；删除原先的文本箭头占位。
- 标题保留 Figma 的两行占位高度，确保日期和下方指标在不同标题长度下保持稳定垂直位置。
- 验证：`node --test tests/home-page.test.mjs`（19 tests passed）；项目配置、应用配置和分析页 JSON 解析通过；`Frame 2137.svg` 与用户提供资源字节一致；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：分析详情页 Figma 实现

- 读取 Figma 节点 `173:11084`，新增 `pages/analysis-detail/index`，包含内容分析导航、内容详情卡和意向用户卡片区域。
- 分析页内容卡点击后跳转详情页并携带卡片 ID；详情数据继续通过 `services/analysis.ts` 的 typed mock service 提供。
- 用户提供的 `Group 40.svg` 保存为 `assets/analysis/group-40.svg`，作为详情页顶部深色线条背景；Figma 意向用户头像资源保存为本地压缩 JPG。
- 验证：`node --test tests/home-page.test.mjs`（21 tests passed）；4 个 JSON 配置解析通过；`Group 40.svg` 与用户提供资源字节一致；详情头像资源存在；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：分析详情页意向用户筛选交互

- 意向用户筛选新增“全部”，默认展示全部用户。
- 四个筛选项支持点击和左右滑动，选中白色滑块带横向过渡；切换后列表只展示对应意向标签的用户。
- 验证：`node --test tests/home-page.test.mjs`（22 tests passed）；3 个 JSON 配置解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：用户分析页 Figma 实现

- 读取 Figma 节点 `145:7981`，在分析页接入用户分析视图：意向筛选、用户汇总卡片和用户列表均按 Figma 的尺寸、颜色、圆角、渐变和间距实现。
- 新增 `AnalysisAudienceUser` 类型及 typed mock 数据，使用本地压缩头像资源；页面继续只通过 `services/analysis.ts` 获取 ViewModel。
- 顶部“作品分析 / 用户分析 / 总数据”支持点击和左右滑动切换；用户分析中的“全部 / 高意向 / 中意向 / 低意向”同样支持点击和左右滑动，切换后列表只显示对应标签用户。
- “总数据”当前仅保留顶部切换态，因本次提供的 Figma 节点只覆盖用户分析视图，未擅自补充未确认的总数据内容。
- 验证：`node --test tests/home-page.test.mjs`（24 tests passed）；分析页及应用配置 JSON 解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock；静态资源仍低于预览包预算。

### 2026-08-19：用户分析列表容器与单用户行校准

- 读取 Figma 节点 `167:9158`，单个用户行改为 `44px` 头像、用户名称与意向标签、横向“阅读 / 观看作品 / 转发”统计和底部分割线的结构。
- 意向标签按 Figma 使用 `#高意向` 等文案、`20px` 高度、圆角胶囊和对应颜色；统计文字、数值、分隔线颜色和间距同步校准。
- 用户列表外层容器移除固定高度 `1038rpx`，改为 `height: auto`，用户数量增加时由内容自然撑高，避免列表被固定框截断。
- 验证：`node --test tests/home-page.test.mjs`（25 tests passed）；Figma 节点设计上下文和截图已读取；页面 JSON 解析及页面/组件依赖检查通过。

### 2026-08-19：总数据页 Figma 实现

- 读取 Figma 节点 `155:8353`，将分析页“总数据”页签接入完整内容：作品数据总览九宫格和阅读数据周趋势柱状图。
- 新增 `AnalysisChartPoint`、`AnalysisTotalViewModel` 及对应 typed mock；页面继续通过 `services/analysis.ts` 消费统一的 `AnalysisViewModel`。
- 总览卡按 Figma 使用三列布局、白到 `#f0f5fa` 渐变、`16px` 圆角、`10px` 内边距和 `13px/20px` 文本；阅读数据按 Figma 还原本周/本月控件、虚线网格、坐标标签和青色渐变柱形。
- 验证：`node --test tests/home-page.test.mjs`（26 tests passed）；分析页及应用配置 JSON 解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock；静态资源仍低于预览包预算。

### 2026-08-19：总数据阅读周期切换

- 阅读数据新增“本周 / 本月”点击切换，默认展示本周 7 根柱状图。
- “本月”使用 30 条固定 typed mock 数据，切换后列表渲染 30 根窄柱，并通过 `analysis-total__chart--month` 适配柱宽和间距。
- 页面通过 `visibleAnalysisReadTrend` 消费当前周期数据，未在 WXML 中写入业务计算或随机数据。
- 验证：`node --test tests/home-page.test.mjs`（26 tests passed）；页面 JSON 解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：用户详情页 Figma 实现

- 读取 Figma 节点 `173:10054`，新增 `pages/analysis-user-detail/index`，包含用户摘要卡、复制用户名按钮、阅读记录筛选态和四条内容记录。
- 分析页用户分析列表与内容分析详情页的意向用户列表均接入用户详情跳转，统一通过 `services/analysis.ts#getAnalysisUserDetail` 获取 typed ViewModel。
- Figma 导出的用户头像和四张阅读记录缩略图已下载并压缩为本地 JPG，保存到 `assets/analysis/`；页面不依赖临时远程资源。
- 验证：`node --test tests/home-page.test.mjs`（28 tests passed）；应用及新增页面 JSON 解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock；静态资源仍低于预览包预算。

### 2026-08-19：用户详情页复制成功提示

- 读取 Figma 节点 `298:15599`，用户详情页“复制用户名”按钮接入 `wx.setClipboardData`。
- 复制成功后显示固定于屏幕中心的黑色“复制成功”胶囊提示，按 Figma 使用 `14px` 文案、`10px 20px` 内边距和圆角样式，1 秒后自动消失；重复点击会重置计时，页面卸载时清理定时器。
- 验证：`node --test tests/home-page.test.mjs`（29 tests passed）；应用及新增页面 JSON 解析通过；页面与组件未发现直接 `wx.request` 或直接导入 Mock。

### 2026-08-19：移除复制操作的重复系统提示

- `wx.setClipboardData` 成功回调中调用 `wx.hideToast()`，隐藏微信自动弹出的“内容已复制”，避免与 Figma 的居中“复制成功”提示重复。
- 验证：`node --test tests/home-page.test.mjs`（29 tests passed）；页面与组件依赖检查通过。

### 2026-08-19：用户详情阅读记录标签切换

- 用户详情页“全部 / 阅读 / 转发”标签接入点击切换，白色选中滑块通过 `transform` 在三个位置间过渡。
- 列表视图通过现有记录的阅读进度、观看时长和转发数生成对应筛选结果，页面继续消费 typed ViewModel。
- 验证：`node --test tests/home-page.test.mjs`（30 tests passed）；页面与组件依赖检查通过。

### 2026-08-19：移除分析页自定义时间筛选

- 分析页时间筛选由“日 / 周 / 月 / 总 / 自定义”调整为仅保留“日 / 周 / 月 / 总”。
- 删除自定义日历图标 `assets/analysis/frame-23.svg` 及对应的类型、模板和样式引用，时间滑块仍按四个选项工作。
- 验证：`node --test tests/home-page.test.mjs`（30 tests passed）；页面配置解析通过；未发现 `frame-23.svg` 残留引用。

### 2026-08-19：补充产品范围与 Agent 规则

- 状态：done。
- 根据用户文案和需求表，确认首版产品域为素材发布、数据分析、意向分类、微信动态提醒和我的。
- 创建并修订 `AGENTS.md`，只保留原生小程序、TypeScript、WXML、Less、typed mock、集中 API 占位层等稳定工程规则；具体功能继续由本交接文档和后续产品规格承载。
- 补充工程决策原则：不保留向后兼容、选择最简单的长期实现、先跑通最小端到端闭环、保持模块化、先检查已有依赖、优先成熟方案，并参考已验证的产品模式。
- 明确分享归因边界：只能统计实际进入小程序承载页后的本系统访问事件，不能宣称读取朋友圈原生浏览名单。
- 明确头像、昵称、访问记录和意向标签按个人信息处理，真实身份、授权和数据留存方案仍待后端与合规确认。

### 2026-08-19：建立交接基线

- 状态：done。
- 创建 `HANDOFF.md`，确定其为 Mini Sales 的持续交接入口。
- 记录当前微信小程序模板基线、视觉实现范围和暂不实现事项。
- 建立 Figma 还原、静态资源、mock 数据及未来 API 占位约定。
- 当前下一步：获取带 `node-id` 的 Figma 页面链接并确认本期页面清单。

## 待确认事项

- 设计稿基准设备尺寸和适配目标。
- 是否需要展示加载、空数据、错误等完整状态。
- 页面间哪些交互仅做视觉效果，哪些需要可点击跳转。
- 后端是否已有 API 文档或字段定义。
- 访问者身份识别、授权提示、匿名访问和数据留存的后端与合规方案。
- 高、中、低意向规则发生重叠时的优先级和最终统计口径。
