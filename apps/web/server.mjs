import http from 'node:http'
import handler from 'serve-handler'

const port = Number(process.env.PORT || 3000)

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (request.url?.startsWith('/api/')) {
    response.writeHead(502, { 'Content-Type': 'application/json' })
    response.end(
      JSON.stringify({
        error:
          'Web service received an API request. Set VITE_API_BASE_URL to your Railway API domain and redeploy the web service.',
      })
    )
    return
  }

  void handler(request, response, {
    public: 'dist',
    cleanUrls: false,
    rewrites: [{ source: '**', destination: '/index.html' }],
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`MyBand web running on http://0.0.0.0:${port}`)
})
