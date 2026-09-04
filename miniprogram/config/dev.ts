/**
 * 本地开发环境配置（仅开发阶段使用，不上生产）。
 *
 * 真机调试默认走局域网。若改成和 PROD_API_ORIGIN 同一主机，请求会打到线上 /dev/api（体验版后端）。
 *
 * 查看本机 IP：Windows 运行 ipconfig，找当前 Wi-Fi 的 IPv4 地址。
 */
// export const DEV_LAN_ORIGIN = 'http://192.168.13.100:8081'

export const DEV_LAN_ORIGIN = 'https://www.yjxzhang.com'

/**
 * 开发者工具同样访问当前电脑局域网地址；后端运行在本机或同事电脑时都不要回退到 localhost。
 */
export const DEVTOOLS_ORIGIN = 'http://127.0.0.1:8081'

/**
 * 线上 HTTPS 主机。正式版请求 /api，体验版请求 /dev/api。
 * 须已加入微信小程序 request 合法域名。
 */
export const PROD_API_ORIGIN = 'https://www.yjxzhang.com'

/**
 * 离线 UI 调试开关：默认关闭，分析页面请求公司开发后端的真实数据。
 * 仅在无法连接后端时临时打开；该开关只属于开发配置，不代表真实业务状态。
 */
export const DEV_UI_PREVIEW = false
