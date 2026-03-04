import type {
  BlockDocBlock,
  FormBlock,
  FormBlockData,
  FormField,
  FormFieldValue,
} from './types'

const DEFAULT_FORM_ID = 'form-primary'

const DEFAULT_FORM_SCHEMA: Array<FormField> = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'notes', label: 'Notes', type: 'textarea' },
  { id: 'status', label: 'Status', type: 'select', options: ['Draft', 'Ready', 'Blocked'] },
  { id: 'approved', label: 'Approved', type: 'checkbox' },
  { id: 'dueDate', label: 'Due Date', type: 'date' },
]

function nowMs(): number {
  return Date.now()
}

export function createDefaultFormBlock(): FormBlock {
  const createdAt = nowMs()
  return {
    id: DEFAULT_FORM_ID,
    type: 'form',
    createdAt,
    updatedAt: createdAt,
    data: {
      schema: DEFAULT_FORM_SCHEMA,
      values: {},
    },
  }
}

export function resolveFormBlock(blocks: Array<BlockDocBlock>): FormBlock {
  const existing = blocks.find((block): block is FormBlock => block.type === 'form')
  if (existing) return existing
  return createDefaultFormBlock()
}

export function withFormValue(
  block: FormBlock,
  fieldId: string,
  value: FormFieldValue,
): FormBlock {
  return {
    ...block,
    updatedAt: nowMs(),
    data: {
      ...block.data,
      values: {
        ...block.data.values,
        [fieldId]: value,
      },
    },
  }
}

export function resetFormValues(block: FormBlock): FormBlock {
  return {
    ...block,
    updatedAt: nowMs(),
    data: {
      ...block.data,
      values: {},
    },
  }
}

export function buildFormJsonExport(data: FormBlockData): string {
  return JSON.stringify(data.values, null, 2)
}

export function buildFormMarkdownExport(data: FormBlockData): string {
  return data.schema
    .map((field) => {
      const value = data.values[field.id]
      return `${field.label}: ${formatFormValue(field, value)}`
    })
    .join('\n')
    .trim()
}

function formatFormValue(field: FormField, value: FormFieldValue | undefined): string {
  if (field.type === 'checkbox') {
    return value === true ? 'true' : 'false'
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}
