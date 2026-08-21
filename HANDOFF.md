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
| 实现排行榜页面与排序交互 | done | Figma `311:15611` 排行榜页面、typed mock/service、本地资源与首页排名 tab 跳转已实现 |
| 实现素材页面与发布入口视觉 | done | Figma `173:12468` 素材双列卡片、筛选交互、本地资源、首页素材 tab 跳转与顶部滚动透明度已实现 |
| 实现素材发布页面 | done | Figma `208:13581` 发布页、最多 9 张图片、无限制文案输入、草稿/发表占位交互及成功弹窗已实现 |
| 实现素材详情分享页 | done | Figma `229:14271` 作品详情页、素材卡片按 id 跳转、轮播图片、描述文案、底部分享按钮与 typed service/mock 已实现 |
| 接入后端真实接口 | done | 统一 `services/request.ts` 请求层 + 微信登录；首页/分析/通知/素材全部改为后端数据，mock 已删除；排行榜因后端无接口保留空态占位 |
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

- 真机预览统一通过 `miniprogram/config/dev.ts` 的 `DEV_LAN_ORIGIN`（如 `http://192.168.31.225:8080/api`）请求后端；开发者工具模拟器仍使用 `localhost:8080`，避免图片代理 502。
- 验证：请求层定向测试通过，完整测试套件通过。

### 2026-08-20：分析作品排序筛选底部弹层

- 读取 Figma 节点 `357:19494`，作品分析右侧排序控件默认文案改为“浏览量”。
- 点击排序控件显示半透明黑色遮罩和底部白色圆角弹层，提供“完播数 / 转发数 / 浏览量”三个可选项；点击选项更新按钮文案并关闭，点击遮罩关闭。
- 弹层和遮罩同时执行 300ms 入场动画：白色弹层从底部上移，遮罩透明度从 0 过渡到 80%。
- 当前仅实现前端筛选状态与 Figma 交互展示，未改变统计数据来源和后端接口口径。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（75 tests passed）。

### 2026-08-20：接入 aisales 后端真实接口，删除全部 mock 数据

- 后端：`D:\IdeaProjects\aisales`（Spring Boot，`http://localhost:8080/api`）。统一响应 `Result{code,message,data}`，成功码 200；登录为 `POST /wechat/login?code=`（wx.login code 换 `userId`），后续请求携带 `X-User-Id` / `X-Openid` 请求头（后端演示级认证，无 JWT）。
- 新增 `services/request.ts` 统一请求层：基址集中配置、15s 超时、登录态复用与失败重试、`Result` 解包、加载中提示（引用计数）、错误归一化为稳定用户文案（网络异常 / 请求失败），并提供 `uploadFile` 与固定并发任务队列。真机预览需将 `API_BASE_URL` 改为电脑局域网 IP，开发者工具需勾选「不校验合法域名」。
- 新增 `types/api.ts`（后端 VO/Entity 响应类型，Long ID 为字符串）和 `utils/format.ts`（千分位、后端日期时间解析与展示格式、custom 时间范围参数）。
- 各 service 映射（页面与 ViewModel 均未改动）：
  - 首页：`/analysis/dashboard` + `/analysis/customer/list` + `/analysis/content/list`（today）组合；通知角标取今日意向客户数（后端无未读通知概念）。
  - 分析页：dashboard / content list / customer list / intent list 并行；「观看作品数」由各内容详情受众列表聚合（后端列表无该字段）；阅读趋势图由按日 dashboard 聚合（后端无趋势接口，30 天数据带 60s 缓存）；周期筛选「日/周/月」映射 today/week/month，「总」受后端 custom 上限限制取最近 62 天（标记待确认）；点击周期后按所选范围重新加载。
  - 分析详情 / 用户详情：`/analysis/content/detail`、`/analysis/customer/history` + `/material/mine` 补封面；观看历史无单条转发数，记录 `shareCount` 固定 0。
  - 通知页：`/analysis/intent/list` 按日期分组映射为通知卡片（每客户一条，转发/阅读按 `hasForwarded` 区分）。
  - 素材：`/material/mine` 列表（`publishStatus=0` 为草稿，TABLE 类型暂归入 PDF 筛选）、`/material/{id}` 详情/草稿（多图 `fileUrl` 为 JSON 数组）；发表 = 上传图片 `/material/upload-file` → `POST /material` → `POST /material/{id}/share`；存草稿同前两步；编辑草稿仅改文案时走 `PUT /material/{id}`，改图片时新建素材（后端无更新图片与删除素材接口，旧草稿会保留）。
  - 排行榜：后端无对应接口，service 返回空榜单并保留 `TODO(API)` 占位，页面展示既有空状态。
- `app.ts` 启动时执行真实登录；首页底部导航角标初始值由写死的 2 改为 0，由接口数据驱动。删除 `miniprogram/mocks/` 全部文件与目录。
- 已知数据口径限制（映射自后端现有字段，如需精确值待后端扩展）：客户级转发数仅有 0/1 标记；首页「新增用户」实际为今日观看客户数（去重）。
- 验证：`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/home-page.test.mjs`（75 tests passed，已同步移除 mock 相关断言并新增请求层回归）；`npx tsc --noEmit` 中本次新增/修改文件无错误（仅存留 3 处原有页面的 `PageScrollOption` 类型名与 typings 自带库的历史告警）；后端连通性实测 `GET /api/analysis/dashboard` 返回 `code:200`。UI 文件（WXML/Less/JSON）零改动。

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

## 待确认事项

- 设计稿基准设备尺寸和适配目标。
- 是否需要展示加载、空数据、错误等完整状态。
- 页面间哪些交互仅做视觉效果，哪些需要可点击跳转。
- 访问者身份识别、授权提示、匿名访问和数据留存的后端与合规方案。
- 高、中、低意向规则发生重叠时的优先级和最终统计口径。
- 排行榜后端接口（当前 aisales 未提供销售排行榜数据，页面暂为空态）。
- 分析页「总」时间范围口径：后端 custom 查询上限 62 天，暂按最近 62 天，需后端确认是否提供全量范围。
- 后端待补能力：按日阅读趋势接口（当前由前端按日聚合 dashboard）、素材图片更新与素材删除接口（编辑草稿改图会产生新素材）、客户级转发次数（当前仅 0/1 标记）、未读通知/红点口径。
- 生产环境接口基址与合法域名配置待确认；当前开发环境使用 `http://192.168.31.225:8080/api`。
