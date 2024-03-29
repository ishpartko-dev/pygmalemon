const isProd = process.env.NODE_ENV === 'production'
const host = isProd ? '/' : 'localhost'
const port = isProd ? 443 : 9000
const secure = isProd

export default {
  host,
  debug: 0,
  port,
  secure,
  path: '/api/p2p/'
}
