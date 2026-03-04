import { useCallback, useEffect, useMemo } from 'react'

import {
  buildFormJsonExport,
  buildFormMarkdownExport,
  resetFormValues,
  resolveFormBlock,
  withFormValue,
} from '../blocks/form-actions'
import {
  appendInsertionToPrompt,
  buildPromptInsertionFromBlocks,
} from '../blocks/insert-to-prompt'
import { useBlockDocumentsStore } from '../blocks/document-store'
import type { FormField, FormFieldValue } from '../blocks/types'
import type { ChatComposerPromptBridge } from './chat-composer'
import { Button } from '@/components/ui/button'

type ChatFormWorkbenchProps = {
  sessionKey: string
  readPrompt: ChatComposerPromptBridge['getValue']
  writePrompt: ChatComposerPromptBridge['setValue']
}

function copyToClipboard(value: string) {
  if (typeof navigator === 'undefined') return
  void navigator.clipboard.writeText(value).catch(() => {})
}

function persistFormWithUpdater(
  sessionKey: string,
  updater: ReturnType<typeof createFormUpdater>,
) {
  const store = useBlockDocumentsStore.getState()
  const latestDoc = store.getOrCreateDoc(sessionKey)
  const latestForm = resolveFormBlock(latestDoc.blocks)
  store.upsertBlock(sessionKey, updater(latestForm))
}

function createFormUpdater<T>(fn: T): T {
  return fn
}

export function ChatFormWorkbench({
  sessionKey,
  readPrompt,
  writePrompt,
}: ChatFormWorkbenchProps) {
  const getOrCreateDoc = useBlockDocumentsStore((state) => state.getOrCreateDoc)
  const blocks = useBlockDocumentsStore(
    useCallback(
      (state) => state.docsBySession[sessionKey]?.blocks ?? [],
      [sessionKey],
    ),
  )

  useEffect(() => {
    getOrCreateDoc(sessionKey)
  }, [getOrCreateDoc, sessionKey])

  const formBlock = useMemo(() => resolveFormBlock(blocks), [blocks])

  const handleValueChange = useCallback(
    (fieldId: string, value: FormFieldValue) => {
      persistFormWithUpdater(sessionKey, (form) => withFormValue(form, fieldId, value))
    },
    [sessionKey],
  )

  const handleReset = useCallback(() => {
    persistFormWithUpdater(sessionKey, (form) => resetFormValues(form))
  }, [sessionKey])

  const handleCopyJson = useCallback(() => {
    const latestDoc = useBlockDocumentsStore.getState().getOrCreateDoc(sessionKey)
    const latestForm = resolveFormBlock(latestDoc.blocks)
    copyToClipboard(buildFormJsonExport(latestForm.data))
  }, [sessionKey])

  const handleCopyMarkdown = useCallback(() => {
    const latestDoc = useBlockDocumentsStore.getState().getOrCreateDoc(sessionKey)
    const latestForm = resolveFormBlock(latestDoc.blocks)
    copyToClipboard(buildFormMarkdownExport(latestForm.data))
  }, [sessionKey])

  const handleInsertToPrompt = useCallback(() => {
    const latestDoc = useBlockDocumentsStore.getState().getOrCreateDoc(sessionKey)
    const latestForm = resolveFormBlock(latestDoc.blocks)
    const insertion = buildPromptInsertionFromBlocks([latestForm])
    const nextPrompt = appendInsertionToPrompt(readPrompt(), insertion)
    writePrompt(nextPrompt)
  }, [readPrompt, sessionKey, writePrompt])

  return (
    <section className="mx-auto w-full max-w-full px-5 sm:max-w-[768px] sm:min-w-[400px] pb-2">
      <div className="rounded-xl border bg-card/80 px-3 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Form Block</span>
          <Button type="button" size="sm" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleCopyJson}>
            Copy JSON
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyMarkdown}
          >
            Copy Markdown
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleInsertToPrompt}
          >
            Insert to Prompt
          </Button>
        </div>

        <div className="space-y-3">
          {formBlock.data.schema.map((field) => (
            <FormFieldControl
              key={field.id}
              field={field}
              value={formBlock.data.values[field.id]}
              onChange={(value) => handleValueChange(field.id, value)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

type FormFieldControlProps = {
  field: FormField
  value: FormFieldValue | undefined
  onChange: (value: FormFieldValue) => void
}

function FormFieldControl({ field, value, onChange }: FormFieldControlProps) {
  if (field.type === 'textarea') {
    return (
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="min-h-20 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className="h-4 w-4"
        />
        {field.label}
      </label>
    )
  }

  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
      <input
        type={field.type === 'date' ? 'date' : 'text'}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
      />
    </label>
  )
}
