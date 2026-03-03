import type {
  BlockDocBlock,
  CalloutVariant,
  TableBlockData,
  TodoBlockData,
} from './types'

type SerializeBlocksOptions = {
  separator?: string
}

function normalizeMarkdown(value: string): string {
  return value.trim()
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').trim()
}

function serializeTodo(data: TodoBlockData): string {
  return data.items
    .map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text.trim()}`)
    .join('\n')
    .trim()
}

function serializeTable(data: TableBlockData): string {
  const columns = data.columns.map(escapeTableCell)
  if (columns.length === 0) return ''

  const header = `| ${columns.join(' | ')} |`
  const divider = `| ${columns.map(() => '---').join(' | ')} |`
  const rows = data.rows.map(function serializeRow(row) {
    const rowCells = columns.map(function mapColumn(_, index) {
      return escapeTableCell(String(row[index] ?? ''))
    })
    return `| ${rowCells.join(' | ')} |`
  })

  return [header, divider, ...rows].join('\n').trim()
}

function serializeCalloutVariant(variant: CalloutVariant): string {
  if (variant === 'warning') return 'WARNING'
  if (variant === 'success') return 'SUCCESS'
  return 'INFO'
}

function serializeCallout(variant: CalloutVariant, markdown: string): string {
  const normalized = normalizeMarkdown(markdown)
  if (!normalized) {
    return `> [!${serializeCalloutVariant(variant)}]`
  }
  const lines = normalized.split('\n').map((line) => `> ${line}`)
  return [`> [!${serializeCalloutVariant(variant)}]`, ...lines].join('\n')
}

function serializeCode(language: string, code: string): string {
  const normalizedLanguage = language.trim()
  const normalizedCode = code.replace(/\s+$/, '')
  return `\`\`\`${normalizedLanguage}\n${normalizedCode}\n\`\`\``.trim()
}

export function serializeBlockToMarkdown(block: BlockDocBlock): string {
  switch (block.type) {
    case 'richtext':
      return normalizeMarkdown(block.data.markdown)
    case 'todo':
      return serializeTodo(block.data)
    case 'table':
      return serializeTable(block.data)
    case 'callout':
      return serializeCallout(block.data.variant, block.data.markdown)
    case 'code':
      return serializeCode(block.data.language, block.data.code)
  }
}

export function serializeBlocksToMarkdown(
  blocks: Array<BlockDocBlock>,
  options: SerializeBlocksOptions = {},
): string {
  const separator = options.separator ?? '\n\n'
  return blocks
    .map((block) => serializeBlockToMarkdown(block))
    .filter((markdown) => markdown.length > 0)
    .join(separator)
    .trim()
}
