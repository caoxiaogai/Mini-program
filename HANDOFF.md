# Mini Sales Handoff

## 文档用途

本文档是 Mini Sales 微信小程序的持续交接入口，用于记录当前范围、设计来源、工程约束、接口占位规则、任务状态和最近变更。

后续每次确认设计或完成页面后，应直接更新本文档，确保设计人员、前端开发人员和后端开发人员对当前实现边界有一致理解。

本文档不替代产品需求、Figma 设计稿或后端 API 文档；当内容冲突时，按“信息来源与优先级”执行。

## 相关文档

- `AGENTS.md`：本仓库内开发人员和 AI Agent 必须遵守的稳定工程、协作、隐私与验证规则；不承载具体功能定义。
- `docs/home-page-prd.md`：旧首页 `107:6040` 的历史准备文档；当前首页以新版 Frame `478:1234` 为准。

## 信息来源与优先级

1. 用户在当前项目中最新确认的需求。
2. 已确认的 Figma 目标 Frame、组件和设计变量。
3. 本文档中已明确标记为“已确认”的实现约定。
4. 微信小程序平台规范和当前代码库既有约定。

当前 Figma 来源：

- 文件：[Untitled](https://www.figma.com/design/kpT2Xd5s7zHkwDsiN1vzrm/Untitled?node-id=478-1234&m=dev)。
- 首个目标 Frame：`478:1234`，新版销售小程序首页。
- 素材页筛选卡片新版参考节点：`835:8666`，四个 32px 高的独立筛选卡片；选中态使用浅青渐变、`#7ACADB` 边框和轻阴影，未选中态边框为 `#D6D6D6`，筛选栏本身保持透明。
- 首页空数据状态参考节点：`486:2569`，通知空提示、作品空卡与发布入口、零值意向用户和今日数据。
- 首页「今日浏览最多」新版参考节点：`878:11389`，浅米黄到白色渐变外框内包含两张独立白色描边作品卡、浏览/转发/完播统计、高意向状态及底部查看更多按钮；替代旧节点 `723:11451` 与 `478:1620`。
- 首页底部导航参考节点：`478:1454`，悬浮胶囊、四个 24px 图标、10px 标签、发布加号和通知红点。
- 底部导航新版样式参考节点：`723:11206`，60px 高悬浮玻璃胶囊、主题色选中面、白色选中内容、`#333333` 未选中内容，以及 5px 背景模糊和轻投影。
- 首页低意向状态提示参考节点：`478:1612`，背景 `#F0F0F0`、文字 `#8A8E94`、48px 胶囊圆角。
- 首页意向用户卡新版参考节点：`887:12304`（替代旧节点 `723:11502` 与 `478:1568`），异形青白渐变背景、今日新增客户数、三张高/中/低意向渐变统计卡及底部查看更多入口。
- 首页今日数据卡新版参考节点：`926:14117`，由上方渐变标题矩形与下方白色内容矩形拼接，包含 22px 日期图标、浏览次数与阅读人数描边双指标卡，以及两行三列的总完播/转发/观看人数和高/中/低意向统计；替代旧节点 `892:12708` 与 `723:11527`。
- 首页底部背景参考节点：`507:2485`，底部 88px 的透明白到不透明白渐变、7.7px 背景模糊，以及导航胶囊的 40% 白色透明填充和 5px 模糊。
- 首页互动消息参考节点：`723:11434`，20px 圆角消息卡片、50×68px 缩略图以及超过三条后的两层灰色叠加底。
- 通知新版参考节点：`486:1850`，白色页面、32px 下划线筛选栏、50×68px 内容缩略图、行为状态胶囊和底部悬浮导航。
- 分析页顶部历史参考节点：`279:15071`（已由新版节点替代）。
- 分析页新版顶部参考节点：`804:7536`，复用通知页的固定渐变顶部、透明导航栏和胶囊分析标签。
- 分析页筛选控件参考节点：`166:9097`，日/周/月/总/日历筛选与完播数排序控件。
- 分析页周期与排序筛选参考节点：`517:3836`，32px 高的 `#E0E0E0` 外层、2px 内边距、10px 圆角和 13px 文案。
- 分析页用户分析参考节点：`507:1682`，高/中/低意向汇总卡、意向用户列表卡、内置意向筛选和阅读/完播/转发指标。
- 用户分析“高/中/低意向”汇总卡参考节点：`743:4027`，三张等分白色卡片、24px 意向图标、15px 内边距、10px 卡片间距和 12px 圆角。
- 分析页总数据参考节点：`587:8623`，日/本周/本月/总周期控件、数据总览双主指标与六项统计；浏览峰值折线图组件参考节点：`684:10088`。
- 分析页汇总数据卡片参考节点：`127:7894`，总发布、总阅读次数和总转发三项统计卡片。
- 分析页内容卡片参考节点：`107:7553`，内容缩略图、标题日期、打开图标和四项指标布局。
- 分析详情页参考节点：`173:11084`，内容分析导航、内容卡片和意向用户区域。
- 内容详情新版参考节点：`743:3538`，总阅读/转发汇总、我的作品列表、周期筛选与作品数据卡。
- 分析作品汇总卡新版参考节点：`743:3539`，两张总阅读次数/总转发卡片及对应 24px SVG 图标。
- 分析总数据总览卡新版参考节点：`743:5979`，数据总览图标、阅读总次数/人数主指标及 2×3 统计卡。
- 内容详情意向用户组件新版参考节点：`743:4059`，意向用户人数、周期/阅读量筛选和用户指标列表。
- 会员开通详情页参考节点：`933:795`，深色标准会员权益区、白色圆角套餐区、三档套餐、开通按钮与付费协议勾选。
- 设计稿基准：iPhone 16，画板宽度 393px。
- 首页新版确认日期：2026-08-24。

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
- 真实登录、余额提现、订单提交（会员虚拟支付除外）、以及未确认的业务闭环。
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
| 实现排行榜页面与排序交互 | done | Figma `311:15611` 排行榜页面、typed mock/service、本地资源与首页排名 tab 跳转已实现 |
| 实现素材页面与发布入口视觉 | done | Figma `173:12468` 素材双列卡片、`835:8666`/`835:8477` 筛选与顶部样式、首页素材 tab 跳转已实现 |
| 实现素材发布页面 | done | Figma `208:13581` 发布页、最多 9 张图片、无限制文案输入、草稿/发表占位交互及成功弹窗已实现 |
| 发布选择后直达详情页 | done | 选择图片/视频后先弹出拍摄或相册，PDF 进微信文件选择，再将已选素材带入发布详情；图片支持继续追加 |
| 发布类型遮罩保留素材页背景 | done | 点击素材页“发布素材 +”时保持当前素材页；弹层复用分析条件筛选样式，仅显示图片/视频/PDF，无遮罩内“取消”项 |
| 继续添加图片入口按 Figma 850:9370 更新 | done | 发布详情图片网格的追加槽位使用 `#F7F7F7` 背景、`#E5E5E5` 边框、10px 圆角和 `#8A8E94` 29px 十字；点击与最多 9 张逻辑不变 |
| 发布页图片与文案间距调整 | done | 图片网格与“添加文案”区域的垂直间距调整为 20px（`40rpx`） |
| 发布页底部操作区按 Figma 850:9374 更新 | done | 去掉底部操作区白色容器，保留页面背景；“存草稿”按钮增加 Figma `#E5E5E5` 边框，“发表”按钮尺寸与主题色保持不变 |
| 发布详情已添加图片描边 | done | 已添加媒体槽位使用 `2rpx solid #E5E5E5` 描边，继续添加入口样式保持不变 |
| 实现素材详情分享页 | done | Figma `229:14271` 作品详情页、素材卡片按 id 跳转、轮播图片、描述文案、底部分享按钮与 typed service/mock 已实现 |
| 素材内容详情上下背景色调整 | done | 发布后进入内容详情时，导航、说明区和底部分享操作区统一使用 `#F5F5F5`，媒体展示和按钮颜色保持不变 |
| 接入后端真实接口 | done | 统一 `services/request.ts` 请求层 + 微信登录；首页/分析/通知/素材/我的头像昵称走后端数据；排行榜后端无接口，暂用 Figma 预览 mock；余额/提现仍为视觉占位 |
| 首页像素级与真机适配验收 | pending | 新版首页已实现，等待开发者工具或真机进行视觉核对 |
| 首页改版（重新开始） | in_progress | 已按新版 Figma `478:1234` 重写首页结构、数据层、底部导航和本地资源 |
| 首页顶部背景 SVG 替换 | done | 使用用户提供的 Figma `887:12344` 导出资源 `miniprogram/assets/home-new/home-header-background.svg`，固定在首页首个滚动面板底层 |
| 首页问候标题字体与位置调整 | done | 按 Figma `899:12847` 将问候标题和副标题改用 Tencent Sans W7 子集，标题距导航底部 40px（`80rpx`） |
| 首页问候图标与标题引号 | done | 问候两行接入用户提供的火焰/星星本地图片；第一行动态问候文案包裹中文引号 |
| 首页问候图标动效与文案清理 | done | 移除副标题末尾太阳字符；火焰与星星图标加入错峰上下浮动无限循环动画 |
| 首页问候与下方内容间距调整 | done | Hero 高度调整为 `320rpx`，问候文案底部至互动消息区域保留 40px（`80rpx`）间距 |
| 首页超级榜单卡片改版 | done | 按 Figma `892:12562` 更新渐变与斜纹背景、标题副文案、绿色“查看详情”按钮和新奖杯插画；奖杯加入上下浮动循环 |
| 首页意向用户卡按新版样式替换 | done | 按 Figma `887:12304` 替换旧标题、头像和横排统计，使用本地 SVG 背景与高/中/低意向统计卡，保留现有数据合同及用户分析跳转 |
| 首页模块标题图标尺寸调整 | done | 今日浏览最多、意向用户、今日数据三个标题图标统一为 22px（`44rpx`）；底部导航图标不变 |
| 首页“今日数据”按 Figma 926:14117 更新 | done | 使用上方渐变矩形与下方白色矩形拼接背景，重做双主指标与 2×3 小指标布局；移除新版未展示的箭头和环比，保留整卡跳转 |
| 首页互动消息一键已读展开交互 | done | 默认仅显示圆形叉 icon；点击后胶囊平滑展开“一键已读”，再次点击执行全部已读并收起；通知页完整按钮保持原交互 |
| 首页“一键已读”控件高度调整 | done | 首页互动消息标题右侧的紧凑“一键已读”控件高度调整为 24px（`48rpx`） |
| 通知页“一键已读”控件尺寸调整 | done | 通知页完整“一键已读”控件左右内边距为 16px（`32rpx`），高度为 44px（`88rpx`）；首页紧凑版不变 |
| 实现「我的」页视觉切片 | done | 已按 Figma `519:5031` 接入首页第五个 tab；头像/昵称来自登录接口，余额为视觉占位，会员卡进入开通页 |
| 所有页面下拉刷新 | done | 滑到顶部再下拉刷新当前页数据；发布页只收起动画，不覆盖未保存编辑 |
| 分享素材浏览埋点 | done | 朋友打开素材详情/文档阅读页上报 `POST /tracking/event`，转发上报 `POST /tracking/forward`；浏览次数与意向由后端统计 |
| 推送意向门槛自定义 | done | 默认高意向；「我的」进入设置页三选一（低/中/高），经 `GET/PUT /user/notify-settings` 读写 `notifyIntentLevel` |
| 会员套餐与微信支付 | done | 六档：month / quarter / half_year / month_pro / quarter_pro / half_year_pro；「我的」会员卡进入 `/pages/membership/index`，经小程序虚拟支付开通。档位写入 `sales_user.member_tier` |
| 会员访客展示上限 | done | 非会员 8 人、普通会员 80 人、Pro 不限制；作用于首页互动消息、通知列表、用户分析访客列表。浏览量/完播/转发等统计不受限 |
| 设置页意向规则说明 | done | 「推送意向门槛」后「规则」打开意向判断标准弹窗，点空白关闭 |
| 总数据按日浏览峰值坐标轴 | done | 横轴 0/4/8/12/16/20/24，纵轴随浏览量取整；小时数据走 `GET /analysis/trend?timeRange=today` |
| 总数据按周浏览峰值坐标轴 | done | 横轴周一到周日用 1–7，纵轴随浏览量取整；数据走 `GET /analysis/trend?timeRange=week` |
| 总数据按月浏览峰值坐标轴 | done | 横轴 1 号到本月最后一天，数字隔 5 天显示；纵轴随阅读量取整；数据走 `GET /analysis/trend?timeRange=month` |
| 总数据按总浏览峰值坐标轴 | done | 横轴近两月最近 6 周用 1–6 表示第几周，纵轴随阅读量取整；数据走 `GET /analysis/trend?timeRange=all` |
| 用户详情同一作品浏览合并 | done | 同一作品只展示一条：进度取最大，观看时长/完播数/浏览次数/转发取合计 |
| 用户详情浏览记录完播数 | done | 每条浏览记录在观看时长和浏览次数之间展示完播数 |
| 用户详情作品意向展示 | done | 用户名下展示「#对N个作品高意向」；每条浏览记录展示该作品高/中/低意向 |
| 首页已看通知刷新后不再出现 | done | 看过的互动消息写入本地已读；刷新后同一条不再回到首页预览和未读角标 |
| 通知页按每次浏览拆条 | done | 同一用户每次浏览/转发各一条通知，数据走 `GET /analysis/notify/list` |
| 用户详情联系用户复制用户名 | done | 「联系用户」写入剪贴板后再显示复制成功提示 |
| 用户详情与用户轨迹标题图标尺寸调整 | done | “浏览记录”和“行为轨迹”标题图标统一为 22px（`44rpx`） |
| 作品详情导航增加首页键 | done | 返回键右侧显示线框房子图标，点击 `reLaunch` 回首页 |
| 今日浏览最多进入作品分析 | done | 首页「今日浏览最多」查看更多和单条作品都切换到分析页的「作品分析」 |
| 无浏览作品内容分析空白 | done | 从未被浏览/转发的作品打开内容分析时仍展示作品卡片和空意向用户，不再整页空白 |
| PDF 点击预览图查看 | done | 素材详情 PDF 去掉「点击查看」按钮，点击预览图进入阅读页 |
| PDF 与视频查看记浏览 | done | 打开 PDF/视频详情即上报 play；单页文档先 play 再 end；后端 end 补建也会计入浏览 |
| 进入小程序必须授权登录 | done | 首页和分享进入素材详情都先校验登录；未授权必须先登录，首次登录编辑头像昵称，可一键用微信头像和昵称 |
| 已发布作品二次编辑 | done | 作者在素材详情用「二次编辑」预填媒体和文案进入发布页，发表为新作品；访客仍显示「分享到朋友圈」 |
| 总数据主指标按周期环比 | done | 浏览总次数/人数随日、本周、本月、总分别较昨日、上周、上月、上两月；增加显示 +，减少显示 - 且为红色 |
| 用户轨迹接入真实埋点 | done | `GET /analysis/customer/journey`；浏览/完播/转发时间线，图片与 PDF 显示页数，视频显示秒数，转发显示第几次 |
| 发布页图片三列均分 | done | 已选图与加号按内容区三等分，一排 3 个；加号随格子缩放 |
| 全屏看图也记已读页 | done | 素材详情全屏预览用页内 swiper，滑动继续上报已看页数；双指捏合和双击可缩放 |
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

### 2026-09-02：未开通会员卡副标题按字上色

- Skyline 不支持 `background-clip: text`，渐变会铺成色块、文字透明看不见。副标题改为按 Figma 三色停（`#ffebb0` / `#ea83ff` / `#189e91`）给每个字上色，保留渐变观感。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "profile membership card uses the original Figma 911:13452" tests/home-page.test.mjs`。

### 2026-09-02：会员开通页一屏适配

- 标准/尊享开通页改为视口高度弹性布局：去掉 Figma 锁死的 `878rpx` 顶部高度，页面 `100vh` + `disableScroll`，权益区和套餐区按剩余高度伸缩。
- 套餐卡在空间不足时从 `134rpx` 收到 `96rpx`，底部安全区仍保留。两种档位同一套布局，无需滑动即可看完整页。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "membership page is registered" tests/membership-page.test.mjs`。在真机或模拟器用短屏（如 iPhone SE）打开标准/尊享开通页确认不滚动且内容完整。

### 2026-09-02：将 origin/developer-v2 合入 main-v2

- 已把 `origin/developer-v2`（`28af0b8`）合入当前 `main-v2`。
- 首页一键已读：滚动收起、扩大点击热区、关闭按钮居中，来自 developer-v2。
- 长列表进入时先渲染一页、下滑再加载，以及「我的」设置入口，仍保留 main-v2 的实现。

### 2026-09-02：标准会员权益追踪人数跟配置

- 开通页标准档「追踪人数 N 人」改为读取 `MEMBERSHIP_VISITOR_LIMIT_REGULAR`，当前联调值为 10，不再写死 Figma 的 80。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "premium membership switches to its confirmed unlimited tracking benefits" tests/membership-page.test.mjs`。

### 2026-09-02：上限卡「立即开通」进入标准会员页

- 「追踪已达上限」显示「立即开通」（未开通）时，首页互动消息、通知页和通知 Tab 都进入标准档（`/pages/membership/index?tier=standard`）。
- 显示「立即升级」（标准会员）时仍进入尊享档。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "membership visitor limits|profile tab exposes|home renders the Figma 949:2077|notification surfaces reuse" tests/membership-page.test.mjs tests/home-page.test.mjs`。

### 2026-09-02：「我的」未开通会员卡下移，避开头像

- 未开通「解锁言界阿乐会员」卡的倾斜装饰层会探到头像底部。仅给 `.home-profile__membership--inactive` 增加上边距到 `88rpx`，标准/尊享卡仍用 `40rpx`。
- 权益蒙层起点同步下移到 `418rpx`，仍紧贴未开通卡下方。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "profile membership card uses the original Figma 911:13452|profile feature mask begins" tests/home-page.test.mjs`。

### 2026-09-02：将 origin/developer-v2 合入 main-v2

- 已把 `origin/developer-v2`（`ad8e5b3`）合入当前 `main-v2`。
- 首页一键已读收起/展开交互，以及发布页、「我的」顶部竖线背景恢复，来自 developer-v2。
- 长列表进入时先渲染一页、下滑再加载仍保留 main-v2 的实现。

### 2026-09-02：首页一键已读改为收起后展开交互

- 首页互动消息右侧默认显示 48rpx 圆形胶囊和叉 icon；点击叉后以 300ms 缓动展开为 144rpx 胶囊并显示“一键已读”。
- 展开后叉 icon 隐藏；点击屏幕其他区域通过透明全屏点击层收起并恢复叉 icon，再次点击“一键已读”复用现有 `onHomeMarkAllReadTap` 清除全部首页互动消息；通知页非 compact 按钮保持原有一次点击全部已读。
- 收起态固定为不可收缩的 `48rpx × 48rpx` 正圆；展开态监听按钮和全屏点击层的滑动手势，滚动开始即恢复为圆形叉 icon。
- 展开胶囊监听普通 `bindtouchmove`，只触发收起而不阻止首页 `scroll-view` 滚动；全屏点击层同样监听滑动。
- 首页 `onHomeScroll` 通过递增 `collapseKey` 通知 compact 组件收起，确保 `scroll-view` 吞掉组件触摸事件时仍会恢复为圆形叉 icon。
- 一键已读出现和收回统一使用 300ms 缓动，文字通过宽度与透明度过渡，不再瞬间消失；展开态文案在胶囊内保持左右等距居中。
- 修复 compact 点击扩展层覆盖叉 icon 导致无法展开的问题，扩展层改为不拦截子元素事件。
- 展开态胶囊取消隐藏叉 icon留下的不对称预留，文案在 144rpx 胶囊内水平居中，左右间距一致。
- “一键已读”和 X 使用独立的透明触控层，点击目标补足到 32px，视觉尺寸不变。
- 验证：首页互动消息与通知页一键已读定向测试 3 项通过；组件交互 harness 与 `git diff --check` 通过。

### 2026-09-02：发布与我的顶部背景恢复旧样式

- 移除素材页（发布入口）、首页内嵌素材面板和「我的」页新增的彩色模糊 SVG 背景。
- 恢复素材页顶部浅灰纵向渐变，并将发布页、首页内嵌发布面板和个人中心的竖线层统一改为本地 `miniprogram/assets/line-bg.svg`（来自用户提供的 `line_bg.svg`）；不影响首页首屏自己的彩色背景。
- 验证：竖线背景定向测试 5 项通过；SVG 经 `xmllint` 校验；`git diff --check` 通过。

### 2026-09-02：将 origin/developer-v2（68d8d35）合入 main-v2

- 已把 `origin/developer-v2`（`68d8d35`）合入当前 `main-v2`。
- 会员限制提示、会员开通页深色权益区和标准会员卡视觉更新来自 developer-v2。
- 长列表进入时先渲染一页、下滑再加载仍保留 main-v2 的实现。
- 「我的」会员卡沿用 developer-v2 的 Figma 标准会员卡（剩余追踪人数与进度条），不在个人中心另放已用/可用追踪人数块。昵称行右侧保留「设置」入口，进入推送意向门槛页。

### 2026-09-02：会员卡标题在 Skyline 下可见

- 「我的」尊享/标准会员卡标题不再用 `background-clip: text` + 透明字（Skyline 会裁成空白或渐变色块）。改为实体色显示「尊享会员」「标准会员」。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "profile uses Figma 949:2541|profile uses Figma 953:4412" tests/home-page.test.mjs`。

### 2026-09-02：开通/升级/续费按钮按当前档位变化

- 追踪上限卡：标准会员显示「立即升级」，未开通显示「立即开通」。
- 会员开通页：当前档与所在页一致时显示「立即续费」，否则「立即开通」。尊享会员进入标准档时，套餐、开通按钮和协议勾选全部置灰且不可点。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs --test-name-pattern "home renders the Figma 949:2077|notification surfaces reuse" tests/home-page.test.mjs`。

### 2026-09-02：升级入口打开尊享会员开通页

- 「追踪已达上限」的「立即升级」，以及「我的」标准会员卡，都进入会员页尊享档（`/pages/membership/index?tier=premium`），展示尊享套餐。
- 「追踪已达上限」的「立即开通」、以及「我的」未开通卡，进入标准档。尊享卡续费落在尊享档。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs --test-name-pattern "profile tab exposes" tests/home-page.test.mjs`。

### 2026-09-02：追踪上限卡只在有未展示访客时出现

- 首页「追踪已达上限」卡移入「互动消息」区块，通知页仍放在通知列表顶部。
- 仅当当前档位有上限，且独立访客总数超过上限（确实有未展示的人）时展示；人数刚好用满但没有被截掉的人不展示。尊享会员不展示。
- `GET /membership/me` 增加 `hasUnshownVisitors`；查询失败时不展示该卡。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs --test-name-pattern "membership tracking-limit|visitor limits|membership access" tests/home-page.test.mjs`。重启 aisales 后看首页互动消息与通知页。

### 2026-09-02：会员页按档位拆开套餐

- 标准会员只展示 `month` / `quarter` / `half_year`（一个月会员、季度会员、半年会员）。
- 尊享会员只展示 `month_pro` / `quarter_pro` / `half_year_pro`（一个月会员pro、季度会员pro、半年会员pro）。
- 切换档位时套餐列表一起切换，并尽量保留同时长选项；尊享会员进入页面时默认落在尊享档。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs`。

### 2026-09-02：尊享会员固定走尊享卡

- 「我的」尊享卡不再用 WXML 字符串 `cardKind === 'premium'` 判断（Skyline 下会落到非会员解锁卡）。改由页面把 `isPremium` 算成布尔值，组件 observer 切到 Figma `953:4412` 卡片。
- 尊享卡背景改用 Figma `953:4413` 导出的 `membership-premium-card.png`；文案仍为「尊享会员」「你是尊贵的尊享会员，享无限追踪人数」和「续费」。
- 回到首页或切到「我的」时重新拉 `GET /membership/me`，避免开通后仍显示开通前的解锁卡。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "profile" tests/home-page.test.mjs`。

### 2026-09-02：尊享会员展示尊享卡

- 「我的」页按档位切换会员卡：未开通用解锁卡，标准会员用 Figma `949:2541`，尊享会员用 Figma `953:4412`。
- 会员状态重新走 `GET /membership/me`；尊享卡展示到期日、无限追踪说明和续费按钮。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "profile" tests/home-page.test.mjs`。

### 2026-09-02：标准/尊享会员展示、升级改期与追踪人数

- 「我的」与会员页：标准会员 / 尊享会员；未开通在「我的」仍为「解锁言界阿乐会员」。
- 标准会员升级尊享时，有效期从开通当天重算套餐时长，不叠加上一档剩余天数。尊享续费仍从当前到期日叠加。
- 未开通和标准会员在「我的」展示已用追踪人数（三页已展示的独立访客）和可用追踪人数（上限 8 / 10）。尊享不展示该项。
- 验证：重启 aisales；重新编译小程序后看「我的」档位文案与人数。

### 2026-09-02：会员升级后按新档位补出原先未展示的访客

- 埋点始终完整记录。展示和推送按「首次浏览顺序 × 当前档位上限」：非会员 8 人，普通会员 10 人（联调暂值，正式 80），Pro 不限制。
- 未开通时第 9 人浏览不进互动消息、通知、用户分析，也不推服务号。开通普通会员后补出第 9、10 人已有记录；再开通 Pro 后解限后续访客。
- `GET /analysis/notify/list` 与 `GET /analysis/customer/list` 都按当前档位过滤。浏览量、完播、转发、意向汇总仍用完整统计。
- 验证：重启 aisales；先用非会员看满 8 人，再让第 9 人浏览（应不出现），开通普通会员后刷新应看到第 9 人。

### 2026-09-02：按会员档位限制访客展示

- 非会员最多展示 8 个独立访客，普通会员 80 个，Pro 展示全部。作用于首页互动消息、通知页，以及分析页/首页分析 Tab 的用户分析列表。
- 限额按 `customerId` 去重：通知、互动消息和用户分析都只展示**最先出现**的 N 个访客；升级会员后按新上限补出后面的人。超限访客不推服务号。下滑加载不能超过上限。
- 浏览量、完播数、转发数、意向汇总和今日数据等统计仍用完整数据，不按会员裁剪。
- 后端 `GET /membership/me` 增加 `tier`：`none` / `regular` / `pro`。开通时写入 `sales_user.member_tier`；已有库执行 `sql/upgrade_member_tier.sql`。未写档位的有效会员按最近一笔已支付订单回填。查询会员失败时按非会员（8 人）处理。
- 内容分析意向用户、用户详情、作品分析卡片不在本期范围。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs tests/home-page.test.mjs`。

### 2026-09-02：会员增加三个 Pro 档位

- 套餐 id 新增 `month_pro` / `quarter_pro` / `half_year_pro`，时长分别为 1 / 3 / 6 个月，与普通档并存。开通后仍只延长 `member_expire_at`，不区分 Pro 权益。
- Pro 价格尚未确认，后端暂用联调占位价 0.03 / 0.04 / 0.05 元。改价只改 `MembershipPlan.java`，并在虚拟支付后台创建同 id 道具后发布到现网。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs`。

### 2026-09-01：长列表进入页面时先渲染一页，下滑再加载

- 素材、通知、作品分析、用户分析、排行榜、内容分析意向用户、用户浏览记录均不再把全部卡片一次性挂到页面上。进入时先展示 10 条，滑到底部再追加下一批。
- 后端列表接口仍一次返回完整数组（分页协议未确认）。缩略图、头像和 PDF 第一页只在当前可见窗口补全，避免进页时下载全部媒体。
- 文档阅读页仍按可见页预加载图片；用户轨迹事件量小且底部有联系按钮，仍一次渲染全部事件，避免按钮随追加下移。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/list-window.test.mjs tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，长列表滑动需真机确认。

### 2026-09-02：按 Figma 933:795 更新会员开通详情页

- `/pages/membership/index` 已替换为深色会员权益区与白色圆角套餐区，复用现有自定义导航栏并适配顶部、底部安全区。
- 套餐价格继续来自 `GET /membership/me`，仅补充设计确认的中文时长、优惠力度以及默认选中三个月套餐；原有小程序虚拟支付、订单同步和错误处理链路保持不变。
- 新增付费协议勾选门控，未勾选时不发起登录、下单或支付；尊享会员当前只保留不可点击的视觉入口，未伪造尚未确认的套餐与接口。
- Figma 权益勾选图标已保存为 `miniprogram/assets/membership/check.svg`。
- 会员页进入和回显时通过 `wx.setNavigationBarColor` 设置白色系统状态栏前景（时间、电池、信号、返回）；离开页面恢复黑色前景。
- 导航层移除额外纯黑背景，返回图标改用导航栏传入的前景色渲染，保持透明背景下的白色可见状态。
- 验证：会员页结构、套餐映射、默认选择与活跃会员文案定向测试 5/5 通过；页面 JSON 与 SVG 语法检查通过；`git diff --check` 通过。微信开发者工具已成功打开项目，未获得可机器读取的编译结果；真机支付与视觉验收待执行。

### 2026-09-02：切回 Figma 949:2541 标准会员成功态

- 个人中心已开通会员态切回标准会员卡：深绿金色渐变背景、标准会员标题、升级尊享会员文案、剩余追踪人数和 58/80 进度条。
- 按用户截图修正进度条段宽：Figma 的 2px 竖线换算为 `4rpx`，间距为 `4rpx`，并使用 `space-between` 让 80 段在内容容器内均匀展开、与上方文案两端对齐。
- 移除尊享会卡片 `953:4412` 的临时展示资源与续费按钮；会员卡点击进入会员页的现有交互保持不变。
- 验证：标准会员卡相关回归测试与静态检查已完成。

### 2026-09-02：按 Figma 953:4412 更新尊享会会员卡

> 此版本随后按用户选择切回 Figma `949:2541` 标准会员成功态，当前不作为运行中的展示方案。

- 个人中心已开通会员态改用 Figma `953:4412` 的 353×160px 尊享会卡片：本地渐变背景、尊享会员渐变标题、到期信息、说明文案和续费按钮。
- 删除旧标准会员卡的追踪人数与进度条展示；会员卡点击进入会员页的现有交互保持不变。
- Figma 背景已保存为 `miniprogram/assets/profile/membership-premium-card.svg`，展示数据仍集中在 `services/profile.ts`，到期日暂沿用 `2026.11.20` 的开发占位。
- 验证：尊享会卡片相关 5 项回归测试通过；背景 SVG 经 `xmllint` 校验；`git diff --check` 通过。当前环境未提供 TypeScript 编译器或微信开发者工具，未执行对应编译检查。

### 2026-09-01：将 origin/developer-v2 合入 main-v2

- 已把 `origin/developer-v2`（`6876d4f`）合入当前 `main-v2`。
- 首页问候、意向用户、今日数据、今日浏览最多和超级榜单视觉更新来自 developer-v2。
- 通知未完成文案按素材类型区分仍保留 main-v2 的实现。

### 2026-09-01：会员开通改接小程序虚拟支付

- 会员属虚拟商品，不再调用 `wx.requestPayment` / JSAPI。开通改为道具直购：`wx.login` 换 `session_key`，后端签发 `signData` / `paySig` / `signature`，前端原样传给 `wx.requestVirtualPayment`（`mode=short_series_goods`）。
- 后端配置 `wechat.xpay.offer-id`、`app-key`（体验版/正式版 `env=0` 用现网 AppKey）。未填齐时下单返回「虚拟支付尚未配置」，不会假装支付成功。
- 小程序后台需创建三个道具，**productId** 与套餐 id 一致：`month` / `quarter` / `half_year`，标价与 `amountFen` 一致（当前测试 1 / 2 / 3 分）。当前 `env=0`，必须点「发布到现网」；只上传开发版会报 `-15010`。刚发布约 10 分钟生效（`-15014`）。发货推送 URL：`https://host/api/pay/xpay/notify`（响应 `ErrCode`/`ErrMsg`，不是 `Result`）。
- 支付成功后仍轮询 `POST /membership/orders/{outTradeNo}/sync`；本地无公网回调时可走 `xpay/query_order` 查单开通，并补调 `xpay/notify_provide_goods`，避免微信后台一直显示未发货。进入会员页也会对最近一笔已支付订单补发货通知。
- iOS 虚拟支付最低 1 元，当前 ¥0.01 测试价在 iPhone 上会直接拦截；需微信 8.0.68+、虚拟支付后台打开「苹果支付」、小程序简称已审核。体验版必须 `env=0`，否则 `-15011`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs`。真机需填 OfferId/AppKey、发布道具并重启后端后验收。

### 2026-09-01：微信支付改用商户平台公钥

- 新商户没有平台证书，`GET /v3/certificates` 会 404。SDK 改为 `RSAPublicKeyConfig`，读取商户平台「API安全」里申请的微信支付公钥。
- 需配置 `wechat.pay.public-key-id`（`PUB_KEY_ID_...`）以及按环境覆盖的 `public-key-path`（与 `apiclient_key.pem` 同目录的 `pub_key.pem`）。

### 2026-09-01：去掉「我的」页毛玻璃遮罩

- 原先 `.home-profile__locked-overlay` 从余额卡附近盖到页面底部，并带 `backdrop-filter`，余额和会员卡会被发虚。会员已是可点入口，去掉这层遮罩，页面内容清晰显示。
- 「尽情期待」模块保留，不再垫在模糊层上。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern "profile" tests/home-page.test.mjs`。

### 2026-09-01：会员套餐接入微信支付

- 套餐当前为联调测试价：1 个月 ¥0.01、3 个月 ¥0.02、半年 ¥0.03。上线前改回 29.9 / 79.9 / 139.9。
- 后端新增 `sales_user.member_expire_at`、`membership_order`，以及 `GET /membership/me`、`POST /membership/order`、`GET /membership/orders/{outTradeNo}`、`POST /membership/orders/{outTradeNo}/sync`。套餐常量在服务端，不以页面写死的价格下单。
- 会员支付已于同日改接虚拟支付（见上条）。原 JSAPI / `POST /pay/wechat/notify` 不再用于开通会员。
- 已有库执行 `sql/upgrade_membership.sql`。
- 本期不根据会员状态关闭分析或其他功能。会员权益范围待确认。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/membership-page.test.mjs tests/home-page.test.mjs`。

### 2026-09-01：通知未完成文案按素材类型区分

- 未看完时：图片仍显示「未滑动看完所有图片」，PDF/表格显示「未浏览完文件」，视频显示「未完播视频」。转发和已完成浏览文案不变。
- 类型优先用 `/material/mine` 的作品类型，通知接口也补了 `fileType`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启。当前环境无微信开发者工具 GUI，需真机分别看图片/PDF/视频通知。

### 2026-09-01：首页“今日数据”背景按 Figma 926:14117 重写

- 将今日数据卡背景替换为 Figma 导出的 `Group 78` 原始 SVG `today-data-background-926.svg`，由 `Rectangle 238`（顶部渐变标题矩形）与 `Rectangle 239`（底部白色内容矩形）拼接组成。
- 今日数据卡底层背景改为透明，避免共享卡片样式的白色背景填平两个矩形之间的透明间隙；这样可保留 Figma 的上下矩形分段轮廓。
- 保留标题与内容之间的浅灰虚线分隔（`2px` 高、`4px` dash、`4px` gap）和现有点击、数据绑定逻辑；删除单个 Union 异形背景实现。
- 验证：今日数据相关回归测试 3 项通过，`git diff --check` 通过。

### 2026-09-01：首页超级榜单卡片改版

- 按 Figma 节点 `892:12562` 将首页超级榜单入口调整为 `300rpx` 高卡片，使用米黄到浅绿渐变、斜向装饰纹理、白色描边和绿色“查看详情”按钮。
- 奖杯替换为 Figma 导出的透明 PNG 并压缩为 `351 × 351`，在保持 3× 资源尺寸的同时控制小程序包体；加入 `home-ranking-trophy-float` 2.8 秒上下浮动无限循环动画。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（158 项全部通过）；`git diff --check` 通过。当前环境无微信开发者工具 GUI，需真机确认卡片裁切和动效节奏。

### 2026-09-01：首页超级榜单卡片渐变与纹理细化

- 描边改为顶部 100% 不透明、底部 0% 不透明的垂直渐变；底色改为绿色渐变落在卡片底部。
- 使用本地 `ranking-texture.svg` 作为斜向纹理层；“查看详情”按钮按 Figma `892:12608` 更新为 86×32px、渐变填充与轻投影。
- 用户提供的 `Union.svg` 与现有今日数据背景资源用途一致，未重复复制资源。
- 验证：完整首页与发布入口回归测试 167 项通过，`git diff --check` 通过。

### 2026-09-01：首页超级榜单卡片背景透明度与底部光晕调整

- 主背景改为 `#FEE4B7` → `#FFFBE7` 的右向左渐变，背景色不透明度调整为 50%。
- 接入用户提供的 `Group 79.svg` 双模糊球体资源，作为卡片底部绿色光晕层；纹理、奖杯和按钮层级保持不变。
- 验证：完整首页与发布入口回归测试 167 项通过，`git diff --check` 通过。

### 2026-09-01：首页超级榜单卡片透明度分层修正

- 主背景渐变恢复为 100% 不透明；斜向纹理 SVG 单独设置为 50% 不透明，底部双模糊球体保持独立图层。
- 验证：完整首页与发布入口回归测试 167 项通过，`git diff --check` 通过。

### 2026-09-01：首页超级榜单奖杯浮动幅度调整

- 奖杯上下浮动峰值由 `-8rpx` 调整为 `-14rpx`，单侧幅度增加约 3px，动画周期与缓动保持不变。
- 验证：完整首页与发布入口回归测试 167 项通过，`git diff --check` 通过。

### 2026-09-01：首页意向用户卡按 Figma 887:12304 更新

- 将首页意向用户区域替换为 Figma 异形青白渐变卡片：顶部展示今日新增客户数，中部展示高/中/低意向三张渐变统计卡，底部保留“查看更多”入口。
- 新增并本地保存 `intent-card-background.svg`、高/低意向图标和用户图标；中意向横线按设计使用原生 Less 绘制。
- 删除旧叠放头像展示及对应 `previewAvatars` ViewModel 字段与媒体预加载分支；现有 `onIntentSummaryTap` 跳转和统计接口不变。
- 验证：首页定向与完整回归测试通过；当前环境无法获取开发者工具屏幕截图，需在开发者工具或真机确认最终像素对齐。

### 2026-09-01：首页意向用户卡左右间距调整

- 统计卡组改为内容区域内等分伸缩，避免固定宽度在窄屏下挤出右侧；卡片左右内边距保持 20px（`40rpx`）。
- 验证：完整首页与发布入口回归测试 167 项通过，`git diff --check` 通过。

### 2026-09-01：首页“今日数据”按 Figma 892:12708 更新

- 首页“今日数据”卡替换为 Figma `892:12708` 的 353×287px 新版结构：顶部渐变标题带、标题与主指标之间的浅灰虚线分隔、双主指标描边卡和两行三列小指标；标题区不再绘制额外的实线 `border-bottom`。
- `today-data-background-926.svg` 已按用户提供的 Figma `Union.svg` 原始矢量资源更新并保存在 `miniprogram/assets/home-new/`；移除旧版标题箭头和环比展示，现有日数据、意向数据以及 `onTodayDataTap` 跳转行为保持不变。
- 动态数字继续使用等宽数字；整卡保留现有 `0.96` 按压反馈，未新增依赖、接口或数据字段。
- 验证：新版定向回归测试通过；微信开发者工具 CLI `preview` 编译通过，预览包 1,924,145 Byte。完整回归 167 项中 165 项通过，剩余 2 项为并行排行榜改版后尚未同步的旧按钮/动效断言，与本卡片无关。当前系统未授予屏幕录制权限，无法保存模拟器截图，仍需在开发者工具或真机确认最终视觉。

### 2026-09-01：首页“今日浏览最多”按 Figma 878:11389 更新

- 外层卡片改为 `#FFF8E4` 到白色的顶部渐变并增加 2px 白色描边；标题改为 16px、`#333333` 粗体，右箭头按设计缩小为 4.5×9.5px。
- 两条作品改为间距 10px 的独立白色卡片，每张使用 1px `#F4F5F5` 描边和 15px 圆角；移除旧分隔线，统计区与作品信息间距调整为 20px。
- 底部“查看更多”继续进入作品分析，使用 40px 高、`#F0F1F2` 背景和 `#666666` 文案；作品数据、意向标签、动态缩略图和既有接口合同不变。
- 复核 Figma 导出资源：箭头与现有资源字节一致；眼睛图标路径、渐变和尺寸一致，仅 SVG 元数据不同，因此继续复用现有本地资源。
- 验证：新版卡片、跳转、空状态和全局描边例外定向回归 6/6 通过；微信开发者工具 WXML 编译、模拟器刷新及控制台 error/warn 检查通过；iPhone 16 模拟器视觉核对通过；全量回归 165/167，剩余 2 项为工作区内正在进行的超级榜单按钮/奖杯动效断言，与本次改动无关。

### 2026-09-01：首页顶部渐变随滚动淡出

- 首页顶部 `home-header-background.svg` 初始保持 100% 不透明，沿现有 100px 滚动渐变距离线性淡出至 0%；导航栏仍按原逻辑由透明渐显为不透明。
- 渐变透明度独立绑定到背景图片，不影响首页内容卡片和正文可读性。

### 2026-09-01：开发后端局域网 IP 更新

- 将 `miniprogram/config/dev.ts` 中开发者工具与真机请求基址统一更新为同事新 IP `http://192.168.13.102:8080`。
- `/api` 路径拼接和开发/生产环境分流逻辑保持不变；需在同事后端启动后确认局域网可达。

### 2026-09-01：首页顶部背景替换为 Figma SVG

- 首页首个 tab 面板新增本地资源 `home-header-background.svg`，精确复用 Figma 节点 `887:12344` 的三个模糊椭圆。
- 背景层固定在首页滚动内容底部，不影响现有导航、数据加载和交互。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（153 项全部通过）。当前环境无微信开发者工具 GUI，需在开发者工具或真机确认不同屏幕宽度下的裁切效果。

### 2026-09-01：首页问候标题接入 Tencent Sans W7

- 按 Figma 节点 `899:12847` 将首页问候标题和副标题改用 Tencent Sans W7。
- 从用户提供的 8.1MB 字体生成仅包含问候文案字符的子集，并以内嵌 Base64 方式加载，避免 WXSS 本地字体路径兼容问题。
- 字体子集同时包含标题两侧的中文引号 `“”`，确保引号不回退到系统字体。
- 标题位置调整为导航底部 40px（`80rpx`）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（154 项全部通过）。当前环境无微信开发者工具 GUI，需真机确认字体渲染效果。

### 2026-09-01：首页问候图标与引号

- 问候标题行加入 `home-greeting-flame.png`，副标题行加入 `home-greeting-star.png`，均来自用户提供的 Figma 导出图片。
- 第一行动态问候文案改为中文引号包裹，保持 Tencent Sans W7 字体。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（155 项全部通过）。当前环境无微信开发者工具 GUI，需真机确认图标与文字的视觉对齐。

### 2026-09-01：首页问候图标动效与文案清理

- 移除副标题文案中的太阳字符，太阳仅保留为文字内容，不再额外渲染。
- 火焰与星星图标使用 `home-greeting-float` 关键帧做 2.4 秒错峰上下浮动，持续无限循环且不改变布局尺寸。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（156 项全部通过）。当前环境无微信开发者工具 GUI，需真机确认动画节奏。

### 2026-09-01：首页问候与下方内容间距调整

- 将首页 `.home-hero` 高度从 `520rpx` 调整为 `320rpx`，问候文案底部与下方互动消息区域之间保留 40px（`80rpx`）间距。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（156 项全部通过）。当前环境无微信开发者工具 GUI，需真机确认不同屏幕下的垂直节奏。

### 2026-08-31：视频素材进入详情后自动播放

- 素材详情的视频加上 `autoplay`，数据渲染完成后立刻 `play()`，打开视频作品不必再点中间播放按钮。
- 离开页面仍会暂停；播放、暂停、完播埋点不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机打开视频详情确认自动开播。

### 2026-08-31：体验版打开用户轨迹不再白屏

- 用户轨迹页去掉 Skyline 不支持的 `100vh + overflow: hidden` 和卡片 `overflow-y: auto`，改为与用户详情相同的页面滚动，避免真机/体验版整页空白。
- 点击浏览记录时作品 ID 加上 `id:` 前缀，避免微信把雪花 ID 转成 Number 丢精度。
- 加载失败会显示错误和重试，不再只留空白页。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。需重新上传体验版后，从用户详情点作品进入用户轨迹核对。

### 2026-08-31：发布图片/视频先选拍摄或相册

- 选择「图片」或「视频」后不再直接打开相册，先弹出与类型选择相同的底部面板：「拍摄」「从相册选择」。
- 拍摄走 `wx.chooseMedia` 相机（视频最长 30 秒），相册走系统相册；PDF 仍直接进入微信文件选择。
- 首页素材 Tab、独立素材页和发布详情加号共用该来源面板；已有图片后再点加号同样先选来源。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs tests/publish-material-entry.test.mjs`。当前环境无微信开发者工具 GUI，需真机点图片/视频确认会先出拍摄/相册选项。

### 2026-08-31：将 origin/developer-v2 合入 main-v2

- 已把 `origin/developer-v2`（`660b0ff`）合入当前 `main-v2`。
- 素材页与首页内嵌素材 Tab 采用 developer-v2 的顶部渐变/筛选结构（`materials-page__top`）。
- 作品分析详情仍保持 main-v2 的单条内容分析页（`GET /analysis/content/detail` + 意向用户），不采用 developer-v2 的作品列表详情。

### 2026-08-31：作品分析进入单条内容分析页

- 作品分析列表点击作品进入 `/pages/analysis-detail/index?id=`，该页恢复为单条作品内容分析：作品卡（转发/播完/浏览/观看人数）和意向用户（全部/高/中/低）。
- 数据改回 `GET /analysis/content/detail`（`timeRange=all` + `materialId`）；接口为空时仍用素材信息渲染作品卡。
- 导航标题为「内容分析」，不再使用误加的作品列表或「通知」标题。

### 2026-08-31：全屏看图恢复双击和双指缩放

- 全屏预览用 `movable-view` 的 `scale` 支持双指捏合，双击在 1 倍和 2.5 倍之间切换；单击仍关闭。
- 放大后关闭 swiper 横滑，避免和拖动抢手势；切图时把缩放重置回 1 倍，滑动记页逻辑不变。
- 单指长按仍走图片原生菜单；双指按下时立刻把 `show-menu-by-longpress` 关掉，避免捏合时弹出保存/转发底部弹窗。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机全屏双击、双指缩放后再左右滑。

### 2026-08-31：发布页三列网格与全屏看图记页

- 发布详情图片和加号改为按内容区宽度三等分（`calc((100% - 40rpx) / 3)` + 正方形），窄屏也不会再一排只放下两张。加号十字随格子比例缩放。
- 素材详情点击图片改为页内全屏 swiper 预览，左右滑动会继续 `markImageViewed`；系统 `wx.previewImage` 无法回调翻页，不再使用。点图片关闭预览。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs tests/publish-material-entry.test.mjs`。当前环境无微信开发者工具 GUI，需真机看发布页三列，以及全屏滑动是否计入浏览页数。

### 2026-08-31：用户轨迹接入真实浏览/完播/转发

- 新增后端 `GET /analysis/customer/journey?customerId=&materialId=`，从 `tracking_record` 读取该客户对该作品的 play / forward 记录（同一会话的完播合并在 play 上）。
- 轨迹展示：浏览 / 完播 / 转发时间点；转发按时间正序编号（第一次、第二次…）；图片和 PDF 显示查看页数；视频显示播放秒数。
- 前端删除用户轨迹 Mock，`services/user-journey.ts` 走真实接口并映射为页面 ViewModel。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需重启后端后在真机打开用户轨迹核对。

### 2026-08-31：发布详情清空素材后加号重新选类型

- 发布详情已有图片时点「+」仍直接打开相册追加图片。
- 删光所有素材后再点「+」，底部弹出与素材页相同的「图片 / 视频 / PDF」选项。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs tests/publish-material-entry.test.mjs`。当前环境无微信开发者工具 GUI，需真机删光图片后再点加号看弹层。

### 2026-08-31：通知页“一键已读”控件调整为 44px 高

- 通知页完整“一键已读”控件高度调整为 44px（`88rpx`），左右内边距调整为 16px（`32rpx`）；首页紧凑控件仍保持 24px 高。
- 定向通知页测试通过；当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对控件与卡片的间距。

### 2026-08-31：首页“一键已读”控件高度调整为 24px

- 首页互动消息标题右侧紧凑“一键已读”控件由 32px（`64rpx`）调整为 24px（`48rpx`），点击区域通过现有伪元素扩展保持不变。
- 定向首页互动消息测试通过；当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对控件垂直对齐。

### 2026-08-31：用户详情与用户轨迹标题图标统一为 22px

- “用户详情”的浏览记录图标和“用户轨迹”的行为轨迹图标从 24px 调整为 22px（`44rpx`），其余头像、缩略图和底部按钮尺寸不变。
- 定向用户详情/用户轨迹测试通过；当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对标题对齐。

### 2026-08-31：首页模块标题图标统一为 22px

- 首页“今日浏览最多”“意向用户”“今日数据”标题左侧图标从 24px 调整为 22px（`44rpx`），匹配最新设计；底部导航和头像尺寸保持不变。
- 定向首页视觉测试通过；当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对图标与标题的视觉对齐。

### 2026-08-31：素材内容详情上下背景色调整

- 发布后点击内容列表进入详情页时，顶部导航背景、内容说明区域和底部分享操作区改为共享页面背景 `#F5F5F5`，避免图片上下出现白色块；分享按钮本身的白色/青色样式保持不变。
- 新增详情页背景色回归测试。定向详情页测试通过；全量测试仍有 2 条既有的内容盒边框断言失败，来源是工作区已有的首页排名和素材卡片样式改动，与本次详情页背景调整无关。

### 2026-08-31：素材页顶部按 Figma 835:8477 复用通知/分析渐变

- 独立素材页和首页内嵌素材 Tab 均复用通知/分析页的顶部渐变与导航层级；素材筛选栏嵌入渐变头部，四个卡片按 Figma 尺寸排列。
- 顶部渐变层按 Figma 固定为 `131px` 高度，导航容器仍独立处理安全区与筛选栏布局。
- 素材页固定底层改为白色，使 `#f5f5f5 → transparent` 渐变在实体手机上保持可见；列表与卡片层级不变。
- 按最新确认恢复固定竖条背景层，改用设计稿提供的 `materials-stripes.svg`（原始 386×130px，渲染时横向铺满容器）并置于渐变之上；顶部层改为素材页壳内绝对定位（页面壳本身不滚动），规避 iOS/Skyline 对固定子层的合成问题，内容列表仍在其下方滚动。
- 验证：素材顶部/背景回归测试、TypeScript 语法检查与 `git diff --check` 通过；当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对顶部视觉。

### 2026-08-31：素材筛选按钮按 Figma 面填充

- 四个素材筛选按钮的未选中态恢复 Figma 指定的白色填充与 `#D6D6D6` 描边；选中态保留浅青渐变、`#DCEEF2` 描边和阴影。
- 独立素材页与首页内嵌素材 Tab 共用该样式。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（158 tests passed）；`git diff --check` 通过。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对按钮底色效果。

### 2026-08-31：素材页顶部滚动时保持透明

- 素材页和首页内嵌素材 Tab 的导航背景固定为 `rgba(255, 255, 255, 0)`，向上滚动时不再从 0% 渐变到 100% 白色。
- 删除对应滚动监听、状态字段和不再使用的透明度计算，避免无效更新。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（158 tests passed）；30 个 JSON 文件解析通过；`git diff --check` 通过。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对滚动后的顶部透明效果。

### 2026-08-31：发布详情已添加图片增加描边

- 发布详情页的已添加媒体槽位（`publish-page__image-slot--filled`）增加 `2rpx solid #E5E5E5` 描边，图片、视频和 PDF 的槽位统一保持同一外框层级；“继续添加”入口仍使用独立样式。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（158 tests passed）。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对描边与删除按钮的视觉层级。

### 2026-08-31：素材页顶部筛选按 Figma 835:8666 更新

- 去掉素材筛选栏整条白色底，仅保留四个独立白色卡片，避免顶部条带遮住状态栏下方的条纹背景。
- 四个选项统一为 32px 高、10px 间距、13px 文案；未选中态使用 `#F0F0F0` 边框，选中态使用 `#E4F9FC` 至 `#FEFEFF` 渐变、`#DCEEF2` 边框和 20px 阴影。
- 独立素材页和首页内嵌素材 Tab 共用同一组样式；新增回归测试覆盖透明筛选栏和卡片视觉。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（157 tests passed）；`git diff --check` 通过。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对顶部条纹与卡片间距。

### 2026-08-31：发布页底部操作区按 Figma 850:9374 校准

- 发布详情页底部固定操作区改为透明背景，去掉覆盖安全区的白色延伸，仅保留“存草稿”和“发表”两个按钮。
- “存草稿”按钮增加 Figma `850:9374` 指定的 `#E5E5E5` 边框；按钮尺寸、圆角、间距和“发表”主题色保持现有设计。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（157 tests passed）；34 个 JSON 配置解析通过；`git diff --check` 通过。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对底部安全区视觉。

### 2026-08-31：通知列表补齐顶部与日期分组间距

- 按用户标注补充通知页筛选栏到底部首个日期标题的 20px 间距；独立通知页与首页内嵌通知 Tab 同步调整。
- 后续日期分组改为在分组容器上明确增加 `40rpx`（约 20px）顶部留白，避免日期标题的 margin 折叠导致与上一张通知卡贴合。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（155 tests passed）。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对实际屏幕间距。

### 2026-08-31：通知顶部按运行时导航高度留位

- 修复通知页顶部通知卡进入筛选栏下方的问题。根因与分析页相同：导航栏按运行时 `statusBarHeight` 计算，但通知内容仍使用 CSS `safe-area-inset-top` 留位，预览环境返回 0 时会少算状态栏高度。
- 独立通知页与首页内嵌通知 Tab 统一读取实际导航高度，通知头部和内容占位共用同一高度变量；通知筛选栏与内容首块的视觉间距保持不变。
- 新增通知顶部高度回归测试。验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（154 tests passed）。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对顶部视觉。

### 2026-08-31：发布页图片与文案间距调整为 20px

- 将发布详情页图片网格到“添加文案”区域的 `margin-top` 从 `20rpx`（约 10px）调整为 `40rpx`（20px），匹配用户标注的间距。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（154 tests passed）；相关 JSON 配置解析和 `git diff --check` 通过。当前环境无微信开发者工具 GUI，仍需在开发者工具或真机核对实际屏幕间距。

### 2026-08-31：继续添加图片入口按 Figma 850:9370 校准

- 发布详情页图片网格中的“继续添加图片”槽位改为 Figma `850:9370` 的浅灰卡片：`#F7F7F7` 背景、`#E5E5E5` 细边框、10px 圆角，居中 `#8A8E94` 的 29px 十字。
- 使用两个原生 WXML 视图绘制十字，避免文字字体造成的光学偏移；追加图片点击、类型筛选和最多 9 张限制保持不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（152 tests passed）；5 个 JSON 配置解析通过；`git diff --check` 通过。当前环境无微信开发者工具 GUI，仍需在开发者工具或真机核对卡片视觉。

### 2026-08-31：分析顶部按运行时导航高度留位

- 修复分析页顶部统计卡默认进入“作品分析 / 用户分析 / 总数据”分段栏下方的问题。根因是自定义导航栏已经按 `statusBarHeight` 与胶囊位置计算真实高度，但分析内容仍用 CSS `safe-area-inset-top` 留位；该环境返回 0 时会少算状态栏高度。
- 独立分析页与首页内嵌分析统一读取 `getNavigationBarLayout().totalHeight`，分析头部和三个页签内容共用同一个高度变量，并继续保持固定顶部底边到首块内容 20px 的间距。
- 新增运行时导航高度绑定回归测试，并保留六种“独立/内嵌 × 三个分析页签”顶部间距检查。验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（151 tests passed）。当前环境无法运行微信开发者工具 GUI，仍需在开发者工具或真机核对顶部视觉。

### 2026-08-31：发布类型遮罩直接浮在素材页上

- 修复公共发布类型弹层根容器使用不透明灰底，导致遮罩开启后看不到下方素材页、视觉上像进入另一页面的问题。
- 点击素材页“发布素材 +”仍停留在当前素材页；弹层根容器改为透明，半透明黑色遮罩覆盖页面，底部白色面板继续提供图片、视频和 PDF 三个入口。面板复用分析页条件筛选的顶部圆角、一体白底和底部安全区，删除独立“取消”项；点击外部遮罩仍可关闭。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（150 tests passed）；5 个相关 JSON 配置解析通过；`git diff --check` 通过；页面和组件未发现直接导入 Mock 或散落 `wx.request`。当前环境无微信开发者工具 GUI，仍需在开发者工具或真机核对遮罩透出素材页的视觉效果。

### 2026-08-31：分析固定顶部下方恢复 20px 内容间距

- 修复分析顶部移出滚动区域后，作品分析首块内容紧贴/进入顶部渐变层，以及首页内嵌分析其他页签仍沿用旧 `padding-top: 0` 的问题。
- 独立分析页与首页内嵌分析的作品分析、用户分析、总数据统一为固定顶部底边后 `20px` 出现首块可见内容；页签切换、滚动和数据逻辑不变。
- 新增覆盖六种“独立/内嵌 × 三个分析页签”组合的顶部间距回归测试。验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（150 tests passed）。当前环境无微信开发者工具 GUI，仍需在开发者工具或真机核对顶部视觉间距。

### 2026-08-31：发布详情加号直接打开相册

- 发布详情页点「+」不再弹已无样式的类型/来源面板，改为按当前素材类型直接打开相册或微信文件选择。
- 图片可继续追加到 9 张；视频和 PDF 仍只能一份，加满后不加号。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs tests/publish-material-entry.test.mjs`。当前环境无微信开发者工具 GUI，需真机点加号确认能打开相册。

### 2026-08-28：设置页增加意向判断标准

- 「推送意向门槛」标题后增加可点「规则」。
- 点击后弹出单图 / 多图 / PDF / 视频的意向判断标准；点击遮罩空白关闭，点卡片内容不关闭。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机看弹窗开合。

### 2026-08-28：作品详情首页键改为线框房子

- 导航栏首页键使用 `/assets/navigation/home-outline.svg`，替换原 WeUI 实心房子。
- 图标为黑色线框房子加门洞，与返回键同色。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机看返回键右侧线框房子。

### 2026-08-28：作品详情返回键旁增加首页入口

- 作品详情导航在返回键右侧显示房子图标。
- 点击后 `reLaunch` 到首页，从分享进入或从小程序内进入都可以直接回首页。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机看返回键右侧房子并点回首页。

### 2026-08-28：分享作品详情从哪儿来回哪儿去

- 分享给好友的卡片改为直接打开作品详情，不再先落到首页再 `navigateTo`。
- 详情页不再在栈底时 `reLaunch` 回首页；导航返回没有上一页时退出小程序，回到聊天或朋友圈。
- 小程序内从首页或素材列表进入详情的返回路径不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机从分享卡片进入后左滑，确认回到分享来源而不是首页。

### 2026-08-28：总数据浏览次数和人数按周期环比

- 数据总览的「浏览总次数 / 浏览总人数」随日、本周、本月、总切换，分别显示较昨日、较上周、较上月、较上两月。
- 比上期多就显示 `+6`，少就显示 `-3`。增减数字单独包在 `view` 里，用写死的 `--up` / `--down` class 上色，避免 Skyline 把它们和「较昨日」合成一段灰字。
- 差值来自看板接口已有的 `totalViewCountDelta` / `totalViewerCountDelta`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机切日/周/月/总看环比文案和减量红色。

### 2026-08-28：已发布作品可二次编辑

- 作者打开素材详情时，底部「分享到朋友圈」换成「二次编辑」，右侧有圆形笔形图标，处理和「分享给好友」的分享图标一致；访客仍是朋友圈引导。
- 点击后进入发布页并预填原图片/视频/PDF 和文案，可直接改。发表或存草稿会生成新素材，不覆盖原来的已发布作品。
- 从详情进入发布页后返回素材列表时会越过详情页，继续弹出发布成功分享。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机对图片、视频、PDF 各走一遍二次编辑后发表。

### 2026-08-28：「我的」设置回到昵称行右侧

- 「设置」不再放在自定义导航右侧槽，改回头像/昵称同一行最右边。
- 内容区左右仍是 `40rpx`，设置文案右侧留白与头像左侧留白一致，不被胶囊额外挤开。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机看昵称行左右留白。

### 2026-08-27：发布页图片三列均分，空白处可点添加文案

- 加号与已选图片按页面内容区三等分排，一排 3 个，多的换到下一排；左右各留 40rpx，和底栏对齐。
- 图片下方剩余空白整块可点，会聚焦文案输入。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，发布页三列与点空白写文案待真机确认。

### 2026-08-27：发布成功后分享给好友使用素材预览图

- 发布成功弹窗里点「分享给好友」时，标题曾是默认「图文素材」，封面是弹窗截图。PDF 没有本地预览图，详情接口还没返回，微信就会截当前页。
- 发表成功后先按详情页同一来源准备标题和预览图，再弹出成功弹窗；没有预览图时分享按钮不会走系统分享，避免再截屏。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需真机发布 PDF 后对比成功弹窗分享和详情页分享的卡片。

### 2026-08-27：自定义导航按状态栏和胶囊避让

- 标题不再顶到刘海/摄像头：导航高度改为按 `statusBarHeight` 和右上角胶囊位置计算，iOS 也不再跳过顶部留白。
- 返回键对齐胶囊垂直位置，并在胶囊左侧留出宽度，避免被微信三个点挡住。「我的」里的设置改回昵称行最右侧，不再占用导航右侧槽。
- 通知/分析固定头的占位改为 `安全区 + 导航 + 筛选条`，长刘海机型不会把筛选按钮顶进胶囊。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需在刘海机和挖孔屏真机看标题与右上角按钮。

### 2026-08-27：进入小程序必须授权登录并完善资料

- 首页、分享打开的素材详情以及其他业务页进入前都会校验授权登录。未授权不能静默建号，也不会先拉业务数据或上报浏览。
- 未登录先到授权页点「授权登录」；首次没有头像或昵称时进入资料页，可自己编辑，也可一键使用微信头像并接着填写微信昵称。完成后回到原来的首页或分享详情。
- 已授权且资料完整的用户不受影响，原有浏览、分享、分析功能路径不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，真机授权登录与微信头像昵称选择待确认。

### 2026-08-27：发布页文案输入保留彩色表情

- ☺️ 这类默认按文字符号显示的表情，输入后会变成黑白线稿 ☺。原因是缺了 `U+FE0F` 彩色变体标记，Skyline 文案框和 `Microsoft YaHei` 会优先画成文字符号。
- 发布页改用 webview 渲染文案框；输入、草稿回填和提交时补上彩色变体；文案框字体把系统彩色表情字体放在雅黑前面。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，需在开发者工具和真机再贴一次 ☺️ 确认仍是彩色。

### 2026-08-27：自己看自己的素材不计入浏览、转发、完播

- 发布者用自己的 openid 打开或转发自己的作品时，后端直接跳过：不写 `tracking_record`，不加 `content_stats` 的浏览次数 / 转发数 / 完播数，也不给自己建客户。
- 别人看、别人转仍然照常统计。已经写进统计表的历史本人次数不会自动回滚。
- 验证：需重启 aisales 后再打开自己的作品。当前环境无微信开发者工具 GUI。

### 2026-08-27：发布页加号按已选类型过滤底部弹层

- 空列表时底部弹层为「图片 / 视频 / PDF」。已选图片后再点加号只出「图片」；相册/拍摄也只打开对应类型，避免混选。
- 视频、PDF 各只能一份，上传后隐藏加号；图片满 9 张后同样隐藏加号。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，发布页加号弹层待真机确认。

### 2026-08-27：多图发布不再因 file_url 超长失败

- 9 张图片的 URL JSON 超过 `material.file_url` 的 `VARCHAR(512)`，插入时报 Data too long。
- 列改为 `TEXT`。已有库执行 `sql/widen_material_file_url.sql`（`ALTER TABLE material MODIFY file_url TEXT`），无需重启应用。
- 验证：改完库后再发 9 张图。当前环境无微信开发者工具 GUI。

### 2026-08-27：服务器部署后浏览时间不再慢 8 小时

- 原因：Linux 服务器 JVM 默认 UTC，`LocalDateTime.now()` 把北京时间 14:00 写成 06:00；本机 Windows 是东八区所以看起来正常。
- 后端统一按 GMT+8 取当前时间；Docker 镜像补 `tzdata` 并设置 `TZ` / `-Duser.timezone=GMT+08:00`。
- 小程序把 `yyyy-MM-dd HH:mm:ss` 按墙上时间拆开解析，避免无时区 ISO 被当成 UTC。
- 已经写进服务器库的旧记录仍是 UTC 墙上时间，新浏览会是北京时间。如需纠正历史数据，把对应 `create_time` 加 8 小时。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。需重新构建并部署 aisales。当前环境无微信开发者工具 GUI。
### 2026-08-31：发布入口选择素材后直达详情页

- “发布素材”在首页内嵌素材页和独立素材页均先打开公共“图片 / 视频 / PDF”类型选择；图片、视频类型选择后直接进入手机相册，PDF 进入微信文件选择器。
- 选择结果通过 `utils/publish-selection.ts` 的 typed 临时交接传入发布详情页，详情页首屏直接展示已选素材；图片详情页保留“再次添加图片”，最多 9 张，视频/PDF 仍为单文件。
- 删除详情页旧的“拍摄 / 从相册选择”二次来源面板及不再需要的相机权限；文案、存草稿、发表和上传 service 流程保持不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（138 tests passed）；相关 TypeScript 语法剥离、JSON 解析和 `git diff --check` 通过。当前环境未安装 `tsc`，也无微信开发者工具 GUI，仍需在开发者工具/真机核对系统选择器与详情页视觉。

### 2026-08-31：分析页签顶部复用通知页固定渐变层

- 首页内嵌分析页签的顶部导航按通知页结构固定在滚动内容之外，保持导航层级 `1001`，避免分析内容滚动时覆盖或带走顶部渐变背景。
- 分析页独立路由继续使用分析头部自身的通知样式渐变；本次只调整分析页相关承载样式与回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/*.mjs`（136 tests passed），`git diff --check` 通过。

### 2026-08-31：补发素材详情页图片卡片按 Figma 835:8415 放大

- 发布/补发素材详情页继续使用全局 `#F5F5F5` 页面背景，和 Figma 画板底色保持一致。
- 已选图片与“再次添加”卡片共用 `publish-page__image-slot`，统一调整为 `228rpx × 228rpx`（iPhone 16 画板约 `114px × 114px`）；图片网格间距调整为 `20rpx`（约 `10px`），内容左右内边距调整为 `48rpx`（约 `24px`）。
- 选图、删除、添加文案、存草稿和发表交互保持不变。
- 验证：新增 Figma 尺寸/背景回归测试；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/home-page.test.mjs tests/publish-material-entry.test.mjs`（136 tests passed）；TypeScript/JSON 语法检查及 `git diff --check` 通过。

### 2026-08-31：发布素材入口先选择素材类型

- 按 Figma 节点 `835:9004` 新增公共组件 `components/publish-type-sheet`，选择顺序为“视频 / 图片 / PDF”，并提供独立的“取消”操作；遮罩、底部面板动画和安全区处理由组件统一维护。
- Figma 外层承载面板和两个分组之间的 `10px` 间隔使用 `#F5F5F5`；上方三项选择组和底部“取消”组保持白色，底部“取消”组高度为 `80px`。
- 只有素材页的“发布素材”按钮打开该面板；底部导航“+”和首页空作品区的发布入口仍进入素材页。选择类型后跳转 `/pages/materials/publish/index?type=image|video|pdf`。
- 发布编辑页读取 `type` 参数并限制原生选择器：图片/视频使用 `wx.chooseMedia` 的单一 `mediaType`，PDF 使用 `wx.chooseMessageFile`；编辑页继续提供“添加文案”、草稿、发表和删除素材。
- 未传 `type` 的直接进入仍默认图片，编辑既有草稿时按草稿首个素材类型恢复；真实上传接口仍待后端合同确认。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/home-page.test.mjs tests/publish-material-entry.test.mjs`（135 tests passed）；相关页面/组件 JSON 解析通过；`git diff --check` 通过。当前环境未安装 `tsc`，未执行 TypeScript 类型编译；仍需在微信开发者工具和真机核对面板视觉与系统选择器行为。

### 2026-08-31：首页第三条未读消息增加“查看更多”

- 按 Figma `747:6618`，当首页未读消息超过 3 条时，仅在第三条未读卡片底部显示浅灰色“查看更多”按钮；未超过 3 条时不渲染该区域。
- 按钮使用首页原有 `onTabTap` 进入通知列表，并通过 `catchtap` 阻止触发第三条消息卡片的已读处理；原有消息卡片和灰色叠层逻辑保持不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/home-page.test.mjs`（132 tests passed）。

### 2026-08-31：恢复分析页真实数据

- 公司开发网络可用后，将 `DEV_UI_PREVIEW` 设为 `false`；分析作品列表、总览和内容详情恢复调用既有真实接口，不再返回固定的本地预览数据。
- 通知页原本已调用真实接口；用户轨迹走 `GET /analysis/customer/journey`。
- 开发者工具、真机/体验版请求基址统一使用同事电脑的 `192.168.31.225:8080`，不再回退到 `127.0.0.1`。两端均需确保后端监听 8080 且设备可访问；当前工作区直连该地址仍返回 HTTP 000，需同事启动服务并确认防火墙/局域网可达。

### 2026-08-31：首页互动消息增加“一建已读”

- 首页互动消息标题右侧改为 Figma `811:8009` 的紧凑“一建已读”胶囊；有未读消息时显示，无未读时隐藏。
- 点击后批量持久化接口返回的全部未读事件 ID，清空首页互动消息预览，并同步清除已加载通知页的未读状态；未新增接口。
- 验证：`node --test tests/home-page.test.mjs`（132 tests passed）；页面/组件 JSON 解析和 `git diff --check` 通过。当前环境无微信开发者工具 GUI，需重新编译确认真机视觉效果。
- 后续修正：紧凑变体显式重置继承的 `bottom` 偏移，避免按钮从互动消息标题栏上移到 Hero 区域。

### 2026-08-30：通知页增加“一建已读”操作

- 按 Figma `816:8042` 新增可复用的底部“一建已读（数量）”悬浮操作；未读数量大于 0 时才显示，右侧“×”仅作视觉图标，不提供关闭行为。
- 点击后将当前通知集合中所有未读事件写入既有本地已读记录，独立通知页和首页内嵌通知 Tab 的小红点、未读数量与操作按钮立即同步更新。
- 底部导航已移除通知数字及对应数据赋值；首页“互动消息”标题内的未读数量保持原有职责。
- 验证：通知与底部导航定向回归 `23 tests passed`，`git diff --check` 通过；待项目级验证后补充最终结果。

### 2026-08-30：浏览峰值卡补充周期筛选并移除顶部空块

- 总数据页及首页内嵌分析的“浏览峰值”标题栏新增与“数据总览”一致的日/周/月/日历筛选控件；两处筛选分别维护当前周期，互不联动。
- 浏览峰值卡改为与数据总览一致的 20px 圆角、`0 20px 20px` 内边距和 20px 内容间距，去掉标题上方多余空白。
- 数据总览筛选改变总览查询并保留峰值周期；浏览峰值筛选只更新图表，不重新加载总览。自定义日期分别记录到各自的日期范围。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/home-page.test.mjs`（127 tests passed）；TypeScript/JSON 语法检查及 `git diff --check` 通过。

### 2026-08-29：总数据周期筛选移入数据总览标题栏

- 按 Figma `743:5979` 移除总数据页顶部独立的周期控件，将日/周/月/筛选图标控件放入“数据总览”标题右侧。
- “总”改为与作品分析相同的日历筛选图标；日期选择复用现有两个月范围（`twoMonthsAgoDate` 到 `todayDate`），确认后按自定义范围加载总数据。
- 独立分析页与首页内嵌分析同步调整，默认周期为“日”；同时删除首页已废弃的顶部筛选容器样式。后续总览和峰值筛选拆为独立状态。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec tests/home-page.test.mjs`（126 tests passed）；TypeScript/JSON 语法检查及 `git diff --check` 通过。

### 2026-08-29：总数据总览卡按 Figma 743:5979 重排

- 总数据页及首页内嵌分析的“数据总览”卡统一为 Figma 743:5979：24px 数据总览图标、两项主指标、较昨日对比和 2×3 统计卡。
- 使用用户提供的 `icon_1.svg` 原始 SVG，保存为 `assets/analysis/data-overview-icon.svg`；同组“浏览峰值”标题补充用户提供的 `icon_2.svg`，保存为 `assets/analysis/peak-data-icon.svg`，并复用相同的 24px 标题栏结构。
- 主指标文案统一为“阅读总次数 / 阅读总人数”；真实接口暂无昨日增量字段，生产映射保留 `+0`，离线预览按 Figma 展示 `+30`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（125 tests passed）；TypeScript/JSON 语法检查及 `git diff --check` 通过。

### 2026-08-29：内容详情意向用户列表按 Figma 743:4059 校准

- 意向用户公共组件的指标文案与 Figma 统一为“浏览次数 / 完播 / 转发”。
- 用户行分割线按 Figma 的意向等级使用对应浅色：高/中意向 `#F0F0F0`，低意向 `#F4F5F5`；保留 44px 头像、11px 内容间距、15px 行间距和 20px 外部内边距。
- 仅修改 `analysis-intent-users` 组件及其回归断言，不涉及接口、数据字段或其他页面。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`；`git diff --check` 通过。

### 2026-08-29：修复分析页用户分析 Tab 点击无响应

- `analysis-header` 现在从 `segmented-filter` 的自定义事件 `event.detail.index` 转发 Tab 索引；此前误读 `currentTarget.dataset.index`，导致点击“用户分析”得到 `NaN` 而被页面忽略。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（123 tests passed）；`git diff --check` 通过。

### 2026-08-29：用户分析意向汇总按 Figma 743:4027 更新

- 独立分析页与首页内嵌分析 Tab 的用户分析汇总改为三张横向等分卡片，复用 Figma 的 24px 图标、数量/标签层级和高中低意向渐变色。
- 新增本地 Figma SVG `miniprogram/assets/analysis/intent-summary-icon.svg`；中意向保留 Figma 的白色横线图形，高/低意向使用同一 SVG 的对应方向。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（122 tests passed）；`git diff --check` 通过。

### 2026-08-29：作品分析下方内容按 Figma 743:3561 重排

- 独立分析页与首页内嵌分析 Tab 的“作品分析”下方统一为 Figma 743:3561：两张汇总卡下接白色“我的作品（数量）”容器、周期/阅读量筛选和浅灰作品卡列表。
- 作品卡使用 50×68px 缩略图、15px 内边距、15px 圆角、10px 卡片间距，补充意向标签与浏览/转发/完播指标；卡片点击和筛选仍沿用原页面交互。
- “我的作品”标题使用 Figma 导出的本地 SVG `miniprogram/assets/analysis/my-works-icon.svg`；卡片标题/日期保持同组紧凑排版，意向标签与文字组之间保留 10px 间距。
- 内容详情页（`analysis-detail`）同步使用同一套 24px 图标、作品卡层级和 50×68px 缩略图，避免组件样式缺失时回退到 SVG 默认大尺寸。
- 作品列表从现有 `/analysis/content/list` 与 `/analysis/intent/list` 映射意向标签；离线预览通过 `DEV_UI_PREVIEW` 提供固定数据，页面不直接依赖 Mock。
- 修正内容详情页周期筛选控件宽度为 Figma 所需 140px（组件传入 `item-width="68"`）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（121 tests passed）；`git diff --check` 通过。当前环境无微信开发者工具 GUI，需重新编译确认真机视觉细节。

### 2026-08-29：内容详情增加离线 UI 预览开关

- 新增 `miniprogram/config/dev.ts` 的 `DEV_UI_PREVIEW` 开关，当前为 `true`，用于无法连接同事局域网 IP 时直接预览内容详情页面。
- 预览数据集中放在 typed mock `miniprogram/mocks/analysis-content-detail.ts`，覆盖高/中/低意向用户、长列表和内容卡；页面仍只调用 service，不直接依赖 Mock。
- 通过 `services/analysis-preview.ts` 作为开发数据适配层，周一接入同事接口前将 `DEV_UI_PREVIEW` 改为 `false` 即可恢复真实接口请求。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（120 tests passed）；`git diff --check` 通过。当前环境无微信开发者工具 GUI，需在本地开发者工具重新编译确认视觉细节。

### 2026-08-28：内容详情接入 Figma 743:4059 意向用户组件

- 新增可复用 `analysis-intent-users` 组件，按 Figma 还原意向用户人数、日/周/月/日历筛选、阅读量排序和用户指标行。
- 组件使用 20px 外部内边距、15px 内容节奏、44px 头像、11px 头像与正文间距、15px 用户行间距及内部浅色分隔线；未引入投影或可见描边。
- 内容详情 service 复用 `/analysis/intent/list` 映射用户头像、昵称、意向等级、浏览次数、完播和转发数据；点击用户沿用用户详情页路由。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`；`git diff --check`。

### 2026-08-28：分析作品汇总卡改为两张并加入 Figma SVG 图标

- 按 Figma `743:3539` 移除「总发布」卡，仅保留「总阅读次数」与「总转发」两张卡。
- 两张卡使用 Figma 导出的 24px SVG 图标，卡片间距 10px、左右内边距 20px、上下内边距 15px、圆角 12px；这些固定尺寸直接使用 px，独立分析页与首页内嵌分析组件同步更新。
- 卡片内部图标、数值和标签显式从左侧内边距开始排列，避免内容在卡片中居中。
- `AnalysisMetric` 增加可选 `iconPath`，仍复用现有 dashboard 数据，不新增后端接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（118 tests passed）；`git diff --check` 通过。

### 2026-08-28：新版内容详情页按 Figma 743:3538 重排

- 内容详情页改为顶部总阅读/总转发汇总卡、“我的作品（数量）”容器、日/周/月/日历筛选和阅读量排序控件，整体按 Figma `743:3538` 还原。
- 页面顶部标题按最新 Figma 截图确认改为“通知”，保留详情页返回箭头和公共分析头部组件。
- 作品列表直接复用首页内容卡的缩略图、标题/日期、意向标签及浏览/转发/完播指标布局，卡片之间保留 `10px` 间距，不再维护另一套内容卡结构。
- 数据继续由 `services/analysis.ts` 组合现有 `/analysis/dashboard`、`/analysis/content/list` 与 `/analysis/intent/list`，未新增后端接口；页面不直接依赖 Mock。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（118 tests passed）；`git diff --check` 通过。当前环境无微信开发者工具 GUI，需在开发者工具或真机确认最终视觉细节。

### 2026-08-28：分析页顶部复用通知页顶部样式

- 按 Figma 节点 `804:7536`，分析页顶部改为与通知页一致的固定渐变背景、透明导航栏和通知样式胶囊筛选条。
- 保留分析页的“分析”标题与“作品分析 / 用户分析 / 总数据”三项标签；根分析页不显示返回箭头，标签切换和左右滑动逻辑保持不变。
- 仅修改分析头部公共组件、分析页顶部偏移与回归测试，不涉及接口、数据字段或业务逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（118 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知列表日期分组增加 20px 间距

- 后续日期标题直接增加 `20px`（`40rpx`）顶部间距，避免日期分隔标题紧贴上一组的最后一张卡片。
- 同一日期分组内卡片间距保持原有 `10px`（`20rpx`），首个日期分组与顶部筛选区的间距不变。
- 仅修改通知页 Less 与回归断言，不涉及接口、数据字段或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（118 tests passed）；`git diff --check` 通过。

### 2026-08-28：用户详情作品记录改为用户轨迹

- 按 Figma `743:2355` 新增 `pages/analysis-user-journey`：包含“用户轨迹”导航、作品信息卡、行为时间线与底部联系用户按钮。
- 通知进入用户详情后，点击某个作品记录现在携带 `userId` 与 `materialId` 进入用户轨迹；分析页中的通用“内容详情”页面和入口保持不变。
- 当前数据为固定、可重复的 typed Mock，由 `services/user-journey.ts` 提供，页面不直接依赖 Mock。Figma 导出的作品封面与行为图标已保存到 `assets/analysis/`。
- `services/user-journey.ts` 记录了真实 API 的合同占位；后续仅在该 service 替换数据来源，不改变页面、类型或路由。
- 行为轨迹竖线调整为视觉 `2px`（`4rpx`），并延伸至末尾圆点中心；底部联系用户按钮调整为距屏幕底部 `24px`（`48rpx`）。
- 轨迹卡取消固定最小高度，改由页面纵向弹性布局填充剩余视口；卡片与“联系用户”按钮之间固定保留 `20px`（`40rpx`），按钮仍保留 `24px`（`48rpx`）底部间距。较长行为列表在卡片内滚动，避免遮挡按钮。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（116 tests passed）；页面 JSON 解析、相关 TypeScript 语法剥离、静态资源检查和 `git diff --check` 通过。当前环境未安装本地 `tsc`，也无微信开发者工具 GUI，仍需重新编译后进行视觉确认。

### 2026-08-28：全局页面底色统一为 #F5F5F5

- 用户确认将页面统一画布背景从 `#EDF0F5` 调整为 `#F5F5F5`，所有使用 `@app-page-background` 的页面同步生效。
- 用户详情页显式背景与导航栏、浏览记录卡片，以及通知顶部渐变的实色和透明端也统一为 `#F5F5F5`。
- 仅修改前端 Less/WXML 与对应视觉回归断言，不涉及接口、数据字段或交互逻辑。

### 2026-08-28：通知卡片增加逐条未读红点

- 对照 Figma `723:12527`，通知卡片左侧增加 `7×7px`、`#EF7A7C` 未读红点，位置为距卡片左侧 7px、顶部 32px；首页内嵌通知 Tab 与独立通知页共用该样式。
- 通知 ViewModel 根据当前用户本地已查看事件记录生成 `isUnread`；打开通知页、刷新或切换筛选不会清除红点，只有点击对应卡片进入用户详情时才将该事件标记为已读并立即移除红点。
- 已读状态继续复用现有 `notifications.viewedEvents` 本地存储，不新增或猜测后端接口；首页通知角标与现有互动消息预览数量同步减少。
- 仅修改通知类型、service 映射、共享工具、两处通知列表状态与样式，并补充回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（115 tests passed）；`git diff --check` 通过。当前环境无微信开发者工具 GUI，需在开发者工具或真机确认红点与卡片的实际对齐。

### 2026-08-28：用户详情浏览记录按 Figma 738:2133 重排

- 用户详情浏览记录区域改为白色圆角容器，新增阅读记录图标标题行与底部分隔线；复用现有阅读动作图标资源，不新增接口数据。
- 筛选条保持公共 `segmented-filter`，内容卡按 Figma 使用 `#F0F2F5` 背景、15px 内边距、15px 圆角，卡片之间 15px 间距。
- 仅修改用户详情 WXML/Less、回归断言和交接记录；现有标题、日期、缩略图、意向标签及五项指标字段保持不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。微信开发者工具/真机视觉仍需重新编译确认。

### 2026-08-28：用户详情浏览记录标题改用 Frame.svg 图标

- 用户详情浏览记录标题不再复用首页浏览次数图标，改用用户提供的 `Frame.svg`（24×24 红橙渐变眼睛图标）。
- 原始 SVG 已保存为 `miniprogram/assets/analysis/reading-record-icon.svg`，WXML 仅替换资源引用；不涉及接口、数据或布局。
- 验证：资源与 `/Users/xiaogai/Desktop/Frame.svg` 字节一致；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页移除顶部渐变背景

- 删除首页 Hero 区域的多色渐变背景图片节点与专用样式，顶部区域现在直接使用页面统一底色 `#EDF0F5`。
- 删除不再使用的 `miniprogram/assets/home-new/home-background.svg`；问候文案、Hero 高度、内容间距和交互保持不变。
- 仅修改首页 WXML/Less、本地资源和回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；生产目录无背景残留引用，`git diff --check` 通过。

### 2026-08-28：用户详情顶部导航底色统一

- 用户详情页顶部导航栏背景由 `#FFFFFF` 调整为 `#F0F2F5`，与当前页面顶部视觉规范保持一致。
- 仅修改用户详情页 WXML/Less 与回归断言，不涉及接口、数据字段或路由。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知筛选条至日期标题间距修正

- 修正顶部预留空间与通知分组外边距叠加的问题：分组顶部外边距调整为 `0`，筛选条至日期标题的最终可见间距为 20px。
- 通知卡片之间的 10px 间距仍由卡片列表容器的 `gap` 控制，未受影响。
- 仅修改通知页 Less 与回归测试，不涉及接口、数据或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知筛选区间距与选中胶囊垂直对齐

- 通知筛选条至日期标题的间距调整为 20px（`40rpx`）。
- 公共 `segmented-filter` 的白色选中层改为同时固定 `top`、`bottom` 为 2px（`4rpx`），由浏览器计算高度，确保真机上下间距相等。
- 该公共控件同步影响通知、分析和排行榜等已有筛选场景；未涉及接口、数据或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页内嵌通知头部改为内容上层固定渐变

- 对照 Figma `782:6708`，首页通知 Tab 的头部改为面板内绝对定位层，层级高于通知 `scroll-view`，滚动时卡片可从渐变底部透出。
- 为内嵌通知内容预留 `@notification-header-height + 20rpx` 顶部空间；独立通知页原有固定头部不变。
- 不涉及接口、数据字段或业务交互；仅修改首页 Less 与回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部渐变按 Figma 782:6708 校准

- 顶部固定层高度调整为 `@notification-header-height + 20rpx`（对应 Figma 142px Frame），确保滚动内容从渐变层下方经过。
- 渐变前 `65.141%` 保持 `#F0F2F5` 不透明，最后一段向下过渡到 0% 透明；无模糊、无额外遮罩层。
- 顶部固定层保持高于内容层，滚动时通知卡片可从底部透明区域透出；不涉及接口、数据或交互逻辑。
- 仅修改通知头部 Less 与回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部渐变按标注恢复透明底

- 按红框标注将顶部渐变限定在 `@notification-header-height`：顶部 `#F0F2F5` 不透明度 100%，底部不透明度 0%。
- 移除此前增加的白色基底，透明端直接露出全局 `#EDF0F5` 背景；无额外遮罩、无背景模糊，不改变接口或交互。
- 仅修改通知头部 Less 与回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部渐变可见性修正

- 保留顶部区域高度、反向渐变和无模糊要求；为通知头部增加白色基底，让 `#F0F2F5` 到透明的渐变与底色形成可见对比。
- 移除额外遮罩层，标题与筛选控件不再存在被覆盖风险；不涉及接口、数据或交互逻辑。
- 仅修改通知头部 Less 与回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部移除额外遮罩层

- 移除顶部独立渐变遮罩节点，避免层级覆盖通知头部内容。
- 直接在通知头部本体设置红框区域高度 `@notification-header-height` 的反向渐变（顶部 `#F0F2F5`、向下透明），并保持无背景模糊。
- 独立通知页与首页内嵌通知头部同步生效；不涉及接口、数据或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部渐变高度与模糊调整

- 顶部渐变遮罩高度恢复为红框标注的顶部区域高度 `@notification-header-height`，不再向下延伸。
- 移除顶部背景模糊，仅保留顶部实色、向下透明的 `#F0F2F5` 渐变；不改变标题、筛选控件、接口或交互。
- 仅修改通知头部组件 Less 与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部渐变透明度可见性修正

- 顶部渐变保持“顶部实色、向下淡出”的方向和 `#F0F2F5` 颜色。
- 渐变遮罩向下延伸 `176rpx` 过渡区，并允许溢出显示，使透明度变化能与下方内容形成可见过渡；模糊仍为 `5px`。
- 仅修改通知头部 Less 与回归测试，不涉及接口或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部渐变方向与颜色调整

- 顶部渐变改为与底部导航相反的方向：顶部使用实色，向下逐渐淡出。
- 渐变颜色统一为 `#F0F2F5`，保留 `5px` 背景模糊；不改变标题、筛选控件、接口或交互。
- 仅修改通知头部组件 Less 与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知卡片之间增加 10px 垂直间距

- 日期标题与第一张卡片的原有间距保持不变；同一日期下连续通知卡片之间增加 10px（20rpx）间距。
- 通过独立的卡片列表容器使用 flex `gap` 控制间距，卡片自身取消顶部外边距；不改变卡片内容、接口、字段或交互。
- 仅修改通知页与首页内嵌通知组件的 WXML/Less 及回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部增加渐变模糊背景

- 通知页顶部新增独立背景遮罩，复用底部导航的渐变与 `5px` 模糊思路；标题和筛选控件保持在遮罩层之上。
- 独立通知页与首页内嵌通知头部同步使用该样式，不改变页面数据、接口或交互逻辑。
- 仅修改通知头部组件 WXML/Less 与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页内容卡片与首页互动消息统一

- 通知页独立入口与首页内嵌通知 Tab 的卡片统一采用首页互动消息的头像、文案、意向标签、状态条、缩略图尺寸及内边距布局。
- 状态条移动到文案列内，头像顶部与姓名文案对齐；卡片按首页节奏使用 20px 间距和相同按下反馈。
- 通知页不增加底部叠加卡片效果，所有通知记录保持普通列表展示。
- 仅修改通知页 WXML/Less 与回归测试，不涉及接口、字段或跳转逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知筛选器收敛为公共组件并增加切换反馈

- 通知页改用公共 `segmented-filter` 组件，保留通知专用胶囊变体，确保独立通知页和首页内嵌通知 Tab 复用同一套筛选器。
- 选中层改为固定 `56rpx` 高度并取消底部自适应计算，保证真机上下内距一致；切换时通过选中层 `transform` 横向平移。
- 通知筛选切换增加 `wx.vibrateShort({ type: 'light' })` 轻触感；未改变通知接口、数据字段和跳转逻辑。
- 仅修改公共筛选组件、通知头部组件与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：通知页顶部按 Figma 772:6700 调整

- 通知页顶部画布改为全局 `#EDF0F5`，标题字号按 Figma 调整为 16px（`32rpx`）。
- 四项筛选改为左右 20px 的 32px 高胶囊控件：外层 `#E3E4E5`，选中项为白色内嵌胶囊，移除原全宽下划线布局。
- 为新增顶部间距同步调整通知页内容起始位置；通知卡片、筛选数据、接口和跳转逻辑保持不变。
- 将顶部样式落到 `notification-header` 组件自身 Less，确保独立通知页和首页内嵌通知 Tab 都使用同一套视觉规则；仅修改组件 WXML/Less 与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页互动消息预取 7 条避免点击补位卡顿

- 首页互动消息从现有通知列表中最多预取 7 条，页面仍只渲染前 5 个位置（3 条完整卡片和 2 条叠层卡片）。
- 点击任一可见消息后，已预取的下一条消息可立即补位，避免移除卡片后等待重新加载造成卡顿；无新增接口或请求参数。
- 仅修改首页 service、WXML 与回归测试，不涉及接口、字段或跳转逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页互动消息头像与顶部文案对齐

- 将互动消息卡片中的头像身份容器改为顶部对齐，使头像顶部与姓名及意向标签所在的上方文案行对齐，不再按整段状态文案垂直居中。
- 仅修改首页 Less 与回归测试，不涉及接口、字段或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`、`git diff --check`。

### 2026-08-28：首页今日数据双指标横向布局修复

- 明确设置顶部双指标容器为横向 flex，并固定中间分隔线宽度，避免阅读人数被纵向撑开、分隔线变成长竖条以及下方统计重叠。
- 将分隔元素改为显式闭合的 WXML `view`，降低 Skyline/glass-easel 对自闭合容器解析差异的风险。
- 仅修改首页 WXML/Less，不涉及接口、字段和跳转逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页今日数据双指标布局闭合修复

- 修复今日数据卡顶部双指标容器闭合层级错误：浏览次数、分隔线和阅读人数现在处于同一行，避免阅读人数被撑到卡片底部并与下方指标重叠。
- 仅修正首页 WXML 的 `view` 嵌套闭合，未改变接口、字段或交互。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页今日数据 WXML 闭合修复

- 修复“今日数据”改版后首页模板少一个 `view` 闭合标签导致的 `expect end-tag 'view'` 编译错误。
- 仅修正 WXML 结构，未改变数据、样式、交互或接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页今日数据按 Figma 723:11527 改版

- 首页“今日数据”由旧的单一主指标调整为 Figma 双主指标布局：浏览次数与阅读人数并列，下面分两行展示总完播、转发次数、观看人数和高/中/低意向。
- 使用用户提供的 `5.svg` 保存为 `miniprogram/assets/home-new/today-data-icon.svg`，箭头复用现有 `today-most-chevron.svg`；卡片继续使用现有 `onTodayDataTap` 跳转逻辑。
- 仅复用已有 `today` 和 `intentSummary` 字段，未新增或修改接口；对比信息仍按现有可选 `today.comparison` 展示，不伪造昨日数据。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：首页意向用户按 Figma 723:11502 改版

- 首页“意向用户”由独立标题和卡片调整为单一卡片结构：顶部加入用户图标、标题和右侧箭头，中部保留今日新增客户数及五个叠放头像，底部保留高/中/低意向统计。
- 使用用户提供的 `2.svg` 保存为 `miniprogram/assets/home-new/intent-user-icon.svg`；箭头复用现有 `today-most-chevron.svg`。
- 继续消费现有 `intentSummary` 数据和 `onIntentSummaryTap` 跳转逻辑，没有新增或修改接口；遵循已确认的全局无投影、无描边约定。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（113 tests passed）；`git diff --check` 通过。

### 2026-08-28：底部导航按 Figma 723:11206 更新选中样式

- 公共 `bottom-tab-bar` 胶囊此前按 Figma 从 `56px` 增加至 `60px`，现按用户最新要求恢复为 `56px`；选中滑动层继续使用主题色 `#0EC8D9`。
- 选中图标和文字改为白色，带内部细节的通知、发布和分析图标使用主题色镂空；未选中图标和文字统一为 `#333333`。
- 修复开发者工具继续命中旧 `*-active.svg` 缓存导致选中图标仍为主题色的问题：五个选中态资源统一更名为 `*-selected.svg`，页面与组件改用新 URL，并删除旧资源路径。
- 保留导航胶囊的半透明白色 Glass、5px 背景模糊，并按新版 Figma 使用固定 `1px`、100% 不透明的 `#FFFFFF` 描边和 `0 0 20px rgba(0, 0, 0, 0.05)` 轻投影；其他内容盒子继续保持无投影、无描边。
- 针对 Skyline 测试中描边与投影不可见的问题，将 Glass 与描边/投影拆成两个独立渲染层，并把固定容器向上扩展 20px 作为投影绘制空间；胶囊本体尺寸和安全区位置不变。
- 将胶囊导航下方的渐变遮罩和安全区接续底色由白色统一改为 `#F2F3F6`，增加白色描边及 5% 黑色投影与底层之间的视觉对比。
- 仅修改公共底部导航样式、本地图标资源和回归测试，不涉及接口或交互逻辑。
- 验证：底部导航相关定向回归 5/5 通过；当前全量回归为 113/113，`git diff --check` 通过。当前环境无微信开发者工具 GUI，需在开发者工具或真机确认 Glass 效果与安全区位置。

### 2026-08-28：首页“今日浏览最多”查看更多按钮间距调整

- 将内容卡片与底部“查看更多”按钮之间的垂直间距从 `10px` 调整为 `20px`（`40rpx`）。
- 仅修改首页 Less 与回归测试，不涉及接口或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（112 tests passed）、`git diff --check`。

### 2026-08-28：首页「今日浏览最多」增加底部查看更多按钮

- 移除标题栏右侧的“查看更多”文案，标题栏仅保留 Figma 右箭头。
- 在白色内容 Box 底部增加浅灰色圆角“查看更多”按钮，点击后继续进入作品分析。
- 保持白色 Box 与其他首页 Box 一致的左右 `20px` 间距；仅修改首页 WXML/Less 与回归测试，不涉及接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（112 tests passed）、`git diff --check`。

### 2026-08-28：首页「今日浏览最多」恢复 20px 外边距与查看更多

- 撤销该区域的全宽负边距，白色外框恢复与首页其他 Box 一致的左右 `20px` 间距。
- 右侧恢复“查看更多”文字，并保留 Figma 右箭头；标题行整体仍进入作品分析。
- 仅修改首页 WXML/Less 与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（112 tests passed）、`git diff --check`。

### 2026-08-28：首页「今日浏览最多」按 Figma 723:11451 重做

- 删除该区域右侧“查看更多”文字，改为 Figma 的眼睛图标、标题和右箭头组合；整个标题行可点击并继续进入作品分析。
- 将作品列表改为白色圆角容器内的 `#EDF0F5` 独立卡片，补充高意向状态标签、完播统计和对应的 50×68px 缩略图布局。
- 完播数复用现有 `GET /analysis/content/list` 响应的 `completeCount`，只增加前端 ViewModel 映射，不新增或修改接口。
- 新增本地 `today-most-icon.svg` 与 `today-most-chevron.svg` 资源；仅修改首页 WXML/Less、类型、service 映射、资源和回归测试。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（112 tests passed）、`git diff --check`；当前环境无微信开发者工具 GUI，需在开发者工具或真机确认视觉比例。

### 2026-08-28：全局盒子移除投影与描边

- 移除首页、通知、分析、素材、详情、排行榜、设置、发布、个人中心、底部导航和弹窗等盒子容器的 `box-shadow` 与可见 `border`，保留标签下划线、列表分隔线、图表网格线等结构性线条。
- 清理不再使用的盒子描边 Less 变量；不改变页面数据、导航和交互逻辑。
- 仅修改前端 Less 与回归测试，不涉及接口或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（111 tests passed）、`git diff --check`；当前环境无微信开发者工具 GUI，需在开发者工具或真机确认所有页面的无投影、无描边效果。

### 2026-08-28：移除首页超级榜单卡片投影

- 删除首页“超级榜单”入口卡片的 `box-shadow`，保留原有渐变、边框、圆角和点击跳转。
- 仅修改前端 Less 与回归测试，不涉及接口或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（110 tests passed）、`git diff --check`。

### 2026-08-28：首页互动消息状态条与意向颜色统一

- 首页互动消息状态提示条增加左右 `10px` 视觉内缩（`20rpx`），避免贴满内容列边缘。
- 首页和通知列表状态提示条均使用 `align-self: flex-start` 按文案宽度自适应，并保留左右 `10px` padding。
- 按最新首页视觉规范统一通知、分析和用户详情中的高/中/低意向颜色；通知状态条同步使用最新浅色版本。
- 仅修改前端 Less 与回归测试，不涉及接口或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（110 tests passed）、`git diff --check`。

### 2026-08-28：首页移除排行榜区块标题文案

- 删除首页排行榜卡片上方的“排行榜”标题，仅保留“超级榜单”入口卡片。
- 排行榜卡片点击跳转和数据逻辑保持不变；仅修改首页 WXML 与回归测试，不涉及接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（109 tests passed）、`git diff --check`。

### 2026-08-28：统一小程序页面画布背景色

- 在 `app.less` 新增全局 `@app-page-background: #EDF0F5`，并将首页、通知、分析、素材、排行榜、详情、发布和设置等页面的根画布统一使用该颜色。
- 卡片、导航栏、弹窗、筛选控件及 PDF 阅读器深色阅读底保持原样，以保留内容层级和阅读对比度。
- 仅修改前端 Less 与回归测试，不涉及接口或交互逻辑。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（109 tests passed）、`git diff --check`；当前环境无微信开发者工具 GUI，需在开发者工具或真机确认各页面视觉效果。

### 2026-08-28：首页互动消息第 4、5 条改为真实卡片叠层

- 首页 service 继续使用现有 `GET /analysis/notify/list`，将互动消息预览从 3 条取到最多 5 条；前 3 条完整展示，第 4、5 条使用真实通知数据并按 94% / 89% 缩放叠放在第三条后方。
- 删除原先仅有灰色矩形的占位叠加层，前 3 条仍保持直接点击跳转；叠层消息只作为视觉露出，不新增点击行为。
- 叠层卡片背景沿用 Figma 灰色：第 4 条使用 `#EBEBEB`，第 5 条使用 `#E0E0E0`。
- 仅修改首页 service 预览数量、WXML 结构、Less 样式与回归测试，不新增或修改接口、请求参数和数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（108 tests passed）、`git diff --check`；当前环境无微信开发者工具 GUI，需在开发者工具或真机确认第 4、5 条的实际露出高度。

### 2026-08-27：修正首页互动消息叠加层遮挡卡片问题

- 对照 Figma `747:6618` 修正叠加层结构：叠加底放入第三条卡片的包装容器并置于卡片下方，卡片内容保持在上层，避免灰色区域覆盖文字和缩略图。
- 叠加底按 Figma 的 23px 上偏移、两层 91px 高度和 10px 层间偏移还原，并为包装容器预留底部空间。
- 仅修改首页 WXML/Less 与回归测试，不涉及接口或数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（108 tests passed）、`git diff --check`；需在微信开发者工具或真机热编译后确认视觉效果。

### 2026-08-27：首页互动消息按 Figma 723:11434 调整并支持三条后叠加

- 首页「互动消息」卡片按 Figma `723:11434` 调整：20px 圆角、15px 上下内边距、50×68px 缩略图、意向与状态标签配色及 10px 卡片间距。
- 当未读互动消息超过 3 条时，在第三张卡片下方展示两层灰色叠加底；叠加层仅作视觉提示，不改变第三张卡片点击行为。
- 复用现有 `/analysis/notify/list` 数据和首页预览限制，不新增或修改接口、请求参数和数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（108 tests passed）、`git diff --check`；需在微信开发者工具或真机热编译后确认视觉效果。

### 2026-08-27：首页移除 Hero 太阳光晕 SVG

- 按用户要求移除首页 Hero 区域的太阳光晕装饰：删除 WXML 图片节点、对应 Less 样式和 `assets/home-new/home-hero-glow.svg` 资源。
- 新替换的首页背景 `assets/home-new/home-background.svg` 保留，不影响首页其他内容和交互。
- 仅涉及前端静态资源、WXML 和 Less，不新增或修改接口、数据合同。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`、`git diff --check`；需在微信开发者工具或真机热编译后确认视觉效果。

### 2026-08-27：首页背景改用 WXML image 渲染本地 SVG

- 由于当前 Skyline/glass-easel 页面中通过 WXSS `background-image` 引用本地 SVG 未稳定显示，首页背景改为 WXML `<image>` 节点直接加载 `assets/home-new/home-background.svg`。
- 保留 393×371 的设计比例，背景节点高度为 `742rpx`，不改变首页数据、交互或接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（107 tests passed）、`git diff --check`；需在微信开发者工具或真机热编译后确认视觉显示。

### 2026-08-27：首页顶部背景替换为用户提供的 Bg.svg

- 将用户提供的 `Bg.svg` 原样保存为 `miniprogram/assets/home-new/home-background.svg`。
- 首页 `.home-page__hero-background` 改为使用该 SVG，按 393×371 设计比例铺满顶部背景区域；其他 Tab 背景不变。
- 仅涉及本地静态资源和 Less 样式，不新增或修改接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（107 tests passed）、`git diff --check`、SVG 与源文件字节一致；当前环境无微信开发者工具 GUI，需真机/模拟器复核视觉效果。

### 2026-08-27：通知和互动消息不再展示自己看自己的素材

- `GET /analysis/notify/list` 增加与统计相同的排除：`visitor_id` 等于发布者 `openid` 的浏览/转发不返回。
- 通知 Tab 和首页「互动消息」共用该接口，自己打开自己的作品不再出现在这两处。埋点仍会写入，微信模板推送仍跳过自己。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。需重启 aisales。当前环境无微信开发者工具 GUI，真机打开自己的作品后看通知待确认。

### 2026-08-27：用户详情浏览记录取数修复

- 历史接口不再跟分析页「总」一样只查 62 天，改为 `timeRange=all`；客户列表或历史单路失败也不会把整页打空。
- 合并记录时 `end` 也会留下一条浏览（有 `play` 时仍不重复计浏览次数）。后端统计本身把 `play`/`end` 都算浏览。
- 进入用户详情的 `data-id` 加 `id:` 前缀，避免微信把雪花客户 ID 转成 Number 丢精度后查不到记录。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，请重新编译后再打开用户详情确认浏览记录。

### 2026-08-27：用户详情浏览记录不再等 PDF 预览

- 用户详情先按封面展示浏览记录，不再等所有 PDF 第一页渲染完才出列表；渲染失败或超时也不会把整页记录打空。
- PDF/表格无封面时，列表出来后再补第一页预览。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（106 tests passed）。当前环境无微信开发者工具 GUI，用户详情真机打开待确认。

### 2026-08-27：PDF 预览图覆盖所有缩略图位置

- 无 `coverUrl` 的 PDF/表格不再只在素材列表和详情显示第一页；首页互动消息、今日浏览最多、通知、作品分析、内容分析详情和用户浏览记录共用 `prepareMaterialThumbnail`。
- 仍走 `GET /material/{id}/page/0/image`，有封面时继续用封面；只为当前要展示的素材拉预览，避免首页把全部 PDF 都渲染一遍。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（106 tests passed）。当前环境无微信开发者工具 GUI，各页 PDF 缩略图待真机确认。

### 2026-08-27：Redis 旧转发缓冲补齐 tracking_id 后再落库

- 定时任务把 Redis 里缺 `tracking_id` 的旧转发直接 insert，MySQL 报 `Field 'tracking_id' doesn't have a default value`，每 3 秒回写 Redis 死循环。
- 落库前按 `materialId` 从素材表补追踪码；补不上或仍违反约束的记录丢弃，不再回写。
- 验证：需重启 aisales；新转发仍走立刻 insert。当前环境无微信开发者工具 GUI。

### 2026-08-26：别人转发后立刻出现在通知和互动消息

- 转发原先只写入 Redis 缓冲，批量落库又没有生成主键，`tracking_record` 里没有 `forward` 行，通知 Tab 和首页互动消息都读不到。
- 后端 `POST /tracking/forward` 改为立刻 insert，和浏览一样；Redis 队列改为逐条 insert，把卡住的旧转发补进库。
- 作品详情分享给好友、分享到朋友圈都会上报转发。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。需重启 aisales 后再让别人转发一次；当前环境无微信开发者工具 GUI，真机转发待确认。

### 2026-08-26：首页今日数据完播数展示次数

- 首页「今日数据」的「完播数」原先误用看板完播率，显示成百分比。
- 改为今日 `GET /analysis/dashboard?timeRange=today` 的 `totalCompleteCount` 完播次数。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，首页今日数据待真机确认。

### 2026-08-26：用户详情展示每条作品意向与高意向作品数

- 用户名下方展示「#对 N 个作品高意向」，N 为浏览记录中高意向作品数；没有高意向作品时不显示该标签。
- 每条浏览记录展示该作品的高/中/低意向胶囊。优先用 `/analysis/intent/list` 的客户×作品意向，没有对应行时按该作品浏览次数/完播数本地推导（浏览 ≥2 为高，完播过为中，否则低）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，用户详情页真机打开待确认。

### 2026-08-26：首页互动消息只展示未读通知

- 首页「互动消息」和角标只统计尚未点开的浏览/转发。已读按每条通知 ID 写入本地，点过后再刷新不会回到预览里。
- 同一人之后的新浏览仍会作为新通知出现。通知 Tab 仍展示完整列表。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，点开后刷新首页待真机确认。

### 2026-08-26：发布成功弹窗分享后回到列表即关闭

- 在「发布成功」弹窗里点「分享给好友」后，弹窗立即关闭；从微信分享面板或会话回到素材列表时也不会再弹出。
- 首页素材 Tab 与独立素材页共用同一关闭时机：先生成分享卡片，再隐藏弹窗，避免清空分享字段后卡片没有路径。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（104 tests passed）。当前环境无微信开发者工具 GUI，真机分享返回待确认。

### 2026-08-26：用户详情浏览记录增加完播数

- 每条浏览记录指标顺序改为：进度、观看时长、完播数、浏览次数、转发。完播数使用已有的 `completionCount`（按作品合计 `completeCount`）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，用户详情页真机打开待确认。

### 2026-08-26：首页互动消息与通知 Tab 使用同一份浏览记录

- 首页「互动消息」不再用意向客户摘要（`/analysis/intent/list`、每人一条、只查今天），改为与通知 Tab 相同的 `/analysis/notify/list`，每一次浏览或转发一条，预览最近 3 条未读。
- 意向用户卡和今日浏览最多仍走原分析接口，不受影响。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，首页互动消息待真机确认。

### 2026-08-26：打开作品后通知 Tab 能看到浏览消息

- 通知空着通常有三层原因：本人打开自己的作品原先被后端丢掉；通知 Tab 第一次加载后不再刷新；`viewTime` 对不上时前端把整条丢掉。
- 本人浏览现在也会写入通知和首页互动消息，只跳过微信模板推送到自己。进入通知 Tab、从详情返回，都会重新拉列表。
- 埋点接口读取登录头补 visitorId，素材 ID 兼容字符串，通知时间用 `DATE_FORMAT` 输出，避免列表查到了却画不出来。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启。当前环境无微信开发者工具 GUI，打开 PDF/视频后回通知 Tab 待真机确认。

### 2026-08-26：PDF 和视频查看会计入浏览

- 打开视频或 PDF 详情即上报 `play`，不再等播放进度到 1% 或把单页文档第一次上报成 `end`。
- 点 PDF 预览进入阅读页时带上同一 `sessionId`，进度续在同一次浏览上，不拆成两次。
- 后端若只收到 `end`、没有对应 `play`，补建记录时也会加上浏览次数。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启。当前环境无微信开发者工具 GUI，打开 PDF/视频后的埋点待真机确认。本人浏览会进入通知，不发微信模板给自己。

### 2026-08-26：PDF 点击预览图即可查看

- 素材详情的 PDF/表格去掉「点击查看」按钮；点击预览图（没有预览图时点文件卡片）进入阅读页。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，真机点预览图待确认。

### 2026-08-26：未产生浏览的作品也能打开内容分析

- 从未被浏览或转发的作品，`GET /analysis/content/detail` 原先查不到统计行会返回空，内容分析页只剩标题。
- 后端改为从素材表左连统计，没有记录时仍返回作品信息和 0 次浏览/转发；受众列表为空。
- 前端在详情接口为空时，仍用素材信息渲染作品卡，意向用户展示「没有意向用户」。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后详情接口才从素材表补空数据。当前环境无微信开发者工具 GUI，真机打开待确认。

### 2026-08-26：首页「今日浏览最多」进入作品分析

- 点击「查看更多」或任意一条今日浏览最多作品，都切换到分析页的「作品分析」，不再打开单条内容分析详情。
- 空状态「立即发布」仍进入素材发布，不受影响。作品分析列表里点某一条仍可进入内容分析详情。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，首页点击跳转待真机确认。

### 2026-08-26：朋友打开分享素材后返回先到首页

- 分享卡片改为打开首页并带上 `materialId`，首页再 `navigateTo` 详情，页面栈为 `[首页, 详情]`。左滑或点返回先回到小程序首页，再返回才退出到聊天。
- 旧分享链接仍可能直接打开详情；详情若是栈底页会 `reLaunch` 到上述首页路径，避免一次返回就离开小程序。导航栏 `navigateBack` 失败时也回到首页。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，朋友打开分享卡片后的左滑返回待真机确认。

### 2026-08-26：用户详情「联系用户」会复制用户名

- 「联系用户」原先只弹出提示、没有写入剪贴板。现在与点击用户名相同，复制成功后再显示「微信名称复制成功」。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，真机剪贴板待确认。

### 2026-08-26：通知页按每一次浏览拆成一条

- 通知页不再按客户合并。每一次 `play` 浏览、每一次 `forward` 转发各生成一条通知，同一用户多次打开会看到多条。
- 新增 `GET /analysis/notify/list`（近 62 天），从 `tracking_record` 取 play/forward 行；卡片上的高/中/低意向仍用该客户在范围内的峰值，便于顶部筛选。
- 首页「互动消息」仍按客户摘要最近 3 条，未改。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后通知页才走新接口。当前环境无微信开发者工具 GUI，通知页真机打开待确认。

### 2026-08-26：看过的首页通知刷新后不再出现

- 点击首页互动消息或通知卡片后，将该客户当前这次浏览记为已读；刷新首页时先排除已读记录，再补预览条数和未读角标。
- 通知 ID 改为按客户稳定生成，避免刷新后下标变化把同一条当成新通知。同一客户若之后又有新的 `lastViewTime`，会重新作为新通知出现。
- 通知 Tab 仍展示完整列表，方便回看；不新增已读接口。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，首页下拉刷新真机待确认。

### 2026-08-26：用户详情同一作品只展示一条浏览记录

- 用户详情浏览记录按作品（`materialId`）合并：进度取各次浏览的最大值，观看时长、完播数、浏览次数、转发取合计。
- `GET /analysis/customer/history` 现有响应补 `actionType`（`play` / `forward` 等）。`play` 计为浏览，`forward` 计为转发，不把转发行当成一次浏览。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后历史接口才带 `actionType`。当前环境无微信开发者工具 GUI，详情页真机打开待确认。

### 2026-08-26：总浏览峰值横轴改为 1–6 周序号

- 横轴固定 6 个刻度：1 / 2 / 3 / 4 / 5 / 6，分别表示最近六周的第一周到第六周。没有折线时也画出这些数字。
- 数据仍走 `GET /analysis/trend?timeRange=all`（近两个月），前端从本周往前取 6 个自然周汇总。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，总视图真机待确认。

### 2026-08-26：总浏览峰值改为近两月按周坐标

- 横轴按近两月（与日历筛选同一起点）的自然周铺开，用 1、2、3… 标记每一周；当前约 10 周。刻度和折线画在同一张 SVG 里，共用 270px 坐标系；纵轴随阅读量自动取整。
- 每周从周一起算，首周和本周不足 7 天只累计范围内的天数。数据走 `GET /analysis/trend?timeRange=all`，前端按周汇总。后端趋势「总」范围改为近两个月（当天往前两个月）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后总图才按近两月聚合。当前环境无微信开发者工具 GUI，总视图真机待确认。

### 2026-08-26：本月浏览峰值改为当月日期坐标

- 横轴按本月实际天数铺 1 号到最后一天（28/29/30/31），刻度数字隔 5 天显示，例如 1 / 6 / 11 / 16；31 天的月份会标到 31，30 天的月份最后一档是 26，不强行贴最后一天。
- 刻度和折线画在同一张 SVG 里，共用 270px 坐标系；纵轴随本月阅读量自动取整。折线只画到今天，不画本月尚未到来的日期。
- 数据改走 `GET /analysis/trend?timeRange=month`。后端趋势月范围改为日历月（本月 1 号到今天）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后本月图才按日历月聚合。当前环境无微信开发者工具 GUI，月视图真机待确认。

### 2026-08-26：本周浏览峰值改为周一到周日坐标

- 横轴 1–7 表示周一到周日，刻度和折线画在同一张 SVG 里，共用 270px 坐标系；纵轴随本周浏览量自动取整。
- 数据改走 `GET /analysis/trend?timeRange=week`。后端趋势周范围改为日历周（本周一到今天），只补到当天，不画未来星期。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后本周图才按日历周聚合。当前环境无微信开发者工具 GUI，周视图真机待确认。

### 2026-08-26：按日浏览峰值横轴改为线性时间轴

- 按日峰值展示 0–24 小时的连续时间变化，横轴改用 0 / 4 / 8 / 12 / 16 / 20 / 24 等间隔刻度，首尾贴合绘图区两端。
- 刻度和折线统一使用 0–24 小时线性比例，避免等宽排版不等时间间隔数字造成标签与数据点错位；本周 / 本月 / 总未改。
- 小程序当前渲染层未稳定应用外层 WXML 刻度的 flex 和动态定位，因此横轴刻度改为直接绘制在折线 SVG 中；每个刻度与折线小时点共用同一 270px 坐标系，不再受 WXML 样式隔离影响。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，日视图真机待确认。

### 2026-08-26：总数据「按日」浏览峰值改为当天小时坐标

- 横轴表示一天的时间，只标 0 / 4 / 8 / 12 / 16 / 20 / 24，避免 24 个时刻挤在一起；刻度和小时数据共用 0–24 线性比例。纵轴随当天浏览量自动取整刻度，不再写死 1500。
- 日视图数据改走已有 `GET /analysis/trend?timeRange=today`。后端按 `tracking_record` 小时聚合 play session，补齐到当前小时。本周 / 本月 / 总仍用原按日趋势，等后续再改。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。后端需重启后按日图才有真实小时数据。当前环境无微信开发者工具 GUI，日视图真机待确认。

### 2026-08-26：修复用户详情页按浏览次数排序崩溃

- 打开用户详情时默认按「浏览次数」排序，但 `GET /analysis/customer/history` 映射漏了 `readCount`，`replace` 打在 `undefined` 上。
- 每条观看记录补 `readCount: '1'`（历史接口是逐条 tracking，没有单条浏览数字段）；排序对空计数字段按 0 处理。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，详情页真机打开待确认。

### 2026-08-26：推送意向门槛可在「我的 / 设置」自定义

- 默认仍为高意向。销售可在「我的」右上角「设置」中选择低 / 中 / 高，客户达到所选等级时才走服务号推送。
- 前端通过 `GET/PUT /user/notify-settings` 读写 `notifyIntentLevel`；后端按门槛比较意向，每个客户×素材仍只推一次。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`。当前环境无微信开发者工具 GUI，设置页真机保存待确认。

### 2026-08-26：合并 origin/developer-v2 到 main-v2

- 收下总数据「浏览峰值」折线图（Figma `684:10088`）和按时间节点进度绘制的 `slotCount`。
- 分析页继续走真实接口，不恢复 `mocks/analysis.ts`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（93 tests passed）。

### 2026-08-26：总数据浏览峰值改为可滚动折线图

- 独立分析页与首页内嵌分析的「浏览峰值」由柱状图改为折线图，保留既有周/月趋势数据、网格线、时间筛选与数值接口；公共组件 `miniprogram/components/analysis-trend-chart/` 按 Figma `684:10088` 的 270×151px 坐标系，将传入数据动态转换成圆润 SVG 路径，不显示折线数据点或横轴时间文字。
- 删除 Skyline 下会脱离滚动内容层的 Canvas 实现，改为普通 `image` 节点渲染动态 SVG；折线现在和卡片处于同一滚动层，后续真实趋势数据仍复用同一动态曲线生成逻辑。
- 验证：趋势图组件测试覆盖 12/24 为 50% 与超过理论节点封顶。当前环境无微信开发者工具 GUI，模拟器滚动待确认。

### 2026-08-26：折线图按时间节点进度绘制

- `analysis-trend-chart` 新增 `slotCount` 输入：曲线横向长度按“已返回节点数 / 理论节点数”计算，并封顶在虚线图表宽度内；例如日视图返回 12 个小时节点时，曲线仅绘制至 24 小时宽度的 50%。
- 独立分析页与首页内嵌分析统一传入日 24、周 7、月 30 个理论节点；“总”保持不限制长度。后续真实趋势接口只需返回当前可用节点，现有圆润 SVG 曲线会按同一规则呈现。

### 2026-08-26：朋友打开分享素材后上报浏览与转发

- 根因：素材详情和文档阅读页此前只展示内容，没有调用 `POST /tracking/event`，后端因此不会增加浏览次数，也不会更新高/中/低意向。
- 新增 `services/tracking.ts`：登录后用当前用户 openid 作为 `visitorId`，静默上报 `play` / `end` / `forward`。图片打开即记一次浏览；单图按停留时长刷新 duration（超过 10 秒才到高意向）；多图/PDF 按已看页数；视频在播放、进度和结束时上报。
- 分享路径带上 `trackingId`。本人浏览会写入通知；微信模板推送仍跳过自己。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（90 tests passed）。当前环境无微信开发者工具 GUI，朋友打开分享卡片的真机链路待确认。

### 2026-08-26：合并 origin/developer-v2 到 main-v2

- 收下底部导航轻触震动与选中背景滑动、首页「互动消息」标题、今日数据高/中/低意向指标、排行榜 Figma 预览假数据。
- 首页/分析/通知/素材继续走真实接口；排行榜因后端无接口，用 `mocks/ranking.ts` 做视觉预览，页面仍只通过 service 取数。

### 2026-08-26：所有页面支持下拉刷新

- 滑到页面最顶部再往下拉会刷新当前页数据。内层 `scroll-view` 页面用 refresher，其余页面用 `enablePullDownRefresh`。
- 刷新走现有 service，不把页面打回全屏 loading；发布页下拉只收起动画，避免覆盖未保存的表单。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（89 tests passed）。当前环境无微信开发者工具 GUI，真机下拉手势待确认。

### 2026-08-26：素材详情页接入分享给好友和朋友圈

- 「分享给好友」改为原生 `button open-type="share"`，把当前素材详情页发给微信好友。
- 「分享到朋友圈」弹出引导，让用户点右上角「···」再选「分享到朋友圈」；页面开启 `shareAppMessage` / `shareTimeline`。微信不允许按钮直接拉起朋友圈小程序卡片。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（83 tests passed）。微信好友分享与朋友圈菜单需在真机确认。

### 2026-08-26：体验版改接本机局域网后端

- 真机 / 体验版请求基址从旧 IP `192.168.31.225` 改为当前 WLAN `http://10.136.153.188:8080`，开发者工具仍走 `127.0.0.1`，不走公网域名。
- 同步 aisales `application-dev.yml` 的 `minio.public-base-url`。后端需重启后文件代理才用新地址。

### 2026-08-26：用户分析空状态保留筛选和排序

- 没有意向用户时，日/周/月/日历筛选和浏览次数排序仍留在白色列表卡顶部；空提示只替换用户列表，不再把整块面板换成空状态。
- 独立分析页与首页内嵌分析同步。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（82 tests passed）。当前环境无微信开发者工具 GUI，空状态视觉待确认。

### 2026-08-26：作品分析列表接入真实浏览/转发/完播

- 作品分析每条作品的「浏览次数 / 转发 / 完播」来自 `GET /analysis/content/list` 的 `viewCount` / `forwardCount` / `completeCount`，随日/周/月/自定义时间范围变化。
- 列表请求带上后端已支持的 `orderBy`（`view_count` / `forward_count` / `complete_count`）；切换排序时按接口返回的真实计数重排，不再只改按钮文案。
- 切换作品周期时只拉 dashboard + content/list，并同步刷新顶部「总发布 / 总浏览次数 / 总转发」。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（82 tests passed）。当前环境无微信开发者工具 GUI，真机/模拟器视觉待确认。

### 2026-08-26：合并 origin/developer-v2 到 main-v2（日历与分析交互）

- 收下日历自定义时间范围、用户分析周期/排序、首页今日数据进总数据日视图、今日浏览最多单条进详情等交互。
- 继续走真实分析接口；发布分享闭环保留在首页。

### 2026-08-26：首页今日数据增加意向等级指标

- 首页「今日数据」卡片新增高意向、中意向、低意向第二行指标，复用现有 `intentSummary` 数据，不新增接口字段。
- 卡片保持内容自适应高度，新增行沿用数值在上、灰色标签在下的 Figma `672:9890` 布局。
- 验证：`node --test tests/home-page.test.mjs` 共 `81 tests passed`，`git diff --check` 通过。

### 2026-08-26：排行榜接入 Figma 519:4112 假数据

- `services/ranking.ts` 通过 `mocks/ranking.ts` 返回 8 条固定开发期榜单数据，页面仍不直接依赖 mock。
- 榜单包含浏览量、转发量和完播量三个指标；切换指标继续使用现有排序逻辑。
- 数据和头像仅用于开发预览，不代表生产业务数据；后端排行榜接口仍待确认。

### 2026-08-26：首页标题改为「互动消息」

- 首页通知预览区标题由「实时通知」改为「互动消息」；通知 Tab 页面标题、数据结构和跳转逻辑保持不变。

### 2026-08-26：底部导航增加轻触震动

- 公共 `bottom-tab-bar` 的普通 Tab 和发布按钮点击统一调用 `wx.vibrateShort({ type: 'light' })`，再派发原有导航事件。
- 使用微信短震动轻量级触感；不使用长震动，不改变页面切换和选中背景滑动逻辑。设备不支持时由平台自动降级。
- 验证：`node --test tests/home-page.test.mjs` 共 `79 tests passed`，`git diff --check` 通过。

### 2026-08-26：底部导航选中背景改为横向滑动

- 公共 `bottom-tab-bar` 新增独立选中层，点击首页、通知、发布、分析或我的时，灰色背景通过 `transform` 在五个位置之间平滑移动，不再随 active 按钮瞬间切换。
- 选中层使用 220ms `ease-out` 动画；发布按钮仍按第 3 个视觉位置计算，图标、文字和页面切换逻辑保持不变。
- 验证：`node --test tests/home-page.test.mjs` 共 `78 tests passed`，`git diff --check` 通过。

### 2026-08-26：首页今日最多指标文案微调

- 仅将首页「今日浏览最多」卡片内的指标「浏览」改为「浏览次数」；分析页及其他全局文案未改动。
- 验证：完整 `tests/home-page.test.mjs` 共 `77 tests passed`，`git diff --check` 通过。

### 2026-08-26：作品分析列表指标文案微调

- 仅将作品分析列表卡的紧凑指标「浏览」改为「浏览次数」；首页、用户分析、详情页及其他全局文案未改动。
- 验证：定向回归与完整 `tests/home-page.test.mjs` 共 `77 tests passed`，`git diff --check` 通过。

### 2026-08-26：首页今日数据增加主指标分隔线

- 首页「今日数据」卡复用 `assets/analysis/total-metric-divider.svg`，在「浏览总次数」与「较昨日」之间显示竖线。
- 首页说明行与总数据页统一为指标名、竖线、较昨日和增长值的布局；「较昨日 +30」保持紧邻。

### 2026-08-26：移除总数据增长值前的额外间距

- 数据总览主指标说明行中，「较昨日」与蓝色增长值改为同组紧邻展示，移除两者之间的额外间距；指标名、竖线与「较昨日」之间的 8px 间距保持不变。
- 独立分析页和首页内嵌分析同步调整。

### 2026-08-26：总数据主指标增加较昨日分隔线

- 按 Figma `507:3742`，数据总览的「浏览总次数 / 浏览总人数」说明行在指标名与「较昨日」之间加入用户提供的 `Line 3.svg`，保存为 `assets/analysis/total-metric-divider.svg`。
- 独立分析页和首页内嵌分析共用相同 SVG、12px 文案和 8px 间距。

### 2026-08-26：首页今日数据跳转总数据

- 点击首页「今日数据」卡进入分析的「总数据」页时，时间筛选重置为「日」；如果分析数据已加载，重新加载日维度数据，确保筛选标签和数据一致。

### 2026-08-26：日期范围弹层对齐条件筛选动效

- 公共日期范围弹层的遮罩改为与分析条件筛选一致的 80% 黑色透明度，并以 300ms `ease-out` 从透明渐入。
- 日期范围面板同步采用与条件筛选面板一致的 300ms 自底部上移动画；独立分析页和首页内嵌分析均通过该公共组件生效。

### 2026-08-26：用户分析复用作品分析筛选

- 用户分析移除旧的意向等级分段筛选，改为与作品分析相同的日 / 周 / 月 / 日期范围与浏览次数 / 完播数 / 转发数条件筛选。
- 时间筛选重新加载用户汇总与列表，条件筛选按对应指标对用户列表降序排序；独立页与首页内嵌分析同步。

### 2026-08-26：用户分析新版 Figma 581:8521

- 用户分析沿用现有 Tab 切换、意向筛选和用户详情跳转交互，按新版设计校准汇总标签和用户列表节奏。
- 用户列表指标统一为“浏览次数 / 完播 / 转发”，筛选器与列表使用 20px 间距组织。

### 2026-08-26：按 Figma `490:3386`、`490:3823` 更新用户详情

- 顶部用户卡新增“#对 N 个高意向”展示；`highIntentContentCount` 是可选 ViewModel 字段，当前固定视觉 mock 为 `4`。真实接口尚未提供作品级意向合同，service 暂不展示该值并保留 `TODO(API)` 占位。
- 浏览记录改为 Figma 的分段排序、灰色记录项与单条作品意向标签。浏览次数 / 完播 / 转发筛选只排序当前详情页记录；记录点击仍进入既有作品分析详情。
- 顶部重复的紧凑“联系用户”按钮已移除，保留底部主按钮；记录卡不再展示旧的内容类型字段，意向标签宽度按内容自适应，水平内边距为 10px。开发 mock 覆盖高 / 中 / 低意向及不同排序数值。
- 用户详情页 JSON 显式注册 `segmented-filter`，确保浏览记录顶部筛选条可在微信小程序中渲染。

### 2026-08-26：日期范围不允许未来日期

- 日期范围开始与结束选择器均将当天作为最大可选日期，开始日期最多等于当前日期，无法选择未来日期。
- 由于原生 `date` 选择器仍会灰显未来日期，日期滚轮改为动态三列选项；未来年份、月份和日期不再渲染。
- 日期范围下界调整为当天往前两个月；开始和结束日期均不会显示超出该范围的年份、月份或日期，弹层说明“最长可查询时间2个月”。

### 2026-08-26：日期筛选日历图标放大

- 日历 SVG 的图案在自身画布中占比偏小；筛选控件将其渲染容器扩大到单个选项的 `68rpx × 56rpx`，使真机上的实际图标尺寸与日 / 周 / 月文字视觉平衡。

### 2026-08-26：作品分析日期范围筛选

- 作品分析时间筛选的「总」替换为用户提供的日历 SVG，保存为 `assets/analysis/calendar-filter.svg`；日 / 周 / 月维持原有快捷筛选。
- 点击日历后打开公共日期范围弹层，可选择开始、结束日期并确认；独立分析页与首页内嵌分析共享此交互。当前 mock 继续返回固定演示数据，真实数据源会将已确认范围发送为 `timeRange=custom` 与起止日期。

### 2026-08-26：作品分析顶部留白修正

- 真机中顶部 Tab 到作品汇总卡的可见间距由两个 `40rpx` 间距叠加成约 40px；保留内容区的 20px 内边距，移除汇总卡重复的上边距。
- 汇总卡到作品列表继续使用单个 `40rpx`（20px）间距。

### 2026-08-25：按 Figma `497:5145` 调整作品分析筛选

- 作品分析的日 / 周 / 月 / 总时间筛选与排序控件移入白色作品列表卡顶部，位于汇总卡之后；列表卡以 `flex` 的 `gap: 40rpx` 保证筛选行到第一条作品的实际可见间距为 20px，避免 Skyline 下块元素外边距不生效。卡片顶部内边距、圆角均为 20px。
- 作品时间筛选现在只更新 `visibleAnalysisCards`；作品汇总数据保持首次加载结果，用户分析与总数据不受该筛选影响。首页内嵌分析与独立分析页共用同一展示契约。
- 验证：筛选位置与作用域回归先红后绿；完整前端回归 `69 tests passed`，`git diff --check` 通过。

### 2026-08-25：按 Figma `478:1262` 校准首页今日数据卡

- 首页「今日数据」卡按节点恢复主指标、浏览总次数与「较昨日 +30」比较信息，以及三列完播数 / 转发次数 / 观看人数的层级和间距；卡片点击进入总数据分析的既有逻辑不变。
- `HomeTodayViewModel` 使用可选 `comparison` 展示字段；当前视觉 mock 提供固定开发数据，现有 API 响应未提供日环比时不展示该信息，不新增接口或伪造 API 字段。
- Figma 的浅灰细分隔线已作为本地 SVG 资源保存至 `assets/home-new/today-data-divider.svg`。

### 2026-08-25：全局术语统一为「浏览」

- 小程序所有用户可见的「阅读」文案统一替换为「浏览」，覆盖首页、通知、作品/用户分析、用户详情及对应 mock/service 输出；数据字段与资源路径保持不变。

### 2026-08-25：首页 Hero 更换为 SVG 光晕

- 移除首页猫咪插画与旧资源 `hero-lounge.png`；用户提供的 `Group 57.svg` 保存为 `assets/home-new/home-hero-glow.svg`，作为问候区域的橙色柔光装饰。
- 保留首页既有蓝白渐变与问候文案；Hero 区域位置以随后确认的 Figma `619:9173` 为准。

### 2026-08-25：按 Figma `619:9173` 调整首页首屏位置

- 首页问候区与实时通知区域按新版 Frame 的垂直起点对齐；黄色太阳 SVG 定位到首屏右上方标注区域，以 2× 画布尺寸放大，并保持视觉中心固定在该区域。
- 不改图片资源、问候文案或其他页面结构。
- 验证：位置回归先红后绿；完整前端回归 `67 tests passed`，微信开发者工具 `preview` 成功（预览包 `1.4 MB`）。

### 2026-08-25：用户阅读记录跳转内容详情

- 用户详情页的每条阅读记录现在可点击，并进入现有内容分析详情页 `/pages/analysis-detail/index?id=...`；点击过程保留轻量按压反馈。
- `AnalysisUserRecord` 新增 `contentId` 展示字段；该字段由后端观看历史映射提供，页面仍只通过 `services/analysis.ts` 取数，未新增接口。不恢复已删除的 analysis mock。
- 验证：新增点击路由回归测试先红后绿；完整前端回归 `66 tests passed`，微信开发者工具 `preview` 成功（预览包 `1.5 MB`）。

### 2026-08-25：用户分析意向筛选项始终显示

- 「全部 / 高意向 / 中意向 / 低意向」固定在意向用户卡片顶部；当前筛选项没有用户时只替换列表为空状态，不再把整个卡片和选项卡一起隐藏。

### 2026-08-25：作品分析切换排序后按对应指标重排列表

- 选择「完播数 / 转发数 / 浏览量」后，作品列表按该指标降序重排；默认仍为浏览量。首页分析 Tab 与独立分析页共用同一套排序。
- 排序在客户端基于接口返回的浏览、转发、完播数值完成，不新增未确认的后端排序参数。

### 2026-08-25：作品分析默认排序文案改为浏览量

- 排序按钮默认显示「浏览量」，与选项「完播数 / 转发数 / 浏览量」及默认 `view` 排序一致；不再显示不存在的「阅读量」。

### 2026-08-25：发表后回到原来的素材列表并刷新

- 发表/存草稿改为 `navigateBack` 回到进入发布页前的列表，不再 `redirectTo` 一层新的首页，避免右滑又回到未刷新的旧列表。
- 列表页 `onShow` 读取返回结果后重新请求素材；只有页面栈只剩发布页时才 `reLaunch` 首页素材 Tab。

### 2026-08-25：发布成功弹窗接入分享给好友和朋友圈

- 「分享给好友」改为原生 `button open-type="share"`，把素材详情页发给微信好友。
- 「分享到朋友圈」弹出引导，让用户点右上角「···」再选「分享到朋友圈」；页面开启 `shareTimeline`。微信不允许按钮直接拉起朋友圈小程序卡片。

### 2026-08-25：发布页从底部选择图片/视频或聊天 PDF

- 点击「+」先弹出「图片」「视频」「PDF」；已添加某种类型后只保留该类型。选图片或视频再弹出「拍摄」「从相册选择」。拍摄走 `wx.chooseMedia` 相机（照片或视频，最长 30 秒），相册走系统相册；PDF 走 `wx.chooseMessageFile` 从微信会话选文件。
- 同一条素材不混选类型：多图最多 9 张，视频或 PDF 各 1 个。发表时按类型上传并写入 `IMAGE` / `VIDEO` / `PDF`。

### 2026-08-25：素材筛选按钮固定在列表上方

- 首页素材 Tab 与独立素材页把「全部 / 图片 / 视频 / pdf」筛选项放在 `scroll-view` 外；只有素材网格随列表滚动。

### 2026-08-25：修复 PDF 阅读页顶部页码

- 顶部页码改为按滚动位置计算「阅读区顶部所在的页」，进入时 `scrollTop = 0` 显示 `1 / 总页数`；不再用 IntersectionObserver 的交叉比例（列表预渲染会把未看见的页也算进去）。

### 2026-08-25：合并 origin/developer-v2 最新 UI

- 合入首页通知预览移除、查看更多切 Tab、「今日最多」进作品分析、意向用户/今日数据进分析子 Tab、通知空状态卡片，以及素材发布按钮安全区对齐。
- 数据层仍走真实接口，不恢复 `HOME_DATA_SOURCE` 与 `mocks/home.ts` / `mocks/notifications.ts`。首页已读仅从预览列表移除，通知 Tab 继续请求完整列表。

### 2026-08-25：PDF 用第一页做列表和详情预览

- 无 `coverUrl` 的 PDF/表格素材，列表缩略图和详情预览改为 `GET /material/{id}/page/0/image`（文档第一页）。
- 详情有预览图时展示第一页并保留「点击查看」进入阅读页；渲染失败时回退原来的文件卡片。
- 首页素材面板与独立素材列表共用 `getMaterials()`，会一起更新。

### 2026-08-25：素材详情支持打开图片、视频、PDF

- 对照 `caoxiaogai-aisales`：详情页按 `fileType` 分别展示图片轮播、视频播放器和 PDF/表格卡片，不再把封面塞进轮播。
- 图片点击 `wx.previewImage`；视频用原生 `<video>` 播放；PDF/表格点击进入 `/pages/document-reader`，按页请求 `GET /material/{id}/page-count` 与 `GET /material/{id}/page/{n}/image`，真机页图走 `downloadFile`。
- 未接入旧项目的访客授权遮罩与阅读埋点；销售从素材列表进入即可打开内容。

### 2026-08-25：素材列表展示文案而不是文件名

- 列表卡片 `title` 改为优先取素材 `content`（发布时填写的文案）；文案为空时才回退 `title`（文件名 / 旧数据）。
- 首页素材面板与独立素材页共用同一 service 映射，不改 WXML。

### 2026-08-25：「我的」页接入登录资料

- 头像、昵称改为 `POST /wechat/login` 返回的 `avatar`、`nickname`；头像走文件代理与真机 `downloadFile`。无头像时回退本地占位图，无昵称时显示「微信用户」。
- 删除 `mocks/profile.ts`。余额/提现/会员后端尚未提供接口，余额展示 `0`，会员卡与「尽情期待」保留 Figma 文案，并留下 `TODO(API)`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`；未改动 WXML / Less / JSON。

### 2026-08-25：体验版图片走文件代理并本地下载

- 对照 `caoxiaogai-aisales`：后端 MinIO 直连地址（`:9000/sales-materials` 或裸 bucket 路径）改写为 `/api/files/sales-materials/...`，不再把 `:9000` 主机替换成 API 主机后丢掉代理前缀。
- 开发者工具用 `127.0.0.1`；真机调试和体验版都请求本机局域网后端 `http://192.168.31.225:8080`，不走 `yjxzhang.com`。
- 真机与体验版对头像、封面、素材图先 `downloadFile` 再交给 `<image>`；视频/PDF 详情封面同样走代理 URL。
- 验证：完整测试需重新编译后在体验版确认请求地址为局域网 IP。

### 2026-08-25：修复「我的」service 未被编译

- 开发者工具 `ignoreDevUnusedFiles` 会漏编新加的 `services/profile.ts`，首页报 `module 'services/profile.js' is not defined`。
- 在 `app.ts` 入口引用 `getProfilePageData`，并将 `ignoreDevUnusedFiles` 设为 false。

### 2026-08-25：开发者工具登录改走 127.0.0.1，避免局域网 502

- 现象：模拟器 `POST /api/wechat/login` 报 HTTP 502。本机 Java 直连同一接口返回 HTTP 200 + 业务码 401（无效 code），说明 502 来自开发者工具经局域网 IP / VPN 的网关，不是 Spring 本身。
- 处理：开发者工具使用 `http://127.0.0.1:8080/api`，真机预览仍使用 `http://192.168.31.225:8080/api`。
- 验证：本机 `127.0.0.1:8080` 与 `192.168.31.225:8080` 的 login 均可达（无效 code 时 HTTP 200 + 业务 401）。

### 2026-08-25：首页已查看通知从预览移除

- 点击首页实时通知中的单条卡片并进入用户详情后，该条仅从首页预览列表移除，未读角标同步减一；返回首页后不会再次展示该卡片。
- 通知 Tab 仍请求完整列表，用户可在通知页继续查看同一条记录；当前不发送删除或已读请求。
- 验证：预览卡移除、角标递减回归测试覆盖 `markHomeNotificationViewed`。

### 2026-08-25：修复首页「查看更多」切换通知页

- 首页实时通知的「查看更多」使用 WXML `data-id` 触发，`onTabTap` 现在同时读取组件事件的 `detail.id` 和页面节点的 `currentTarget.dataset.id`。
- 点击后 `activeTabIndex` 切换为通知 Tab，首页面板隐藏，通知面板展示；底部导航事件行为保持不变。

### 2026-08-25：「今日最多」单条内容跳转详情

- 首页区块标题改为「今日浏览最多」；其「查看更多」继续切换至分析页，保持原有逻辑；每一条作品记录改为独立跳转现有内容分析详情页 `/pages/analysis-detail/index?id=...`。
- 移除内容卡整体跳转，避免点击某条作品时误进入作品分析列表；空状态的「立即发布」入口保持不变。
- 验证：单条跳转用例先红后绿；完整首页回归 `67 tests passed`，`git diff --check` 通过。

### 2026-08-25：首页实时通知空状态卡片

- 按 Figma 节点 `611:9128`，首页实时通知在 `homeData.notifications` 为空时显示白色圆角空状态卡片，包含云朵图和「暂时还没有人浏览你的作品」文案；有通知数据时继续渲染原有通知卡片。
- 卡片使用 `#F0F0F0` 描边、20px 圆角、`0 2px 10px rgba(0,0,0,0.03)` 阴影，复用本地 `miniprogram/assets/analysis/empty-state-cloud.png`。

### 2026-08-25：首页统计卡片跳转分析子 Tab

- 首页「意向用户」卡片点击后切换到分析页的「用户分析」Tab；「今日数据」卡片点击后切换到「总数据」Tab。
- 复用首页现有 `activeTabIndex`、分析页 `activeAnalysisTab` 和 `setAnalysisTab`，未新增页面或导航路径。

### 2026-08-25：素材发布按钮真机安全区对齐

- 根因：悬浮发布按钮使用固定 `rpx` 偏移，底部导航在真机会按安全区上移，导致两者间距不一致。
- 按钮现以底部导航相同的安全区基准定位，并在 Android/开发者工具上采用导航的 `16px` 基准；两端均保留 10px 视觉间距。

### 2026-08-25：素材发布按钮与导航间距

- 素材页悬浮「发布素材」按钮的底部偏移由 `80rpx` 调整为 `40rpx`，使按钮与底部导航之间的视觉间距为 10px。

### 2026-08-25：统一内容卡片描边

- 在 `app.less` 定义全局 `@content-box-border: #EBEBEB`，作为内容页面 Box/Card 的唯一描边 token。
- 首页、通知、排行榜、分析、分析详情、用户详情、素材、我的页余额卡和素材发布图片格均改为引用该 token；底部导航、操作按钮、状态控件、列表分隔线、图表网格线和竖线背景不变。

### 2026-08-25：排行榜复用「我的」页竖线背景

- 排行榜移除上传 SVG 的图片渲染，改为复用「我的」页相同的竖线背景定义：`4rpx` 左偏移、`260rpx` 高、`#F0F0F0` 的 2px 间隔竖线和从上至下淡出的遮罩。

### 2026-08-25：修复 Figma `594:8711` 模块被遮挡

- 根因是 `.home-profile__locked-overlay` 在 WXML 内容之后渲染且使用 `z-index: 2`，覆盖了同一内容层中的「尽情期待」模块；Figma 原始层级中该模块位于遮罩层之上。
- 取消 `.home-profile__content` 的 `z-index: 1` stacking context，并将 `.home-profile__pending` 提升为相对定位、`z-index: 3`，使节点 `594:8711` 真正位于 `z-index: 2` 遮罩层之上；居中布局保持不变。
- 验证：`node --test tests/home-page.test.mjs`（57 tests passed）；`git diff --check` 通过。

### 2026-08-25：排行榜空数据卡片底部留白

- 排行榜无数据时，内容区改为纵向弹性布局，`.ranking-panel--empty` 占满英雄区下方的剩余可视高度；卡片外部至页面底部固定保留 `48rpx`（24px）。
- 有数据时榜单卡不参与填充，仍随列表自然增长并保持 Figma `519:4104` 的 20px 内边距。

### 2026-08-25：按 Figma `594:8711` 居中「尽情期待」模块

- 将「尽情期待 / 更多功能，即将呈现」模块按 Figma 节点 `594:8711` 标记，并固定整体内容宽度为 `126px` 的响应式等值 `252rpx`。
- 按节点保持 `10px` 间距、`24px` 横向内边距和 `42px` 圆角，按钮与说明文字作为一个整体水平居中。
- 验证：`node --test tests/home-page.test.mjs`（54 tests passed）；JSON、WXML 本地资源和差异检查通过。

### 2026-08-25：按 Figma `519:4104` 校准排行榜底色与榜单卡

- 排行榜最底层背景从 `#E8EDF5` 改为 `#FFFFFF`，避免内容区结束后露出蓝灰色页面底色；内容渐变继续由透明白过渡至白色。
- 排行榜卡片按节点 `519:4104` 调整为 `#FFFFFF` 纯底、`#F0F0F0` 描边、20px 圆角、20px 内边距和 `0 2px 10px rgba(0,0,0,0.03)` 阴影。
- 切换器至榜单行的间距调整为 10px；公共分段切换组件的 32px 高、2px 内边距、10px 外圆角与 8px 选中圆角保持不变，符合该节点。
- 验证：Figma 节点上下文与截图已读取；排行榜定向回归先红后绿通过。

### 2026-08-25：一级页面仅通过底部导航切换

- `disable-touch` 在当前预览中未能阻止根 `swiper` 的横向切换，因此根容器改为普通 `view`；首页、通知、发布、分析和我的面板由 `activeTabIndex` 的 `hidden` 状态显示，彻底移除一级页面的横滑入口。
- 底部导航仍通过 `activeTabIndex` 即时切换一级页面；只删除了原先供根 `swiper` 使用的 `onTabChange` 处理。
- 通知、分析内部的顶部菜单与分析筛选触摸事件未改动，仍可在各自页面内完成切换。
- 验证：无根 `swiper` 的一级导航用例先红后绿；全量 `node --test tests/home-page.test.mjs` 为 53/53 通过；已打开微信开发者工具项目触发热更新。

### 2026-08-25：排行榜背景资源与公共分段切换

- 排行榜顶部竖条背景替换为用户提供的 `竖条背景.svg`，本地保存为 `miniprogram/assets/ranking/ranking-stripes.svg`；页面只引用该新资源。
- 排行榜内容渐变改为透明白色过渡至 `#FFFFFF`，底层 `#E8EDF5` 与竖条层级保持原有关系。
- 新增 `components/segmented-filter/` 公共组件，统一处理分段切换的 32px 高度、2px 上下留白、圆角、选中动画、点击与滑动事件。
- 排行榜、独立分析页、首页内嵌分析与内容分析详情的同类控件均迁移至该组件，移除页面内重复的私有筛选器样式与选中块偏移状态。
- 验证：新增资源/公共组件回归先红后绿；`node --test tests/home-page.test.mjs`（53 tests passed）、全部 JSON 解析与 `git diff --check` 通过。当前环境没有 TypeScript CLI，需由微信开发者工具完成最终编译与视觉确认。

### 2026-08-25：实现「我的」页 Figma 视觉切片

- 读取 Figma 节点 `519:5031`，将「我的」页接入首页现有 `swiper` 根 tab，保留底部悬浮导航和“我的”选中态。
- 新增 `ProfilePageViewModel`、固定 typed mock、`services/profile.ts` 以及 `components/home-profile/`，页面不直接依赖 mock；会员和提现保持视觉占位，不伪造后端写入结果。
- 导出并本地保存 Figma 头像和会员卡背景/光斑 SVG 到 `miniprogram/assets/profile/`，页面不依赖临时远程 Figma URL。
- 验证：`node --test tests/home-page.test.mjs`（53 tests passed）；21 个 JSON 文件解析通过；WXML 本地资源引用检查通过；`TODO(API)` 可定位；当前环境无 `tsc` 命令，微信开发者工具/真机视觉验收待执行。

### 2026-08-25：首页空状态保留榜单入口

- 首页的排行榜入口不再依赖「今日最多」是否有内容；空状态下仍显示既有榜单卡，并继续跳转到 `/pages/ranking/index`。
- 保留现有排行榜卡片、高清标题和奖杯资源，不新增榜单数据、Mock 或视觉资产。
- 验证：空状态榜单入口回归先红后绿通过。全量回归当前为 49/51，通过外的两项失败分别是并行个人页测试缺少 `types/profile.ts`，以及并行资源使源码包达到 2165KB、超过 2MB；本次只修改 WXML 条件与回归断言，未引入资源。

### 2026-08-25：按 Figma `587:8623` 重做总数据 Tab

- 独立分析页和首页内嵌分析页的总数据视图统一改为「日 / 本周 / 本月 / 总」周期控件、数据总览卡与阅读峰值柱状图；移除旧的「阅读数据」本周/本月二级切换。
- 数据总览展示阅读总次数、阅读总人数及六项 3×2 指标；视觉预览 mock 固定为 Figma 对应的 `122,100次`、`920人`、`5 / 233 / 872 / 2 / 2 / 0`。
- 周期控件可点击：本月显示 30 根柱状图，其余周期显示 7 根；柱图和摘要数据均经分析 service 输出。
- 修复：首页内嵌总数据的主指标循环改为直接的 flex 子项，避免 Skyline 将两项数据纵向堆叠；周期控件移出内嵌内容的滚动容器，始终固定在分析 Tab 下方。
- 修复：首页内嵌「作品分析」的排序弹层提升至根页面层级，遮罩现在覆盖固定的分析顶部、内容区和底部导航；独立分析页保持原有弹层结构。
- 验证：总数据与排序弹层回归通过，JSON 解析与 `git diff --check` 通过；完整回归 `64 tests passed`。本工作区未安装 TypeScript CLI，需在微信开发者工具中完成最终编译与视觉复核。

### 2026-08-25：发布底部导航选中态对齐

- 按用户指定的 Figma 视觉基线，将发布项调整为与其余导航一致的 `#E0E0E0` 胶囊选中底和 `#0EC8D9` 标签色；素材页仅高亮发布项，不再同时高亮首页。
- 新增的发布选中态资源现为 `tab-publish-selected.svg`；当前新版样式使用白色主图形和主题色加号，并通过新文件名避免命中旧颜色缓存。
- 验证：发布选中态先红后绿的定向回归通过；全量 `node --test tests/home-page.test.mjs` 为 46/46 通过。

### 2026-08-25：按 Figma `507:1682` 重做用户分析

- 用户分析页和首页内嵌分析组件统一改为高/中/低意向三张汇总卡，随后展示「意向用户」标题和白色圆角列表卡；意向筛选控件移入列表卡顶部。
- 首页内嵌分析组件显式接收当前 `activeAnalysisTab`，顶部选择「用户分析」后会同步切换到用户列表内容，而非停留在默认作品分析视图。
- 用户列表卡改为纵向 flex：筛选条固定在卡片顶部，用户行从其下方纵向排列，避免筛选与列表横向挤压错位。
- 固定视觉 mock 更新为 Figma 的五条用户数据，列表指标改为「阅读 / 完播 / 转发」；高意向标签使用 `#FFD7CE` / `#FF4343`，筛选控件底色使用 `#E0E0E0`。
- 真实数据映射同步改用 dashboard 的三档意向统计和客户完播数；移除只为旧「观看作品」指标服务的额外详情请求与已读红点状态。
- 验证：用户分析相关的 3 项回归断言通过，`git diff --check` 通过；完整测试当前有 2 项与用户分析无关的素材发布导航断言失败（预期与并行修改后的首页实现不一致），本次未改动该逻辑。本工作区未安装 TypeScript CLI，尚无法执行 `tsc --noEmit`。

### 2026-08-25：规范顶部标题的中文字体渲染

- 导航栏标题显式固定为 PingFang 优先字体族、`17px / 700 / 24px`，不再依赖系统 `bold` 与默认行高。
- 通知与分析沿用默认 `700`；内容分析详情页仅把字重降为 `600`，字号、字体族和行高保持一致。
- 验证：导航标题回归用例通过，JSON 解析与 `git diff --check` 通过；当前完整测试有 2 项并行用户分析结构断言失败，与标题字重改动无关。

### 2026-08-25：按 Figma `486:2569` 接入首页空数据状态

- 首页视觉预览 mock 切换为固定零数据：实时通知和今日最多列表为空，意向与今日数据均显示 `0`；意向卡保留设计稿中的五个本地头像。
- 实时通知展示云朵空提示；今日最多展示带云朵、说明文案和「立即发布」入口的白色圆角卡片；无作品时隐藏排行榜。
- 空状态下意向标题按设计显示「今日有个新增用户」，不再显示强调色的 `0`。
- 验证：`node --test tests/home-page.test.mjs`（36 tests passed）；`node --check` 已通过相关 TypeScript 文件，首页 JSON 解析与空状态 WXML 分支检查通过。微信开发者工具已通过 CLI 打开项目触发编译；当前无可用桌面显示权限，未能抓取模拟器截图进行人工像素级复核。

### 2026-08-25：按 Figma `497:4640` 重做用户详情页

- 用户列表点击后进入的用户详情页改为白色页面，使用 Figma 的“分析”导航、用户信息卡、四项统计、联系用户按钮和阅读记录列表结构。
- 当前页面通过 `services/analysis.ts` 的 mock 数据分支展示固定虚构数据；点击用户名复制到剪贴板后显示 Figma 中的双行提示文案。
- 移除旧的阅读记录分段筛选，记录缩略图、标题、日期、类型和四项数据按新版详情稿展示。
- Figma 资源下载接口本次不可用，详情页图片暂复用项目内本地占位资源，数据和资源入口保持可替换。
- 根据 Figma 复核反馈，阅读记录补回白色描边外层容器；灰色记录卡改为 10px 内边距、50×68px 缩略图、上下两行统计以及准确的标题和列表间距。
- 联系用户按钮现在复用 Figma `497:4855` 的双行黑色提示弹窗；用户名复制和联系用户入口共用一个可清理的定时显示状态。
- 用户详情页顶部导航标题改为“用户详情”，不再显示“分析”。
- 验证：用户详情页定向回归通过；全量测试为 `38 passed / 2 existing failures`，失败项属于现有分析用户页断言，与本次无关；TypeScript 编译未执行（仓库未安装 `tsc`，需在微信开发者工具中编译确认）。

### 2026-08-25：按 Figma `519:4256` 接入素材发布首页

- 首页与通知页底部中央“发布”入口现在先进入 `/pages/materials/index`，符合发布首页的跳转顺序。
- 素材首页复用现有五栏底部导航；保留页面的悬浮“发布素材”按钮，继续进入 `/pages/materials/publish/index` 编辑页。
- 为底部导航和悬浮按钮增加内容避让，避免素材列表最后一行被遮挡。
- 素材首页目前使用 `MATERIALS_DATA_SOURCE = 'mock'` 的四条固定本地素材数据，避免视觉验收被真实接口响应阻塞；未来改为 `api` 即可恢复后端数据源。
- 已使用用户提供的 `竖条背景.svg` 作为顶部渐隐竖条背景；页面内容区恢复 Figma 的白色背景，缩略图调整为铺满卡片。
- 移除发布按钮容器的蓝色渐变遮罩；底部导航、发布按钮和内容改为独立层级，素材内容不会再被底部遮罩覆盖。
- 素材页层级按确认顺序固定为：内容（`z-index: 2`）→ 发布按钮（`z-index: 3`）→ 底部导航（`z-index: 1000`）。
- 顶部导航在素材列表滚动过程中的透明背景改为白色（`#FFF`），透明度仍沿用排行榜的滚动计算逻辑。
- 素材首页已并入根首页的 Swiper，底部“发布”与首页、通知、分析、我的处于同一主导航层级，只切换容器内容，不再跳转 `/pages/materials/index`；编辑页保存草稿或发表后回到根容器的素材面板。
- 素材面板激活时，底部“发布”使用青色标签与图标表示选中；发布位原有的白色底保持不变，不覆盖为其他标签的灰色选中底。
- 按 Figma `519:4383` 重做素材卡片信息区：使用白色纯底、`#F0F0F0` 描边、底部 12px 圆角与均匀 10px 阴影；保留 10px/8px 内边距和 10px 文本间距，标题改为 14px 常规字重。
- 素材筛选栏（全部 / 图片 / 视频 / PDF）固定于顶部导航下方：列表上滑时收起，下滑或回到顶部时立即出现；根首页素材面板与独立素材页保持一致。
- 公共底部导航按平台定位：Android（含开发者工具预览）固定保留 16px；iPhone 最少保留 24px，并优先使用更大的 `safe-area-inset-bottom`。
- 首页渐变背景、素材页底色与竖条背景、排行榜页底色均提升为视口固定层；下拉时只移动内容，“我的”本身保持固定容器，不随内容滚动。
- “我的”页竖线背景改为视口固定层，并置于内容、锁定遮罩与导航下方，避免第一屏下拉时背景跟随移动。
- “我的”页锁定遮罩起点上移 1px（`444rpx` → `442rpx`），覆盖余额卡片的黑色描边泄漏。
- 验证：固定背景定向回归通过；全量 `tests/home-page.test.mjs` 为 56/56 通过。
- 验证：底部导航平台定位定向回归通过。全量 `tests/home-page.test.mjs` 当前为 48/51，失败项来自并行个人页、首页素材筛选结构与包体预算断言，非本次底部导航组件改动。
- 验证：发布选中态定向回归通过；全量 `tests/home-page.test.mjs` 为 46/46 通过。组件级 TypeScript 需由微信开发者工具编译（Node 无法解析小程序无扩展名模块导入）。
- 验证：根导航、素材发布入口与编辑返回路径的定向回归通过；全量 `tests/home-page.test.mjs` 为 45/45 通过。
- 验证：素材页导航、Mock 数据、竖条背景和发布层级的 4 项定向回归通过；素材页 TypeScript 语法检查通过。全量回归当前有 1 项分析用户页的并行样式失败，与素材页改动无关。
- 验证：发布入口、导航、Mock 数据和竖条背景的定向回归通过；相关 TypeScript 与 JSON 语法检查通过。全量页面测试当前 36 通过、2 项并行页面既有失败（用户详情结构、导航栏字体 token）。开发者工具窗口截图因系统显示器权限不可用而未能采集，需在开发者工具中重新编译预览做最终画面核验。

### 2026-08-25：内容分析详情页复用分析顶部控件

- `analysis-header` 新增标题属性，默认仍为“分析”；内容详情页传入“内容分析”且不渲染分析 Tabs。
- 内容详情页不再直接声明 `navigation-bar`，标题字号、字重与导航间距和分析页使用同一实现。

### 2026-08-25：内容分析详情页按 Figma `497:5232` 改版

- 保留现有作品卡点击跳转，详情页改为白色背景、浅蓝白渐变内容卡、50px × 68px 缩略图和四项作品指标。
- 意向用户区域改为 Figma 的灰色标题、白色圆角容器、32px 分段筛选和随用户数量自然增长的列表；高意向标签统一为红色 `#FF4343 / #FFD7CE`。
- 分析服务在视觉预览 Mock 模式下新增详情页固定数据，打开作品详情即可展示五条虚构意向用户记录。
- 验证：完整测试 30 tests passed；页面 JSON 解析、详情页依赖边界和 `git diff --check` 通过。

### 2026-08-24：压缩预览资源以满足微信 2MB 上传限制

- 预览报错原因为源码包 3410KB，超过微信开发者工具 2MB 限制。
- 对 PNG/JPG 资源做视觉无损范围内压缩；通知头像调整为 320×320，展示尺寸和页面布局不变，首页主图透明效果保留。
- 当前 `miniprogram` 实际文件体积约 1.39MB；新增上传体积回归测试。

### 2026-08-24：首页分析顶部与通知共用嵌入结构

- 新增 `analysis-header` 公共组件，独立分析页与首页分析共用标题和 Tab；首页分析的顶部移出 `scroll-view`，结构与通知 Tab 一致。
- 首页嵌入模式下，分析内容取消独立页的固定顶部预留；作品筛选继续保留 20px 间距。
- 分析 Tab 全宽分隔线固定为 `#F4F5F5`，激活下划线采用通知同款 `#000000`。
- 验证：完整首页回归测试 28 tests passed；`git diff --check` 通过。

### 2026-08-24：分析页顶部直接沿用通知页定位样式

- 分析页顶部容器改为通知页同款 `fixed; top: 0; left: 0; z-index: 1001; width: 100%` 白色容器。
- 分析内容区使用通知页的 `@notification-header-height` 预留顶部空间；作品分析在此基础上保留原有 20px 筛选间距。
- 验证：完整首页回归测试 27 tests passed；`git diff --check` 通过。

### 2026-08-24：通知页底部背景改为纯白

- 通知页嵌入首页时，通知面板和其独立滚动容器明确使用 `#fff`，避免底部露出首页的 `#fafafa`。
- 通知内容根节点同步增加纯白背景，独立通知页的既有白色背景保持不变。
- 验证：通知滚动结构专项测试通过；`git diff --check` 通过。完整回归中仅有既存分析页样式断言不匹配，与本次改动无关。

### 2026-08-24：将通知顶部移出首页滚动容器

- 首页通知 Tab 改为「顶部通知组件 + 独立 `scroll-view`」的结构，顶部不再作为滚动列表的子节点，解决微信开发者工具和真机中顶部随列表一起滚动的问题。
- 独立通知页使用同一顶部组件的固定模式；列表按导航栏和筛选栏总高度预留顶部空间，首页嵌入模式取消该额外留白。
- 验证：`node --test tests/home-page.test.mjs` 27 tests passed；相关 JSON 解析通过；`git diff --check` 通过。

### 2026-08-24：统一通知与分析页顶部 Tab 高度

- 两页继续复用现有 `navigation-bar`；将通知筛选栏与分析页 Tab 的高度提取为全局 `@page-top-tab-height: 64rpx`（32px）。
- 分析页原本的 72rpx Tab 已调整为通知页基线，标题、选中下划线和页面内容不变。
- 验证：完整首页回归测试 27 tests passed；`git diff --check` 通过。

### 2026-08-24：固定通知页顶部导航与筛选栏

- 将通知标题导航和四项筛选栏放入同一个顶部容器，顶部容器使用 `position: fixed; top: 0`。
- 通知卡片列表继续作为独立内容区域滚动，向上滚动时顶部标题、微信胶囊区域和筛选栏保持原位。
- 首页内嵌通知面板同步使用同一固定结构。

### 2026-08-24：修正作品分析排序弹层与底部导航的层级

- 首页中的排序弹层位于分析组件内部，无法跨越根级底部导航的组件层级；弹层打开时父页面暂时隐藏导航，关闭后自动恢复。
- 验证：完整首页回归测试 26 tests passed；`git diff --check` 通过。

### 2026-08-24：调整分析 Tab 分隔线颜色

- 分析 Tab 区域的整条底部分隔线由 `#DFE5EE` 调整为 `#F4F5F5`；当前选中项的黑色短下划线保持不变。
- 验证：完整首页回归测试 25 tests passed；`git diff --check` 通过。

### 2026-08-24：调整作品分析筛选栏的 20px 间距

- 筛选栏距离顶部分析 Tab 调整为 20px；周期筛选与「阅读量」排序控件之间固定为 20px，不再由两端对齐拉开。
- 20px 顶部间距由作品分析白色内容区的内边距提供，避免首个子元素外边距露出旧的 `#E8EDF5` 页面底色。
- 首页内分析组件和独立分析页使用同一间距参数，避免两个入口出现差异。
- 验证：完整首页回归测试 24 tests passed；`git diff --check` 通过。

### 2026-08-24：按 Figma `517:3836` 校准分析页周期与排序筛选

- 日/周/月/总和阅读量排序控件统一为 `#E0E0E0` 外层、32px 高、2px 内边距和 10px 圆角；白色选中块为 28px 高、8px 圆角，文案为 13px。
- 首页内分析通过独立 `home-analysis` 组件的专用 Less 覆盖同一组参数，避免开发者工具遗漏被导入样式的更新；排序外层移除旧的浅灰描边。
- 验证：完整首页回归测试 24 tests passed；`git diff --check` 通过。

### 2026-08-24：移除作品分析 Tab 与筛选栏之间的额外间距

- 将新版作品分析筛选栏的专用 `margin-top` 从 `40rpx` 调整为 `0`，使筛选控件紧贴顶部分析 Tab，消除截图中的空白分隔带。
- 增加对应回归测试，避免后续共享样式覆盖该布局关系。
- 验证：完整测试 23 tests passed，页面 JSON 解析和 `git diff --check` 通过。

### 2026-08-24：通知页切换为 Figma 视觉验收假数据

- 新增 `NOTIFICATION_DATA_SOURCE`，当前固定为 `mock`；通知页面不再请求后端接口。
- 新增 `mocks/notifications.ts`，提供与 Figma `486:1850` 对应的两组日期、五张通知卡、意向标签、状态胶囊、头像和缩略图。
- 后续接入真实通知接口时，将 `config/dev.ts` 的数据源改为 `api`，页面结构和样式无需调整。

### 2026-08-24：分析页作品分析切换固定假数据

- 新增 `ANALYSIS_DATA_SOURCE = 'mock'`，分析 service 在当前 Figma 视觉验收阶段返回类型化固定假数据；后续切换为 `api` 时页面结构无需调整。
- 新增五条固定作品数据，使用 `assets/analysis/` 与 `assets/home-new/` 本地缩略图，统计值和日期按 Figma 作品分析布局填充。
- 新增 `components/home-analysis/index.less`，引入分析页共享样式，修复首页分析组件中作品列表样式未生效、显示原始文本的问题。
- 验证：完整测试 21 tests passed；页面 JSON 解析、分析页/组件依赖边界和 `git diff --check` 通过。当前环境未安装 `tsc`，未执行独立 TypeScript 编译。

### 2026-08-24：通知页按新版 Figma `486:1850` 重做

- 通知页改为白色背景和新版顶部导航，筛选项改为 32px 高、选中项底部黑色 2px 下划线。
- 通知卡片改为 20px 圆角白卡：头像 40px、操作图标右下角 17px、缩略图 50×68px，底部展示低/中/高意向对应的行为状态胶囊。
- 删除旧版联系用户按钮、蓝灰背景竖线和卡片渐变；通知时间改为“月日 时:分”，并复用已有底部悬浮导航组件。
- 从新版 Figma 导出并保存鸭子头像、黑猫头像、河流缩略图和水下缩略图到 `assets/notifications/`。
- 验证：新版通知回归测试通过；页面 JSON、资源检查和 `git diff --check` 通过。

### 2026-08-24：分析页作品分析改版

- 读取 Figma 节点 `497:4859`，仅改造“作品分析”页签；“用户分析 / 总数据”的交互和展示结构保留。
- 作品分析按新版 Figma 改为白色页面、紧凑时间与阅读量筛选、三张小型汇总卡，以及带圆角边框的多作品列表容器。
- 单个作品行改为 `50px × 68px` 缩略图、标题、`yyyy-MM-dd HH:mm 发布` 时间和“浏览 / 转发 / 完播”三项指标；ViewModel 增加 `publishedAt` 与 `compactMetrics`，service 统一完成映射。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（19 tests passed）；页面 JSON 解析、依赖边界和 diff 检查通过。

### 2026-08-24：调整底部导航未选中颜色

- 底部导航选中图标与文字保持 `#0EC8D9`；未选中图标与文字统一调整为 `#666666`。
- 底部导航选中项的浅灰背景调整为 `#E0E0E0`。
- 发布入口继续使用用户提供的 `Frame 61.svg` 图标和「发布」文案。
- 验证：首页回归测试 18 tests passed；微信开发者工具预览编译成功，包体 2,090,253 bytes。

### 2026-08-24：首页顶部导航按 100px 滚动距离渐变为纯白

- 首页顶部导航背景使用 `rgba(255, 255, 255, opacity)`，初始透明度为 0，随首页内部 `scroll-view` 的 `scrollTop` 线性变化，在 100px 时达到 1，之后保持纯白 `#FFFFFF`。
- 顶部居中「首页」标题复用同一滚动进度，以 `rgba(0, 0, 0, opacity)` 从 0% 线性显示至 100%。
- 新增 `utils/home-header.ts`，仅负责 0–1 范围的透明度计算；页面在滚动值未变化时不重复 `setData`。
- 验证：首页回归测试 18 tests passed；TypeScript、JSON、Git 空白检查通过；微信开发者工具预览编译成功，包体 2,090,253 bytes。

### 2026-08-24：底部导航即时切换

- 首页底部导航切换保留同一 `swiper` 容器，但将切换时长设为 `0`；点击图标后直接显示对应页面，不再出现左右滑动过渡。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（17 tests passed）；`git diff --check` 通过。

### 2026-08-24：按用户提供的 `Frame 61.svg` 更新底部发布入口与导航颜色

- 发布入口替换为 24×24 的加号图标，并补充「发布」文案；入口仍触发现有发布页，不参与 Tab 选中态。
- 发布图标资源改为 `tab-publish-frame-61.svg` 并与用户提供的 `Frame 61.svg` 保持完全一致，背景色为 `#666666`；替换旧文件路径以强制开发者工具重新加载资源。
- 底部导航改为每个 Tab 使用独立的选中/未选中图标资源：选中图标与文字为 `#0EC8D9`，未选中图标与文字为 `#999999`。
- 保留通知红点、首页选中背景、左右滑动 Tab 容器和安全区适配不变。
- 验证：首页回归测试 17 tests passed；微信开发者工具预览编译成功，包体 2,089,537 bytes。

### 2026-08-24：底部导航改为首页内 Tab 切换

- 底部「首页 / 通知 / 分析 / 我的」不再通过 `wx.navigateTo` 打开新页面；首页使用原生 `swiper` 作为统一容器，点击底部图标更新 `activeTabIndex`，由微信提供左右滑动过渡。
- 新增 `home-notifications` 与 `home-analysis` 展示组件，页面仍由首页调用现有 `services/notifications.ts`、`services/analysis.ts` 获取数据；通知卡片和分析卡片的详情点击继续进入详情页。
- 「我的」暂时保留同一容器内的“我的页面待设计”占位，不新增正式页面；发布按钮和排行榜入口行为保持不变。
- 首页引入通知/分析页面样式作为共享组件样式；微信开发者工具预览编译成功，最终包体 2,086,763 bytes，未超过当前预览限制。
- 为避免未使用旧版首页图标资源占用预览包，在 `project.config.json` 的 `packOptions.ignore` 中排除 `assets/home`；新版资源使用 `assets/home-new`。
- 验证：首页回归测试 16 tests passed；首页及两个展示组件 TypeScript 语法、JSON、Git 空白检查通过。

### 2026-08-24：按 Figma `525:5115` 在首页新增排行榜入口

- 在首页「实时通知」与「今日最多」之间新增排行榜入口，保留现有首页数据流、底部导航和其他卡片行为不变。
- 入口按 Figma 使用排行榜标题、说明文案和奖杯图，点击跳转既有 `/pages/ranking/index`；图片复用 `miniprogram/assets/ranking/` 内的高分辨率本地资源，不依赖临时 Figma URL。
- `ranking-title.png` 为 576×150、`ranking-trophy.png` 为 294×351，按首页卡片尺寸缩放显示，作为 3x 资源基线。
- 新增首页回归测试，覆盖入口位置、跳转、Figma 视觉关键值和资源尺寸；完整首页测试 15 tests passed。

### 2026-08-24：启用新版首页视觉预览 Mock

- 因真实接口当前没有可展示数据，首页 service 默认从 `miniprogram/mocks/home.ts` 返回固定 typed mock，页面继续只消费 `HomePageViewModel`。
- Mock 覆盖 3 条实时通知、2 条今日内容、意向分布和今日数据，人物均为虚构信息，图片使用仓库内本地素材。
- 首页真实接口组合逻辑仍保留在 `miniprogram/services/home.ts`；确认接口有数据后，将 `miniprogram/config/dev.ts` 的 `HOME_DATA_SOURCE` 改为 `api` 即可切回。
- 验证：首页回归测试 12 tests passed；Mock 资源引用检查通过；当前环境未安装 TypeScript 编译器与 `lessc`，未能执行对应编译检查。

### 2026-08-24：按 Figma `478:1620` 校准「今日最多」内容卡

- 将两条内容从两个独立卡片调整为一个白色圆角组合卡，卡内按 Figma 使用 20px 左右内边距、50×68px 缩略图、16px 图片与文字间距及一条浅色分隔线。
- 统计标签按 Figma 使用「阅读 / 转发 / 高意向」，数值保持 14px 并带 `+` 前缀；下载并保存该节点的两张原始图片到 `miniprogram/assets/home-new/`。
- 验证：首页回归测试 12 tests passed；新增 Figma 资源引用检查通过。

### 2026-08-24：按 Figma `478:1454` 替换底部导航图标

- 使用用户提供的 `Frame 2224.svg`、`Frame 2179.svg`、`Frame 2179-1.svg`、`Frame 16.svg`，分别作为首页、通知、分析、我的图标，保存到 `miniprogram/assets/home-new/`。
- 移除原先 CSS 绘制的分析柱状图，底部导航统一按 Figma 使用 24px 图标；发布按钮继续使用 Figma 对应的 16px 白色加号，通知红点校准为 20×14px。
- 验证：底部导航资源引用和 12 项回归测试通过；当前环境未安装 `lessc`，未执行 Less 编译。Node 语法检查中，组件文件仍受原有 `WechatMiniprogram.TouchEvent` 方法参数类型影响，无法直接用 Node 检查。

### 2026-08-24：按用户提供的 `Frame 3.svg` 替换发布按钮

- 发布按钮改为直接使用 `miniprogram/assets/home-new/tab-publish.svg`，该 SVG 包含完整的 69×32px 灰色胶囊和白色加号。
- 删除 CSS 绘制的加号线条，按原始 SVG 尺寸渲染，避免旋转线条和缩放造成边缘发虚。
- 验证：底部导航资源引用和回归测试通过。

### 2026-08-24：按 Figma `478:1612` 校准低意向状态底色

- 低意向状态提示从棕灰色调整为 Figma 指定的 `#F0F0F0` 背景与 `#8A8E94` 文字。
- 顶部 `#低意向` 意向标签继续保留独立的状态色，不与底部阅读状态提示混用。
- 验证：新增低意向样式断言，回归测试通过。

### 2026-08-24：按 Figma `478:1568` 校准意向用户卡

- 标题调整为 16px medium，意向总数使用 Figma 的 `#00A5B4` 强调色；五个头像改为 Figma 节点导出的本地资源，按 24px 尺寸和 -12px 间距叠放。
- 统计区按 Figma 使用 20px 上间距、12px 标签和 14px 数值，移除当前实现额外添加的分隔线。
- 验证：新增意向用户卡断言，回归测试通过；静态资源仍低于预览包预算。

### 2026-08-24：按 Figma `507:2485` 校准底部渐变背景

- 底部导航背景改为 88px 高的 `rgba(255,255,255,0) → #FFFFFF` 纵向渐变，背景模糊调整为 7.7px。
- 导航胶囊保持 `rgba(255,255,255,0.4)`，胶囊自身背景模糊调整为 5px，匹配 Figma 的两层透明效果。
- 验证：补充渐变透明度与模糊值断言，回归测试通过。

### 2026-08-24：接入 Figma 导出的底部背景 SVG

- 将用户提供的 `393×88` Figma 背景 SVG 保存为 `miniprogram/assets/home-new/bottom-nav-scrim.svg`，由底部导航组件直接渲染。
- SVG 保留透明白到白色的渐变和 Figma `foreignObject` 背景模糊；组件层同时保留 7.7px `backdrop-filter` 作为小程序渲染兼容保障。
- 验证：底部背景资源引用和回归测试通过。

### 2026-08-24：压缩首页预览包体

- 真机调试提示源码包为 2486KB，超过微信 2MB 限制；保留 Hero 图透明背景并缩至 420px 宽，两张今日内容图改为高质量 JPEG，历史 JPG 资源无改尺寸压缩。
- 删除未再引用的旧首页 PNG 副本，当前 `miniprogram/assets/` 约 1.6MB，页面资源路径已同步更新。
- 验证：资源引用检查、包体预算检查和回归测试通过。

### 2026-08-24：替换首页 Hero 原图

- 使用用户提供的透明 PNG 替换 Hero 图，图片比例改为与 337×207px Hero 容器一致，不再沿用旧竖图的负偏移裁切。
- 在保留透明背景与视觉清晰度的前提下，将图片压缩至 540px 宽，确保真机调试源码包仍低于 2MB。
- 验证：Hero 尺寸、资源引用、包体预算和回归测试通过。

### 2026-08-24：调整首页问候标题排版

- 首页问候主标题和副标题统一调整为 22px、34px 行高、Medium（500）。
- 验证：新增标题排版断言，回归测试通过。

### 2026-08-24：按 Figma `478:1234` 实现新版首页

- 首页改为顶部问候与主视觉、实时通知、今日最多、意向用户、今日数据五个区域，接入现有分析接口组合服务。
- 底部导航改为新版悬浮胶囊：首页、通知、发布、分析、我的；发布按钮进入现有素材发布页。
- 下载并保存新版首页 Figma 图片与图标到 `miniprogram/assets/home-new/`，并将大图压缩到适合小程序预览包的尺寸。
- 验证：新版首页回归测试 12 tests passed；资源包预算检查通过；当前环境未安装 TypeScript 编译器与 `lessc`，未能执行对应编译检查。

### 2026-08-24：删除旧首页 v2 worktree，重新开始首页改版

- 用户确认删除 `/Users/xiaogai/Coding/Mini Sales-homepage-v2` 独立 worktree。
- 已移除该 worktree 及其中未提交的首页 v2 改动；根目录 `/Users/xiaogai/Coding/Mini Sales` 未被回退或覆盖。
- 首页后续以新确认的设计与需求为唯一实现基线，不继续旧版首页的视觉验收。

### 2026-08-21：底部导航适配安卓最小安全间距

- 底部导航容器使用 `max(20px, env(safe-area-inset-bottom))`，普通安卓设备至少保留 20px，全面屏或手势导航设备自动采用更大的系统安全区。
- 安全间距只作用于底部导航整体容器，保持按钮尺寸、排列、点击行为和底部背景不变。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（83 tests passed）；首页 TypeScript、相关 JSON 解析和底部导航 WXML 解析通过；当前环境未安装 `lessc`，无法执行 Less 编译。

### 2026-08-21：首页阅读/转发卡片顺序与空状态文案调整

- 首页两张统计卡调整为“今日转发”在前、“今日阅读”在后，继续保留作品分析跳转。
- 转发空状态改为“今日暂无转发 / 内容被转发后，这里会展示数据”；阅读空状态改为“今日暂无阅读 / 去分享素材给好友吧”。
- 三张统计卡统一改为内容自适应宽度，左右各保留 12px 内边距；空状态辅助文案保持单行，允许内容超出卡片宽度完整显示，不换行、不省略。
- 验证：相关首页回归测试 8 tests passed；全量测试 `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（83 tests passed）。

### 2026-08-21：素材首页空状态

- 当素材首页当前筛选没有任何素材时，隐藏素材网格，显示复用的云朵图标和文案“还没有素材，发布一个吧”；底部“发布素材”入口保持可用。
- 加载素材与切换筛选均同步计算 `hasVisibleMaterials`，避免筛选结果为空时留下空白网格。
- 验证：新增素材空状态回归用例；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（81 tests passed）；素材首页 TypeScript 语法检查通过。

### 2026-08-21：发表成功跳转素材首页并展示弹窗

- 发表接口成功后，发布页使用 `wx.redirectTo` 跳转 `/pages/materials/index?publishSuccess=1`；素材首页读取参数后立即展示发布成功弹窗。
- 发布成功弹窗提取为 `components/publish-success-modal`，由素材首页承载；后续页面复用时不再复制弹窗结构、分享按钮与动效样式。
- 验证：新增发表跳转、首页弹窗和组件复用的回归用例；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（80 tests passed）。

### 2026-08-21：发布成功弹窗遮罩与淡入动效

- 发布成功弹窗遮罩改为 `#000` 80% 不透明度，并在出现时由 0% 过渡至 80%。
- 弹窗卡片与遮罩同步使用 300ms `ease-out` 淡入，卡片透明度由 0% 变为 100%。
- 验证：新增发布成功弹窗遮罩与动效回归用例；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（79 tests passed）。

### 2026-08-21：保存草稿后返回素材首页

- 发布页的草稿接口成功返回后，保留“已保存草稿”提示并使用 `wx.redirectTo` 自动进入 `/pages/materials/index`；草稿保存失败时继续停留在当前页。
- 验证：新增草稿成功跳转回归用例；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（78 tests passed）。当前终端未安装 `npx`，无法执行 `tsc`，已改用 TypeScript 语法检查。

### 2026-08-20：保留微信登录原始失败原因

- `services/request.ts` 的 `wx.login` 失败回调现在记录微信返回的 `errMsg`，并将原始原因带入 `ApiError`，避免只显示笼统的“微信登录失败”。
- 已验证 `192.168.31.225:8080` 从前端电脑可达；当前截图中的失败发生在 `wx.login` 阶段，需确认开发者工具 AppID 与后端微信配置一致，并使用有权限的开发者账号。
- 验证：完整测试套件 77 tests passed；当前环境未安装 `tsc`，未执行 TypeScript 编译检查。

### 2026-08-20：开发环境后端请求切换为局域网地址

- 前端运行在本机、后端运行在同事电脑时，开发者工具和真机预览统一通过 `http://192.168.31.225:8080/api` 请求后端。
- `miniprogram/services/request.ts` 不再让开发者工具使用本机 `localhost`，继续复用 `miniprogram/config/dev.ts` 的 `DEV_LAN_ORIGIN`。
- 验证：请求层定向测试通过，完整测试套件 77 tests passed。

### 2026-08-20：接入 aisales 后端真实接口，删除全部 mock 数据

- 后端：`D:\IdeaProjects\aisales`（Spring Boot，`http://localhost:8080/api`）。统一响应 `Result{code,message,data}`，成功码 200；登录为 `POST /wechat/login?code=`（wx.login code 换 `userId`），后续请求携带 `X-User-Id` / `X-Openid` 请求头（后端演示级认证，无 JWT）。
- 新增 `services/request.ts` 统一请求层：基址集中配置、15s 超时、登录态复用与失败重试、`Result` 解包、加载中提示（引用计数）、错误归一化为稳定用户文案（网络异常 / 请求失败），并提供 `uploadFile` 与固定并发任务队列。真机预览需将 `API_BASE_URL` 改为电脑局域网 IP，开发者工具需勾选「不校验合法域名」。
- 新增 `types/api.ts`（后端 VO/Entity 响应类型，Long ID 为字符串）和 `utils/format.ts`（千分位、后端日期时间解析与展示格式、custom 时间范围参数）。
- 各 service 映射（页面与 ViewModel 均未改动）：
  - 首页：`/analysis/dashboard` + `/analysis/customer/list` + `/analysis/content/list`（today）组合；互动消息与角标来自 `/analysis/notify/list` 未读浏览/转发。
  - 分析页：dashboard / content list / customer list / intent list 并行；「观看作品数」由各内容详情受众列表聚合（后端列表无该字段）；阅读趋势图由按日 dashboard 聚合（后端无趋势接口，30 天数据带 60s 缓存）；周期筛选「日/周/月」映射 today/week/month，「总」受后端 custom 上限限制取最近 62 天（标记待确认）；点击周期后按所选范围重新加载。
  - 分析详情 / 用户详情：`/analysis/content/detail`、`/analysis/customer/history` + `/material/mine` 补封面；用户详情按作品合并浏览记录（进度取最大，时长/完播数/浏览次数/转发取合计），历史项含 `actionType`。
  - 通知页与首页互动消息：`/analysis/notify/list` 每一次浏览或转发一条，排除发布者本人；通知页按日期分组，首页预览最近 3 条未读。意向标签取该客户峰值。
  - 素材：`/material/mine` 列表（`publishStatus=0` 为草稿，TABLE 类型暂归入 PDF 筛选）、`/material/{id}` 详情/草稿（多图 `fileUrl` 为 JSON 数组）；发表 = 上传文件 `/material/upload-file` → `POST /material`（`IMAGE` 多图 JSON / `VIDEO` / `PDF`）→ `POST /material/{id}/share`；存草稿同前两步；编辑草稿仅改文案时走 `PUT /material/{id}`，改文件时新建素材；已发布作品二次编辑预填原文件与文案后 `POST /material` 新建，不覆盖原作品（后端无更新文件与删除素材接口，旧草稿会保留）。
  - 排行榜：后端无对应接口，service 返回空榜单并保留 `TODO(API)` 占位，页面展示既有空状态。
- `app.ts` 启动时执行真实登录；首页底部导航角标初始值由写死的 2 改为 0，由接口数据驱动。删除 `miniprogram/mocks/` 全部文件与目录。
- 已知数据口径限制（映射自后端现有字段，如需精确值待后端扩展）：客户级转发数仅有 0/1 标记；首页「新增用户」实际为今日观看客户数（去重）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（75 tests passed，已同步移除 mock 相关断言并新增请求层回归）；`npx tsc --noEmit` 中本次新增/修改文件无错误（仅存留 3 处原有页面的 `PageScrollOption` 类型名与 typings 自带库的历史告警）；后端连通性实测 `GET /api/analysis/dashboard` 返回 `code:200`。UI 文件（WXML/Less/JSON）零改动。

### 2026-08-20：分析作品排序筛选底部弹层

- 读取 Figma 节点 `357:19494`，作品分析右侧排序控件默认文案改为“浏览量”。
- 点击排序控件显示半透明黑色遮罩和底部白色圆角弹层，提供“完播数 / 转发数 / 浏览量”三个可选项；点击选项更新按钮文案并关闭，点击遮罩关闭。
- 弹层和遮罩同时执行 300ms 入场动画：白色弹层从底部上移，遮罩透明度从 0 过渡到 80%。
- 当前仅实现前端筛选状态与 Figma 交互展示，未改变统计数据来源和后端接口口径。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（75 tests passed）。

### 2026-08-20：区分素材类型图标并支持草稿编辑

- 素材列表仅对 `kind: video` 显示用户提供的 `Group 49.svg` 播放图标，图片和 PDF 不显示播放图标；图标保持距图片右上各 10px（`20rpx`）。
- 带“草稿”标签的素材卡片改为跳转 `/pages/materials/publish/index?id=...`，发布页通过 `getMaterialDraft` 恢复 mock 图片与文案进入编辑态；普通素材继续进入详情页。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（73 tests passed）。

### 2026-08-20：素材发布页默认图片与删除操作

- 发布页图片列表默认为空，只显示“添加图片”入口；不再显示预设示例图片，原未使用的 `assets/materials/publish-preview.jpg` 已移除。
- 已添加的每张图片右上角叠加删除按钮，使用用户提供的 `Frame 59.svg` 并本地保存为 `assets/materials/publish-delete.svg`；点击后仅移除对应图片，并同步恢复可添加状态。
- 验证：发布页图片相关定向回归 2 tests passed；`index.ts` TypeScript 语法检查通过。

### 2026-08-20：统一素材图片按宽度适配的展示逻辑

- 素材列表和素材详情的图片从 `aspectFill` 改为 `aspectFit`，避免裁切；展示盒背景统一为 `#DEE2E7`，宽图在盒内上下留白。
- 验证：素材/详情相关定向回归 5 tests passed，图片模式与背景检查通过。

### 2026-08-20：按 Figma 节点 `229:13968` 增加发表成功弹窗

- 在素材发布页增加默认隐藏的成功弹窗状态，按 Figma 还原“发布成功 🎉”、分享提示、分享给好友和分享到朋友圈两个操作。
- 弹窗通过 TypeScript 的 `showPublishSuccessModal` 控制，支持点击遮罩关闭；分享按钮当前只保留待接入提示，不伪造微信分享或后端成功结果。
- 复用现有素材详情页的 Figma 分享图标资源，不新增重复图片；弹窗卡片使用 `max-width` 适配较窄手机宽度。
- `onPublishSuccess()` 作为真实发表接口成功回调的接入点；当前 `onPublishTap` 仍保持待后端接入提示。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（69 tests passed）；覆盖弹窗默认状态、文案、按钮事件和本地资源引用。

### 2026-08-20：用户分析查看后清除红点

- 点击“用户分析”列表中的用户时，先将当前用户的 `showMarker` 更新为 `false`，再跳转用户详情页。
- 返回列表后已查看用户的红点消失，其他用户的红点和用户分析筛选交互保持不变。
- 验证：`node --test --test-name-pattern='analysis user tap clears' tests/home-page.test.mjs`（1 test passed）。

### 2026-08-20：移除素材详情底部分享栏分隔线

- 按用户截图移除 `/pages/material-detail` 底部分享栏的 `border-top`，保留按钮边框、间距、底部安全区和按下反馈不变。
- 验证：详情相关定向回归 4 tests passed。

### 2026-08-20：按 Figma 节点 `229:14271` 实现素材详情分享页

- 新增 `/pages/material-detail`，详情页通过 `getMaterialDetail(materialId)` 读取 typed mock，素材卡片点击后按稳定 `id` 跳转。
- 按 Figma 还原“作品”导航、全宽图片轮播、页码指示器、说明文案和底部“分享给好友 / 分享到朋友圈”按钮；当前分享按钮仅提供视觉与按下反馈，不伪造真实分享结果。
- Figma 资源导出并本地保存为 `assets/materials/detail-image-01.jpg`、`detail-share.svg`、`detail-moments.png`；主图压缩为本地 JPG 以保持预览包预算。
- 验证：详情相关定向回归 3 tests passed；JSON 与去除微信 `wx:` 命名空间后的 WXML 结构检查通过；资源包预算检查通过。完整测试套件当前还有 1 个与本页无关的首页摘要卡跳转断言失败。当前环境没有可用的 `tsc` 命令，未能执行 TypeScript 编译检查；微信开发者工具真机/GUI 视觉核对仍需人工完成。

### 2026-08-20：按 Figma 节点 `208:13581` 实现素材发布页面

- 新增 `/pages/materials/publish/index`，复用原生导航栏，实现图片预览、添加图片、文案输入及底部“存草稿 / 发表”操作区。
- 图片选择通过前端 TypeScript 限制总数最多 9 张；文案使用 `maxlength="-1"`，不设置字符上限；页面不直接请求接口或导入 Mock。
- 首张预览图使用 Figma 导出的本地素材，并转换为同尺寸 JPEG 以满足当前预览包静态资源预算；草稿和发表保留 `TODO(API)` 接入占位，不伪造服务端成功结果。
- 首页素材页“发布素材”按钮跳转至该页面。
- 回归检查时恢复首页三张统计卡的原有分析跳转绑定：新增用户进入用户分析，阅读数和转发数进入作品分析；卡片空状态展示模型不变。
- 分析页继续通过 `?tab=user|work` 接收首页卡片的目标视图并初始化选中态。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（66 tests passed）；页面 JSON 解析通过；相关 WXML 可由 XML 解析器读取。当前环境未安装 `tsc` / `lessc`，TypeScript 与 Less 编译仍需在微信开发者工具中确认。

### 2026-08-20：首页数据卡片空状态

- 新增首页展示模型转换函数 `buildHomeSummaryViewModel`，按新增用户、阅读数和转发数分别生成正常态或友好空状态文案；统计值为 0 或不可用时不显示“0个/0次”。
- 空状态保留原三张卡片的位置、尺寸、背景、圆角、阴影和点击行为；辅助文案增加换行规则，首页页面继续通过现有 `services/home.ts` 获取数据。
- 验证：`node --test tests/home-page.test.mjs`（60 tests passed），覆盖单项为 0、全部为 0、部分有数据和空状态文案换行。

### 2026-08-20：首页替换排行榜按钮图标

- 使用用户提供的 `Group 55.svg` 替换首页底部导航“排名”图标，继续由 `miniprogram/assets/home/tab-ranking.svg` 统一引用。
- 保持“排名”文案、跳转逻辑、按钮尺寸和其他底部导航图标不变。
- 验证：`node --test tests/home-page.test.mjs`（55 tests passed）。

### 2026-08-20：首页问候语改为按设备本地时间动态计算

- 首页问候语由前端 `getHomeGreeting` 根据设备本地小时生成，覆盖早上、中午、下午和晚上四个时段，不新增接口或后端字段。
- 首页首次显示时初始化问候语，并在 `onShow` 从后台返回时重新计算；首页视觉样式和其他摘要数据保持不变。
- 验证：`node --test tests/home-page.test.mjs`（54 tests passed）。

### 2026-08-20：统一分段筛选器上下留白

- 新增全局 Less 变量 `@segmented-filter-vertical-inset: 4rpx`，对应 750rpx 设计稿中的 2px 视觉留白。
- 排行榜、分析页周期筛选/用户意向筛选、分析详情意向筛选和用户详情阅读记录筛选的白色选中块均同时锚定顶部与底部，消除固定 `56rpx` 高度导致的上下间距偏差。
- 分析页的排序筛选改为由同一内边距决定高度，确保选中白底上下各保留 2px。
- 验证：`node --test tests/home-page.test.mjs`（52 tests passed），新增全局筛选器 2px 上下留白回归用例。

### 2026-08-20：按 Figma 节点 `173:12468` 实现素材页

- 新增 `/pages/materials/index`，实现素材标题导航、全部/图片/视频/PDF 筛选、双列素材卡片和底部“发布素材”按钮。
- 复用排行榜顶部层级与 `calculateRankingHeaderOpacity`：导航初始 `rgba(232, 237, 245, 0)`，滚动 25px 后变为完全不透明；背景竖线使用现有 `assets/analysis/group-40.svg`。
- 新增 `types/materials.ts`、`mocks/materials.ts`、`services/materials.ts`，页面不直接依赖 mock；首页“素材” tab 跳转至素材页。
- Figma 导出的素材图片与播放/加号图标保存到 `miniprogram/assets/materials/`，仅保留页面实际使用的压缩本地资源。
- 用户确认按钮文案为“发布素材”；按钮加号替换为用户提供的 `Group 47.svg`（14×12px 白色加号），并原位保存为 `assets/materials/material-plus.svg`。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（60 tests passed）；当前环境未安装 `tsc`/`lessc`，微信开发者工具或等价编译检查需在本地工具中执行。

### 2026-08-20：通知卡片跳转用户详情

- 通知卡片通过 `userId` 跳转到既有 `/pages/analysis-user-detail/index?id=...`。
- 联系用户视觉控件使用 `catchtap` 阻止冒泡，避免点击按钮同时触发卡片跳转。
- 复用既有用户详情 service/mock，不新增页面。

### 2026-08-20：通知筛选无结果空状态

- 当意向筛选没有匹配通知时，保留筛选栏并显示统一的 `assets/analysis/empty-state-cloud.png` 云朵图标和文案“暂无意向用户”。
- 使用 `hasVisibleGroups` 控制列表与空状态切换；“全部”及有匹配结果的筛选仍显示通知卡片。
- 新增空状态回归测试，图标复用现有资源，不新增图片文件。

### 2026-08-20：按 Figma 节点 `107:6744` 修正“联系用户”

- 重新读取按钮节点，按节点数据恢复为窄灰按钮：64×24px、`#9D9D9D` 背景、白色 12px 常规字重、左右 8px 内边距、6px 圆角。
- 联系按钮不再填充右侧剩余空间，建议文案恢复自然宽度。
- 为避免微信开发者工具继续复用旧 WXSS 选择器，将原生 `button` 改为 `view`，使用新的 `notification-card__contact-action-v2` class 和内联 Figma 尺寸/颜色。

### 2026-08-20：修正通知卡片与 Figma 节点的结构差异

- 徽标改为头像容器内的右下角定位：`right: 0; bottom: 0`，尺寸 17px。
- 删除通知卡片右侧三张缩略图叠放结构，ViewModel 收敛为单个 `thumbnailUrl`，右侧仅渲染一张 50×68px 图片。
- 保持 Figma 节点定义的联系按钮：64×24px、`#9D9D9D` 背景、白色 12px 文字。
- 新增结构回归测试，覆盖单图渲染和徽标右下对齐。

### 2026-08-20：按 Figma `107:6723` 校准通知卡片规格

- 重新读取目标节点并按 Figma 规格校准通知卡片：卡片内边距 12px、内容间距 16px、头像 40px、主缩略图 50×68px、名称 16px、行为文案 12px、日期 10px、底部文案 12px。
- 意向标签水平内边距调整为 10px；“联系用户”恢复为 Figma 节点定义的 64px 宽、24px 高、`#9D9D9D` 背景和白色 12px 文字。
- 更新对应回归测试，截图中的其他页面状态不作为该节点的组件规格。

### 2026-08-20：按 Figma `349:18597` 校准通知筛选与切换

- 顶部“全部 / 高意向 / 中意向 / 低意向”筛选项按 Figma 改为四项等宽、`20rpx` 间距、`64rpx` 高度和 `32rpx` 水平内边距。
- 点击筛选项保留 Figma 选中态，并同步更新可见通知分组；无匹配数据的日期分组不再显示。
- 新增筛选尺寸与可见分组回归测试；未新增页面路由，当前 Figma 节点对应的是通知页内筛选组件。

### 2026-08-20：通知页复用排行榜顶部背景与滚动透明度

- 将通知页从内部 `scroll-view` 改为页面级滚动，顶部导航使用 `position: sticky` 固定在最上层。
- 按排行榜的层级关系设置：顶部导航 `z-index: 1002`、通知内容 `z-index: 1001`、背景竖线 `z-index: 1000`、`#E8EDF5` 底色 `z-index: 999`。
- 通知页初始导航背景为 `rgba(232, 237, 245, 0)`，沿用排行榜前 25px 滚动距离渐变到 100% 不透明；滚动透明度由 `calculateRankingHeaderOpacity` 统一计算。
- 新增页面层级、滚动容器和 0–25px 透明度回归测试。

### 2026-08-20：按截图校准通知卡片联系按钮

- 以用户提供的 Figma 截图为当前视觉基线，调整通知卡片底部布局：建议文案限制在左侧约 40% 宽度，联系按钮自适应填充右侧剩余空间。
- “联系用户”按钮改为浅灰背景 `#F1F1F1`、绿色文字 `#00B866`，保留 24px 高度和 6px 圆角。
- 新增截图样式回归测试，防止按钮恢复为固定窄灰色按钮。

### 2026-08-20：修复通知页真机内容为空

- 问题：开发者工具中通知页能显示，真机点击首页“通知”后页面为空。
- 根因：通知页外层只有 `min-height: 100vh`，内部 `scroll-view` 使用 `flex: 1; height: 0`；真机 Skyline 布局下滚动容器可能没有获得可见高度，数据虽加载但内容不可见。
- 处理：通知页 `page` 和根容器改为确定的 `height: 100vh`，滚动容器增加 `min-height: 0`，沿用项目日志页的 flex 滚动布局模式。
- 验证：`node --test tests/home-page.test.mjs`（41 tests passed）；通知页确定视口高度回归测试通过。实体手机需重新编译后复测首页点击通知路径。

### 2026-08-20：替换排行榜高清标题与奖杯资源

- 使用用户提供的 `超级榜单统一字体 1.png` 和 `image 9.png` 原位替换 `assets/ranking/ranking-title.png` 与 `assets/ranking/ranking-trophy.png`。
- 标题资源由 `192×50` 替换为 `576×150`，奖杯资源由 `98×117` 替换为 `294×351`；页面保持原有展示尺寸，获得 3 倍像素密度。
- 验证：资源 SHA-256 与用户提供文件一致；`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern='ranking' tests/home-page.test.mjs`（8 tests passed）。

### 2026-08-20：内容分析意向用户空状态

- 在“内容分析”详情页的“意向用户”区域增加空数据状态：当前筛选结果为空时显示本地云朵图标和文案“没有意向用户”。
- 空状态复用 `miniprogram/assets/analysis/empty-state-cloud.png`；有用户时继续显示原有列表，点击和左右滑动筛选交互不变。
- 使用 `hasVisibleIntentUsers` 根据当前筛选后的用户列表控制 WXML 展示分支。
- 验证：`node --test tests/home-page.test.mjs`（56 tests passed）。

### 2026-08-20：分析页作品与用户空状态

- 读取 Figma 节点 `343:17569`，为“分析-作品分析”无作品场景新增空状态，使用本地 Figma 云朵图标和文案“还没有作品，你可以发布一个”。
- “分析-用户分析”复用同一图标；默认列表为空或意向筛选后无匹配用户时，显示文案“还没用户，快去发布作品吧”。
- 新增 `miniprogram/assets/analysis/empty-state-cloud.png`，页面通过 `hasAnalysisCards` 和 `hasAnalysisUsers` 控制列表与空状态切换，不改变已有筛选和导航交互。
- 验证：`node --test tests/home-page.test.mjs`（35 tests passed）。

### 2026-08-20：首页排名图标替换

- 使用用户提供的 `Group 35-1.svg` 替换首页底部导航“排名”图标，仍由 `miniprogram/pages/index/index.ts` 通过 `/assets/home/tab-ranking.svg` 引用。
- 页面逻辑、导航交互和其他底部导航图标未修改。

### 2026-08-20：排行榜页面 Figma 实现

- 读取 Figma 节点 `311:15611`，新增排行榜页面，包含超级榜单标题、奖杯、排行榜列表和“浏览量 / 转发量 / 完播量”三个排序标签。
- 首页底部导航“排名”跳转至 `/pages/ranking/index`；当前页面通过 `services/ranking.ts` 消费 typed mock 数据，点击标签后按对应指标降序排序。
- Figma 导出的榜单标题、奖杯和 8 个头像已保存到 `miniprogram/assets/ranking/`，不依赖临时资源 URL。

### 2026-08-20：固定排行榜顶部导航与背景

- 将排行榜顶部条纹背景和公共导航栏组合为 `.ranking-page__header`，使用 `position: sticky; top: 0; z-index: 1002` 固定在滚动视口顶部。
- 移除排行榜页面根节点的 `overflow: hidden`，避免祖先滚动容器限制 sticky 定位。
- 条纹背景改为独立的 `position: fixed` 层级，并补充随页面内容增长的 `#E8EDF5` 最底层：顶部导航 `z-index: 1002`、排行榜内容 `z-index: 1001`、背景竖线 `z-index: 1000`、底色 `z-index: 999`。半透明白色竖线叠在蓝灰底色上保持可见，内容渐变再从上层逐渐遮住竖线。
- 排行榜竖线背景改用用户提供的 `Group 40.svg`；该文件与已存在的 `assets/analysis/group-40.svg` SHA-256 一致，因此直接复用唯一的本地资源，未产生重复资源副本。
- 顶部导航透明度由页面前 25px 的滚动距离连续计算：0px 为 0%、12.5px 为 50%、25px 及以后为 100%，颜色保持 `#E8EDF5`。
- 按 Figma `343:18130` 将排行榜内容渐变直接绘制在内容容器上：起点为 `rgba(232, 237, 245, 0)`，过渡到 `#E8EDF5`，背景高度随内容容器自然增长；排行榜卡片使用白色到 `#F0F5FA` 的渐变，底部固定保留 80rpx（40px）留白。
- 按 Figma `343:17464` 增加排行榜空数据状态：当当前排序结果为空时保留排序标签，显示分析页复用的云朵图标与“暂无数据”；图标为 78rpx，图文间距 10rpx，标签与空状态间距 120rpx。
- 尝试用内部 `scroll-view` 关闭排行榜回弹后，真机出现与通知页相同的“开发者工具正常、页面空白”问题；已撤回该实验并恢复页面级滚动，保证 Skyline 真机可见。无回弹方案待找到不引入内部滚动容器的可靠实现后再评估。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern='ranking' tests/home-page.test.mjs`（7 tests passed）；覆盖排行榜层级、0–15px 滚动透明度、内容同高渐变和卡片底部留白。

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

### 2026-08-31：替换分析总数据图标

- 根据用户提供的截图和 SVG，将分析页“数据总览”图标替换为 `icon——date.svg`，将“阅读峰值”图标替换为 `icon_peak.svg`。
- 保留现有 WXML 路径、布局和筛选交互，仅更新 `assets/analysis/data-overview-icon.svg` 与 `assets/analysis/peak-data-icon.svg` 的本地资源内容。
- 验证：两个资源分别与用户提供文件 `cmp` 一致；`git diff --check` 通过；现有测试中仅保留与先前排行榜描边变更相关的 2 个旧断言失败。

### 2026-08-31：作品分析列表跳转内容详情

- 作品分析列表卡片继续使用现有 `/pages/analysis-detail/index?id=...` 路由；详情页现在读取传入的作品 ID，并在 service 层按该 ID 限定作品卡片和意向用户数据。
- 周期切换、日期范围确认和下拉刷新均保留该作品 ID，避免进入详情后重新加载为全量作品。
- 验证：作品分析与内容详情相关测试 6/6 通过；页面与 service TypeScript 语法检查通过；`git diff --check` 通过。

### 2026-08-31：素材页固定顶部渐变层

- 素材页的导航、筛选、竖条和 `#F5F5F5` 固定层总高度为 131px：顶部 0–100px 保持 100% 不透明，随后在最后 31px 过渡至 0% 不透明。素材卡片列表改为全屏滚动层，并通过列表内部顶部留白保持首屏间距。
- 这样内容上滚时会进入渐变下方；不再使用旧版“滚动后白色顶部由透明变不透明”的动态背景逻辑。
- 验证：素材页固定层、全屏滚动与筛选位置的定向测试 4/4 通过；`git diff --check` 通过。

### 2026-09-01：全局页面底色调整

- 按用户确认，将小程序中原有页面底色 `#F5F5F5` 统一调整为 `#F0F1F2`，包括应用级页面背景、页面局部底色及导航栏背景。
- 通知、分析和素材页顶部固定渐变同步替换为 `#F0F1F2` 的实色与透明端，保留原有层级、131px 高度和 100px 起始渐变断点。
- 验证：`node --test tests/home-page.test.mjs tests/publish-material-entry.test.mjs`（161 tests passed）；生产代码未发现旧 `#F5F5F5` 或 `rgba(245,245,245,...)` 引用；`git diff --check` 通过。

### 2026-09-01：修正分析总数据重复分隔线

- 按用户确认，仅调整“分析 → 总数据”指标区域：移除指标左侧的绝对定位线、第二项指标的 `border-left` 以及重复分隔 SVG，保留两列指标的间距与内容布局。
- 首页“今日数据”指标卡的外框保持 `2rpx` 描边与圆角，未再误改首页样式。
- 验证：分析总数据与首页相关测试通过；联合测试 167 项中 166 项通过。唯一失败是用户此前将 `config/dev.ts` 的 `DEV_LAN_ORIGIN` 改为 `https://www.yjxzhang.com`，旧测试仍断言局域网地址；该用户改动未覆盖。
- `git diff --check` 通过，已确认删除的 `total-metric-divider.svg` 无残留引用。

### 2026-09-01：替换个人中心与发布页竖线背景资源

- 使用用户提供的 `line_bg.svg` 替换个人中心和发布（素材）页顶部竖线背景；两处改为原生 `<image>` 直接加载资源，继续复用原有定位、尺寸、层级和透明度。
- 未调整页面布局、文案、交互或其他页面样式。
- 验证：资源与用户提供文件一致；相关测试通过，联合测试唯一失败仍是 `config/dev.ts` 中用户自定义开发接口地址与旧断言不一致；`git diff --check` 通过。

### 2026-09-02：按 Figma 902:12850 更新个人中心页面

- 根据用户提供的 Figma 节点 `902:12850`，重排底部导航“我的”页面：个人信息、会员卡、会员功能预览和“尽情期待”区域。
- 会员卡继续复用本地 `assets/profile/` 渐变资源，会员卡点击仍进入会员开通页；页面底部继续复用悬浮导航组件。
- 移除新稿未展示的余额卡和设置入口，功能预览区域使用低清晰度与渐隐处理，保持“更多功能，即将呈现”的占位语义。
- 验证：页面 JSON 解析与 `git diff --check` 已通过；当前环境未安装 `npx`，无法运行 TypeScript 编译。旧版个人中心断言仍引用已被新稿移除的余额卡与设置入口，未作为本次实现验收依据。

### 2026-09-02：个人中心会员卡追踪区域对齐

- 按用户截图，将会员卡“剩余追踪人数”与进度条区域和上方升级文案统一使用同一内容内边距，避免后续样式修改产生水平偏移。
- 追踪区域已嵌入上方文案内容框，并由父容器统一控制 `top/bottom`，子区域使用 `left/right: 0`；父容器改为明确的 `left/right: 40rpx`，不依赖 CSS 自定义变量，从结构和数值两层保证水平对齐。
- 根据后续截图反馈，进度条竖线宽度调整为 `2rpx`，竖线间距调整为 `6rpx`，在保持 80 段总占用基本不变的同时增加空隙。

### 2026-09-02：修正个人中心与 Figma 会员卡视觉差异

- 将个人中心底色恢复为共享的 `#F0F1F2`，使顶部竖线背景在页面上可见。
- 会员卡改为深绿色底、右侧环形纹理、皇冠标记和渐变副文案，替换此前浅绿色旧资产的视觉表现；卡片尺寸、位置和点击入口保持不变，并清理不再使用的旧光斑与浅色填充资源。
- 验证：`primary page backgrounds` 与个人中心遮罩相关定向测试 2/2 通过；`git diff --check` 通过。

### 2026-09-02：补充顶部渐变并置于竖线背景下方

> 此版本随后按用户确认撤回，当前发布/我的顶部使用旧的浅灰渐变与灰色竖线背景。

- 按用户提供的顶部渐变资源确认其与首页渐变一致，个人中心和发布（素材）页统一复用 `assets/home-new/home-header-background.svg`。
- 顶部渐变作为独立图片层放在竖线背景下方：渐变 `z-index: 0`，竖线 `z-index: 1`，页面内容继续位于两者之上；首页原有渐变资源保持单份复用。
- 个人中心和发布页均使用 `274rpx`（137px）渐变高度，与首页资源尺寸一致。
- 验证：顶部层级与资源路径定向测试通过；`git diff --check` 通过。

### 2026-09-02：移除个人中心昵称后的固定问候语

- 删除个人中心昵称模板中额外拼接的 `，起飞👋`，现在只展示 service 返回的 `profile.nickname`，避免昵称被误显示为多余文字。

### 2026-09-02：按 Figma 911:13411 替换会员开通卡

- 删除旧版会员卡的矩形底图、描边、皇冠、圆环、箭头和手工排版；不再把旧版资源与新设计混用。
- 会员入口按 Figma 父节点 `911:13452` 使用原始矢量导出：倾斜浅绿外形 `908:13406`、目标子节点 `911:13411` 的深绿遮罩、`Group 75` 圆环、箭头与 Figma 皇冠；不再截取为旧版的 353×68px 矩形或使用整图 PNG。
- 卡片的尺寸、位置和点击进入会员开通页的交互保持不变；不再在 service 中维护该卡片的展示文案，避免 Figma 固定设计与数据层重复渲染。

### 2026-09-02：按 Figma 917:13737 替换个人中心功能列表

- 会员卡下方功能列表按节点 `917:13737` 更新为“钱包中心 / 我的收藏 / 我的收藏”三行，使用用户提供的三个 Figma SVG 图标和节点导出的灰色箭头。
- 列表使用 20px 图标、13px 文案、30px 行间距；移除旧版渐隐遮罩、透明度和模糊图标样式。
- 白色渐隐遮罩从会员卡结束后 10px 开始覆盖至页面底部，并使用 8px 背景模糊；会员卡、“尽情期待”模块与底部导航的层级均高于遮罩，功能列表位于遮罩下。会员卡上方间距调整后，遮罩起点同步保持在卡片下方。

### 2026-09-02：新增已开通会员成功态卡片

- 个人中心当前固定展示 Figma `949:2541` 的“标准会员”成功态；未开通卡片保留在组件中，待真实会员状态接入后切换。
- 已开通状态使用 353×160px 深绿金色渐变卡、Figma 到期日 `2026.11.20`、固定的 Figma 追踪人数 `58/80` 与 80 段进度条视觉。
- 所有成功态展示数据集中在 `services/profile.ts` 并标记 `TODO(API)`；后续接入只替换该 service 的展示数据。

### 2026-09-02：首页会员追踪上限提示

- 首页固定展示 Figma `949:2077` 提示卡，作为“未开通会员或追踪人数达到上限”的视觉占位，当前不接入状态判断。
- 卡片使用 Figma 深绿背景和右侧圆环资源，复用已导出的皇冠素材；“立即升级”点击进入现有会员开通页。
- 文案按卡片左侧 14px 对齐并加粗；升级按钮直接使用 Figma `964:5205` 的原始 86×40px 导出，确保描边与金色渐变一致。
- 内容组在卡片内整体下移 5px；卡片、圆环和下方列表位置不变。
- 卡片已抽为公共展示组件，并固定展示于底部“通知”页的筛选栏下方；筛选栏到卡片、卡片到日期标题均为 20px，两个入口均可进入会员开通页。
- 首页和通知页共用文案更新为“最终已达上线，升级/开通会员触达更多客户”；其他内容与样式不变。
- 个人信息区域与会员卡之间的垂直间距调整为 20px（`40rpx`）。

### 2026-09-02：按 Figma 964:4900 补充尊享会员权益

- 会员开通页顶部“尊享会员”标签改为可点击切换，展示 Figma 节点 `964:4900` 确认的权益列表。
- 尊享会员权益沿用标准会员前五项，并将最后一项更新为“追踪人数无限”；标题使用 Figma 对应的粉紫渐变文字。
- `membershipTier` 与权益列表由页面状态驱动，权益数据集中在 `utils/membership.ts`；套餐价格与支付流程保持现有已确认实现，Figma 节点未提供新的尊享套餐价格数据。
- 验证：会员页定向测试 6/6 通过。

### 2026-09-02：按 Figma 964:4837 调整尊享会员背景

- 仅在 `membershipTier === 'premium'` 时切换会员页背景为 Figma `964:4837` 的黑色、棕色至紫色渐变：`#040404 → #774422 → #8473B2`。
- 标准会员背景、权益、套餐、支付流程和导航保持不变。
- 验证：会员页定向测试 7/7、TypeScript 语法、WXML 语法和 `git diff --check` 均通过。

## 待确认事项

- 设计稿基准设备尺寸和适配目标。
- 是否需要展示加载、空数据、错误等完整状态。
- 页面间哪些交互仅做视觉效果，哪些需要可点击跳转。
- 访问者身份识别、授权提示、匿名访问和数据留存的后端与合规方案。
- 高、中、低意向规则发生重叠时的后端优先级；设置页已展示单图 / 多图 / PDF / 视频的产品口径。
- 内容分析意向用户、用户详情是否也按会员访客上限裁剪（当前仅首页互动消息、通知、用户分析列表）。
- 小程序虚拟支付：后台填 OfferId / 现网 AppKey；创建道具 `month` / `quarter` / `half_year` / `month_pro` / `quarter_pro` / `half_year_pro` 并**发布到现网**；发货推送指向公网 `https://host/api/pay/xpay/notify`。
- 三个 Pro 档位的正式价格待确认（当前后端占位 0.03 / 0.04 / 0.05 元）。
- iOS 虚拟支付最低 1 元，当前测试价 ¥0.01 不能在 iPhone 上完成；需打开「苹果支付」、配置小程序简称。上线前改回 29.9 / 79.9 / 139.9。
- 排行榜后端接口（当前 aisales 未提供销售排行榜数据，页面暂用 Figma 预览 mock）。
- 分析页「总」时间范围口径：后端 custom 查询上限 62 天，暂按最近 62 天，需后端确认是否提供全量范围。
- 后端待补能力：按日阅读趋势接口（当前由前端按日聚合 dashboard）、素材图片更新与素材删除接口（编辑草稿改图会产生新素材）、客户级转发次数（当前仅 0/1 标记）、未读通知/红点口径。
- 生产环境接口基址与合法域名配置待确认；当前开发/体验版使用 `http://192.168.31.225:8080/api`。
