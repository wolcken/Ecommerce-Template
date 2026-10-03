import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { runtime } from '../../app/services/runtime'
import { formatMoney } from '../../shared/utils/formatMoney'
import { Icon } from '../../shared/components/Icon'
import { buildSalesReportView, initialSalesReportDates, salesReportRange } from './sales-report.logic'
import type { SalesReportResult } from './sales-report.models'

function date(value: string) {
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(value))
}

function optionalMoney(value: number | null) {
  return value === null ? 'No disponible' : formatMoney(value)
}

export function AdminSalesReportPage() {
  const initialDates = useMemo(() => initialSalesReportDates(), [])
  const [from, setFrom] = useState(initialDates.from)
  const [to, setTo] = useState(initialDates.to)
  const [appliedRange, setAppliedRange] = useState(initialDates)
  const [result, setResult] = useState<SalesReportResult>({ orders: [], truncated: false })
  const [loading, setLoading] = useState(runtime.mode === 'firebase')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const report = useMemo(() => buildSalesReportView(result.orders), [result.orders])

  async function load(nextFrom: string, nextTo: string) {
    if (runtime.mode !== 'firebase') return
    setLoading(true)
    setError(null)
    try {
      const range = salesReportRange(nextFrom, nextTo)
      const nextResult = await runtime.reports.list(range)
      setResult(nextResult)
      setAppliedRange({ from: nextFrom, to: nextTo })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo generar el informe de ventas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runtime.mode !== 'firebase') return
    let cancelled = false
    const range = salesReportRange(initialDates.from, initialDates.to)
    runtime.reports.list(range)
      .then((nextResult) => {
        if (!cancelled) setResult(nextResult)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'No se pudo generar el informe de ventas.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [initialDates])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void load(from, to)
  }

  async function downloadPdf() {
    setExporting(true)
    setError(null)
    try {
      const { downloadSalesReportPdf } = await import('./sales-report.pdf')
      await downloadSalesReportPdf({ report, fromLabel: appliedRange.from, toLabel: appliedRange.to })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo generar el PDF.')
    } finally {
      setExporting(false)
    }
  }

  const completeCommercialData = report.summary.missingCommercialLines === 0

  return (
    <>
      <div className="report-heading">
        <div>
          <p className="eyebrow">Análisis comercial</p>
          <h1>Ventas y ganancias.</h1>
          <p className="page-intro">Consulta los artículos de pedidos completados y descarga el mismo resultado en PDF.</p>
        </div>
        <button className="button report-download" type="button" onClick={() => void downloadPdf()} disabled={loading || exporting || report.rows.length === 0}>
          <Icon name="printer" />{exporting ? 'Generando PDF…' : 'Descargar PDF'}
        </button>
      </div>

      {runtime.mode === 'demo' && <p className="notice">La demostración no contiene ventas persistidas.</p>}
      {runtime.mode === 'firebase' && (
        <form className="report-filters" onSubmit={submit}>
          <label>Desde<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} required /></label>
          <label>Hasta<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} required /></label>
          <button className="button" type="submit" disabled={loading}>{loading ? 'Consultando…' : 'Consultar ventas'}</button>
          <p>El rango incluye ambos días y admite hasta 366 días.</p>
        </form>
      )}

      {error && <p className="report-alert" role="alert">{error}</p>}
      {result.truncated && <p className="report-alert">El rango contiene más de 500 ventas. Reduce las fechas para obtener el informe completo.</p>}
      {!completeCommercialData && report.rows.length > 0 && (
        <p className="report-alert">Algunas ventas anteriores no tienen desglose comercial histórico. Sus totales de venta se muestran, pero el costo, la ganancia y el recargo figuran como no disponibles.</p>
      )}

      <section className="report-summary" aria-label="Resumen del periodo">
        <div><span>Pedidos completados</span><strong>{report.summary.orderCount}</strong></div>
        <div><span>Unidades vendidas</span><strong>{report.summary.units}</strong></div>
        <div><span>Costo</span><strong>{completeCommercialData ? formatMoney(report.summary.costMinor) : 'Parcial'}</strong></div>
        <div><span>Ganancia</span><strong>{completeCommercialData ? formatMoney(report.summary.profitMinor) : 'Parcial'}</strong></div>
        <div><span>Recargo tributario</span><strong>{completeCommercialData ? formatMoney(report.summary.taxMinor) : 'Parcial'}</strong></div>
        <div className="report-summary-total"><span>Total cobrado</span><strong>{formatMoney(report.summary.totalMinor)}</strong></div>
      </section>

      {loading && <p role="status">Preparando el informe…</p>}
      {!loading && report.rows.length === 0 && <div className="report-empty"><Icon name="receipt" /><h2>No hay ventas en este periodo.</h2><p>Prueba con un rango diferente o completa un pedido confirmado.</p></div>}
      {!loading && report.rows.length > 0 && (
        <>
          <div className="report-table-meta"><p><strong>{report.summary.lineCount}</strong> artículos en <strong>{report.summary.orderCount}</strong> pedidos.</p><p>Envíos: <strong>{formatMoney(report.summary.shippingMinor)}</strong></p></div>
          <div className="table-scroll report-table">
            <table>
              <thead><tr><th>Fecha</th><th>Pedido</th><th>Artículo</th><th>Categoría</th><th>Cant.</th><th>Costo</th><th>Ganancia</th><th>Recargo</th><th>Venta</th></tr></thead>
              <tbody>{report.rows.map((row) => <tr key={`${row.orderId}-${row.productId}`}>
                <td>{date(row.completedAt)}</td><td>{row.orderNumber}</td><td><strong>{row.name}</strong><span className="stock-sku">{row.sku}</span></td><td>{row.categoryName ?? 'Sin dato histórico'}</td><td>{row.quantity}</td><td>{optionalMoney(row.costMinor)}</td><td>{optionalMoney(row.profitMinor)}</td><td>{optionalMoney(row.taxMinor)}</td><td><strong>{formatMoney(row.saleMinor)}</strong></td>
              </tr>)}</tbody>
              <tfoot><tr><th colSpan={4}>Totales del periodo</th><td>{report.summary.units}</td><td>{completeCommercialData ? formatMoney(report.summary.costMinor) : 'Parcial'}</td><td>{completeCommercialData ? formatMoney(report.summary.profitMinor) : 'Parcial'}</td><td>{completeCommercialData ? formatMoney(report.summary.taxMinor) : 'Parcial'}</td><td>{formatMoney(report.summary.itemsMinor)}</td></tr></tfoot>
            </table>
          </div>
        </>
      )}
    </>
  )
}
