/**
 * Client-seitige Exporte (CSV / JSON).
 *
 * Bewusst ohne Server: die Daten liegen bereits vollstaendig im Store, ein
 * Umweg ueber die Legacy-API wuerde nur Latenz und eine weitere Fehlerquelle
 * einbauen. Der Download entsteht aus einem Blob und einem temporaeren
 * <a download>-Element.
 */

/** Trennzeichen fuer CSV. Semikolon, weil Excel in DE/AT/CH das erwartet. */
const CSV_DELIMITER = ';'

/** UTF-8 BOM – ohne das zerlegt Excel Umlaute. */
const BOM = '﻿'

export interface CsvColumn<T> {
  /** Spaltenueberschrift in der ersten Zeile */
  header: string
  /** Wert fuer eine Zeile. Rueckgabe wird via String() serialisiert. */
  value: (row: T) => unknown
}

/**
 * Loest im Browser einen Download aus.
 * Im SSR-Kontext ein No-op, damit Aufrufe aus Setup-Code nichts sprengen.
 */
export function downloadFile(filename: string, content: string | Blob, mime = 'text/plain;charset=utf-8'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Freigabe erst im naechsten Tick – Safari bricht den Download sonst ab.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Ein einzelnes CSV-Feld maskieren (Anfuehrungszeichen, Trenner, Umbrueche). */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = Array.isArray(value) ? value.join(', ') : String(value)
  return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Zeilen + Spaltendefinition zu einem CSV-String verbinden. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map(c => escapeCsv(c.header)).join(CSV_DELIMITER)
  const body = rows.map(r => columns.map(c => escapeCsv(c.value(r))).join(CSV_DELIMITER))
  return BOM + [head, ...body].join('\r\n')
}

/** Zeitstempel fuer Dateinamen: 2026-09-18 */
export function dateStamp(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** Dateinamen von Zeichen befreien, die Betriebssysteme nicht mögen. */
export function safeFilename(name: string): string {
  return name.replace(/[^\w\-. ]+/g, '_').replace(/\s+/g, '-')
}

/** Tabellen-Export als CSV herunterladen. */
export function exportCsv<T>(basename: string, rows: T[], columns: CsvColumn<T>[]): void {
  downloadFile(`${safeFilename(basename)}-${dateStamp()}.csv`, toCsv(rows, columns), 'text/csv;charset=utf-8')
}

/** Beliebige Daten als formatiertes JSON herunterladen. */
export function exportJson(basename: string, data: unknown): void {
  downloadFile(
    `${safeFilename(basename)}-${dateStamp()}.json`,
    JSON.stringify(data, null, 2),
    'application/json;charset=utf-8',
  )
}
