import base from './rollup.config.js'
import serve from 'rollup-plugin-serve'

export default base.map((cfg) => ({
  ...cfg,
  plugins: [
    ...cfg.plugins.filter((p) => p && p.name !== 'terser'),
    serve({
      contentBase: './dist',
      host: '0.0.0.0',
      port: 5000,
      allowCrossOrigin: true,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  ]
}))
