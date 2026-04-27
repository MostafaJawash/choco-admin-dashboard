import { useI18n } from '../i18n/useI18n'

export default function Table({ columns, data, emptyText }) {
  const { t } = useI18n()

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-start text-sm">
          <thead className="bg-stone-50 text-xs font-bold uppercase tracking-wide text-stone-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-stone-500" colSpan={columns.length}>
                  {emptyText || t('common.noRecords')}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="transition hover:bg-stone-50/80">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-middle text-stone-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
