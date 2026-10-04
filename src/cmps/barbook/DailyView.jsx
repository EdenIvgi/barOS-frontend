import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateField, getLangText } from '../../services/translate.service.js'

export function DailyView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [editTask, setEditTask] = useState({ index: null, value: '' })
  const [editDay, setEditDay] = useState({ index: null, value: '' })

  const tasks = page.tasks || []

  async function commitTask(i) {
    if (editTask.index !== i) return
    const translated = await translateField(editTask.value, lang)
    const newTasks = tasks.map((d, idx) => idx === i ? { ...d, task: translated } : d)
    onPageChange({ ...page, tasks: newTasks })
    setEditTask({ index: null, value: '' })
  }

  async function commitDay(i) {
    if (editDay.index !== i) return
    const v = editDay.value.trim()
    if (v) {
      const translated = await translateField(v, lang)
      const newTasks = tasks.map((d, idx) => idx === i ? { ...d, day: translated } : d)
      onPageChange({ ...page, tasks: newTasks })
    }
    setEditDay({ index: null, value: '' })
  }

  async function addDay() {
    const translated = await translateField(t('newDay'), lang)
    const newTasks = [...tasks, { day: translated, task: '' }]
    onPageChange({ ...page, tasks: newTasks })
    setEditDay({ index: newTasks.length - 1, value: getLangText(translated, lang) })
  }

  function removeDay(i) {
    onPageChange({ ...page, tasks: tasks.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="daily-page-view">
      <div className="daily-tasks-table-wrap">
        <table className="daily-tasks-table daily-tasks-vertical">
          <thead>
            <tr>
              <th>{t('dayColumn')}</th>
              <th>{t('dailyTaskColumn')}</th>
              {isAdmin && <th className="th-actions" />}
            </tr>
          </thead>
          <tbody>
            {tasks.map((d, i) => (
              <tr key={i}>
                <td className="daily-task-day-cell">
                  {editDay.index === i ? (
                    <input className="edit-input cell-input" value={editDay.value} autoFocus
                      onChange={e => setEditDay(p => ({ ...p, value: e.target.value }))}
                      onBlur={() => commitDay(i)} onKeyDown={e => e.key === 'Enter' && commitDay(i)} />
                  ) : (
                    <span className={isAdmin ? 'editable' : ''} onClick={() => isAdmin && setEditDay({ index: i, value: getLangText(d.day, lang) })}>
                      {getLangText(d.day, lang)}
                    </span>
                  )}
                </td>
                <td className="daily-task-details-cell">
                  {editTask.index === i ? (
                    <textarea className="edit-input daily-task-textarea" rows={5} value={editTask.value} autoFocus
                      onChange={e => setEditTask(p => ({ ...p, value: e.target.value }))}
                      onBlur={() => commitTask(i)}
                      onKeyDown={e => e.key === 'Escape' && setEditTask({ index: null, value: '' })}
                      placeholder={t('dailyTaskPlaceholder')}
                    />
                  ) : (
                    <div className={`daily-task-text ${isAdmin ? 'editable' : ''}`}
                      onClick={() => isAdmin && setEditTask({ index: i, value: getLangText(d.task, lang) })}>
                      {getLangText(d.task, lang)?.trim() || t('emptyClickEdit')}
                    </div>
                  )}
                </td>
                {isAdmin && (
                  <td className="td-actions">
                    <button type="button" className="btn-icon btn-delete-row" onClick={() => removeDay(i)}>×</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <button type="button" className="btn-add-item" onClick={addDay}>+ {t('addDay')}</button>
      )}
    </div>
  )
}
