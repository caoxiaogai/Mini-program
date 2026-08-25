/**
 * 本地开发环境配置（仅开发阶段使用，不上生产）。
 *
 * 真机调试时，手机无法访问 localhost，必须填写运行后端 aisales 的电脑局域网 IP。
 * 应与 aisales `application-dev.yml` 中 `minio.public-base-url` 的主机保持一致。
 *
 * 查看本机 IP：Windows 运行 ipconfig，找当前 Wi-Fi 的 IPv4 地址。
 */
export const DEV_LAN_ORIGIN = 'http://192.168.31.225:8080'

/**
 * 新版首页当前使用固定假数据进行视觉验收。
 * 确认真实接口有可展示数据后改为 api；页面和组件无需调整。
 */
export const HOME_DATA_SOURCE: 'mock' | 'api' = 'mock'

/**
 * 分析页当前使用固定假数据进行 Figma 视觉验收。
 * 确认真实接口有可展示数据后改为 api；页面和组件无需调整。
 */
export const ANALYSIS_DATA_SOURCE: 'mock' | 'api' = 'mock'

/**
 * 通知页当前使用固定假数据进行 Figma 视觉验收。
 * 确认真实接口有可展示数据后改为 api；页面和组件无需调整。
 */
export const NOTIFICATION_DATA_SOURCE: 'mock' | 'api' = 'mock'
