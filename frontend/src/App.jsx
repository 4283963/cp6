import { useState, useEffect } from 'react'
import SoilScene from './SoilScene.jsx'

export default function App() {
  const [samples, setSamples] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sRes, stRes] = await Promise.all([
          fetch('/api/samples').then((r) => {
            if (!r.ok) throw new Error('Failed to fetch samples')
            return r.json()
          }),
          fetch('/api/samples/stats').then((r) => {
            if (!r.ok) throw new Error('Failed to fetch stats')
            return r.json()
          }),
        ])
        if (!cancelled) {
          setSamples(sRes)
          setStats(stRes)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app-container">
      <div className="header">
        <h1>园区土壤酸碱度三维分布</h1>
        <p>
          基于 50 个采样点数据，以 3D 柱状图直观展示土壤 pH 值的空间分布。
          柱子越高代表 pH 值越高，颜色从红（酸性）过渡到蓝（碱性）。
        </p>
      </div>

      {stats && (
        <div className="stats-panel">
          <h3>采样统计</h3>
          <div className="stat-row">
            <span className="label">采样点数</span>
            <span className="value">{stats.count}</span>
          </div>
          <div className="stat-row">
            <span className="label">pH 最小值</span>
            <span className="value acid">{stats.ph_min}</span>
          </div>
          <div className="stat-row">
            <span className="label">pH 最大值</span>
            <span className="value alkaline">{stats.ph_max}</span>
          </div>
          <div className="stat-row">
            <span className="label">pH 平均值</span>
            <span className="value">{stats.ph_avg}</span>
          </div>
        </div>
      )}

      <div className="legend">
        <h3>pH 值颜色图例</h3>
        <div className="gradient-bar" />
        <div className="legend-labels">
          <span className="acid">酸性 pH&lt;7</span>
          <span>中性 pH=7</span>
          <span className="alkaline">碱性 pH&gt;7</span>
        </div>
      </div>

      <div className="controls-hint">
        🖱️ 左键拖动旋转视角<br />
        🖱️ 右键拖动平移场景<br />
        🔍 滚轮缩放
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>加载土壤采样数据中...</span>
        </div>
      )}

      {error && (
        <div className="loading" style={{ color: '#ff6b6b' }}>
          ⚠️ 数据加载失败：{error}
        </div>
      )}

      {samples && !loading && (
        <div className="canvas-wrapper">
          <SoilScene samples={samples} stats={stats} />
        </div>
      )}
    </div>
  )
}
