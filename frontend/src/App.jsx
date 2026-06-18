import { useState, useEffect, useCallback } from 'react'
import SoilScene from './SoilScene.jsx'

export default function App() {
  const [samples, setSamples] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [depth, setDepth] = useState(0)
  const [dataVersion, setDataVersion] = useState(0)

  const fetchData = useCallback(async (depthValue) => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, stRes] = await Promise.all([
        fetch(`/api/samples?depth=${depthValue}`).then((r) => {
          if (!r.ok) throw new Error('Failed to fetch samples')
          return r.json()
        }),
        fetch(`/api/samples/stats?depth=${depthValue}`).then((r) => {
          if (!r.ok) throw new Error('Failed to fetch stats')
          return r.json()
        }),
      ])
      setSamples(sRes)
      setStats(stRes)
      setDataVersion((v) => v + 1)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(depth)
  }, [])

  const handleDepthChange = (e) => {
    setDepth(Number(e.target.value))
  }

  const handleApply = () => {
    fetchData(depth)
  }

  const handleRandomize = () => {
    const randomDepth = Math.floor(Math.random() * 100)
    setDepth(randomDepth)
    fetchData(randomDepth)
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>园区土壤酸碱度三维分布</h1>
        <p>
          基于 50 个采样点数据，以 3D 柱状图直观展示土壤 pH 值的空间分布。
          柱子越高代表 pH 值越高，颜色从红（酸性）过渡到蓝（碱性）。
        </p>
      </div>

      <div className="filter-panel">
        <h3>🔬 筛选条件</h3>
        <div className="filter-item">
          <label className="filter-label">
            采样深度: <span className="filter-value">{depth} cm</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={depth}
            onChange={handleDepthChange}
            className="depth-slider"
          />
          <div className="slider-labels">
            <span>表层 0cm</span>
            <span>深层 100cm</span>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleApply}>
            应用筛选
          </button>
          <button className="btn btn-secondary" onClick={handleRandomize}>
            🎲 随机深度
          </button>
        </div>
        <div className="filter-info">
          <p>当前数据版本: #{dataVersion}</p>
        </div>
      </div>

      {stats && (
        <div className="stats-panel">
          <h3>📊 采样统计</h3>
          <div className="stat-row">
            <span className="label">采样深度</span>
            <span className="value">{stats.depth} cm</span>
          </div>
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

      {loading && samples === null && (
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

      {samples && (
        <div className="canvas-wrapper">
          <SoilScene
            samples={samples}
            stats={stats}
            dataVersion={dataVersion}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}
