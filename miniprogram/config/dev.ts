/**
 * 本地开发环境配置（仅开发阶段使用，不上生产）。
 *
 * 真机调试、体验版预览时，手机无法访问 localhost，必须填写运行后端 aisales 的电脑局域网 IP。
 * 应与 aisales `application-dev.yml` 中 `minio.public-base-url` 的主机保持一致。
 *
 * 查看本机 IP：Windows 运行 ipconfig，找当前 Wi-Fi 的 IPv4 地址。
 */
// export const DEV_LAN_ORIGIN = 'http://192.168.13.102:8080'

export const DEV_LAN_ORIGIN = 'https://www.yjxzhang.com'

/**
 * 开发者工具同样访问当前电脑局域网地址；后端运行在本机或同事电脑时都不要回退到 localhost。
 */
export const DEVTOOLS_ORIGIN = 'http://127.0.0.1:8080'

/**
 * 离线 UI 调试开关：默认关闭，分析页面请求公司开发后端的真实数据。
 * 仅在无法连接后端时临时打开；该开关只属于开发配置，不代表真实业务状态。
 */
export const DEV_UI_PREVIEW = false
