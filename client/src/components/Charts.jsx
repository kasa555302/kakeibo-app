import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { CATEGORIES, aggregateByCategory, aggregateByMonth } from '../utils/categories'

// Chart.jsのコンポーネントを登録する
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

/**
 * カテゴリ別円グラフ
 */
function PieChart({ records }) {
  const agg = aggregateByCategory(records)
  const labels = Object.keys(agg)
  const colors = labels.map((l) => (CATEGORIES[l] || CATEGORIES['その他']).color)

  const data = {
    labels,
    datasets: [{ data: Object.values(agg), backgroundColor: colors, borderWidth: 1 }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ¥${ctx.parsed.toLocaleString()}`,
        },
      },
    },
  }

  return (
    <div className="card">
      <h2>🥧 カテゴリ別支出</h2>
      <div className="chart-wrap">
        <Pie data={data} options={options} />
      </div>
    </div>
  )
}

/**
 * 月別支出棒グラフ
 */
function BarChart({ records }) {
  const agg = aggregateByMonth(records)
  // 月を昇順に並べる
  const labels = Object.keys(agg).sort()
  const values = labels.map((l) => agg[l])

  const data = {
    labels,
    datasets: [
      {
        label: '支出（円）',
        data: values,
        backgroundColor: '#52b788',
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ¥${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => `¥${v.toLocaleString()}`,
        },
      },
    },
  }

  return (
    <div className="card">
      <h2>📊 月別支出</h2>
      <div className="chart-wrap">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

/**
 * グラフセクション全体（円グラフ + 棒グラフ）
 */
export default function Charts({ records }) {
  if (records.length === 0) return null

  return (
    <div className="stats-section">
      <PieChart records={records} />
      <BarChart records={records} />
    </div>
  )
}
