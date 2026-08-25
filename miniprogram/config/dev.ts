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
 * 微信开发者工具与后端同机时走本机回环。
 * 模拟器走局域网 IP 时，VPN / 局域网调试代理可能返回 502 Bad Gateway。
 */
export const DEVTOOLS_ORIGIN = 'http://127.0.0.1:8080'

// export const DEV_LAN_ORIGIN = 'https://www.yjxzhang.com'
