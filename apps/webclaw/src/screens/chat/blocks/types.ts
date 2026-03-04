export type BlockType =
  | 'richtext'
  | 'table'
  | 'todo'
  | 'callout'
  | 'code'
  | 'form'

export type RichtextBlockData = {
  markdown: string
}

export type TableBlockData = {
  columns: Array<string>
  rows: Array<Array<string>>
}

export type TodoBlockItem = {
  id: string
  text: string
  checked: boolean
}

export type TodoBlockData = {
  items: Array<TodoBlockItem>
}

export type CalloutVariant = 'info' | 'warning' | 'success'

export type CalloutBlockData = {
  variant: CalloutVariant
  markdown: string
}

export type CodeBlockData = {
  language: string
  code: string
}

export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'date'

type FormFieldBase = {
  id: string
  label: string
  type: FormFieldType
}

export type FormTextField = FormFieldBase & {
  type: 'text' | 'textarea' | 'date'
}

export type FormSelectField = FormFieldBase & {
  type: 'select'
  options: Array<string>
}

export type FormCheckboxField = FormFieldBase & {
  type: 'checkbox'
}

export type FormField = FormTextField | FormSelectField | FormCheckboxField

export type FormFieldValue = string | boolean

export type FormBlockData = {
  schema: Array<FormField>
  values: Record<string, FormFieldValue>
}

type BlockDocBase = {
  id: string
  createdAt: number
  updatedAt: number
}

export type RichtextBlock = BlockDocBase & {
  type: 'richtext'
  data: RichtextBlockData
}

export type TableBlock = BlockDocBase & {
  type: 'table'
  data: TableBlockData
}

export type TodoBlock = BlockDocBase & {
  type: 'todo'
  data: TodoBlockData
}

export type CalloutBlock = BlockDocBase & {
  type: 'callout'
  data: CalloutBlockData
}

export type CodeBlock = BlockDocBase & {
  type: 'code'
  data: CodeBlockData
}

export type FormBlock = BlockDocBase & {
  type: 'form'
  data: FormBlockData
}

export type BlockDocBlock =
  | RichtextBlock
  | TableBlock
  | TodoBlock
  | CalloutBlock
  | CodeBlock
  | FormBlock

export type BlockDocument = {
  sessionKey: string
  blocks: Array<BlockDocBlock>
  updatedAt: number
}
