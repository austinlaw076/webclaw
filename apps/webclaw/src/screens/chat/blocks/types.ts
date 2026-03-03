export type BlockType = 'richtext' | 'table' | 'todo' | 'callout' | 'code'

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

export type BlockDocBlock =
  | RichtextBlock
  | TableBlock
  | TodoBlock
  | CalloutBlock
  | CodeBlock

export type BlockDocument = {
  sessionKey: string
  blocks: Array<BlockDocBlock>
  updatedAt: number
}
