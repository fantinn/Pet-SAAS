import http from 'node:http'

const TARGET_PORT = 5173
const LISTEN_PORT = 80

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    { host: '127.0.0.1', port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )
  req.pipe(proxyReq)
  proxyReq.on('error', () => res.end())
})

server.on('upgrade', (req, socket, head) => {
  const proxyReq = http.request({
    host: '127.0.0.1', port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers,
  })
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    )
    proxySocket.pipe(socket)
    socket.pipe(proxySocket)
  })
  proxyReq.end()
})

server.listen(LISTEN_PORT, () => {
  console.log(`Proxy: http://petshop.localhost -> http://localhost:${TARGET_PORT}`)
})
