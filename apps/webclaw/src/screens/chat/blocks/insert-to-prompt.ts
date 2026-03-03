import { serializeBlocksToMarkdown } from './markdown-serializer'
import type { BlockDocBlock } from './types'

type BuildPromptInsertionOptions = {
  selectedBlockIds?: Array<string>
  separator?: string
}

function filterSelectedBlocks(
  blocks: Array<BlockDocBlock>,
  selectedBlockIds?: Array<string>,
): Array<BlockDocBlock> {
  if (!Array.isArray(selectedBlockIds) || selectedBlockIds.length === 0) {
    return blocks
  }

  const selected = new Set(selectedBlockIds)
  return blocks.filter((block) => selected.has(block.id))
}

export function buildPromptInsertionFromBlocks(
  blocks: Array<BlockDocBlock>,
  options: BuildPromptInsertionOptions = {},
): string {
  const selectedBlocks = filterSelectedBlocks(blocks, options.selectedBlockIds)
  return serializeBlocksToMarkdown(selectedBlocks, {
    separator: options.separator,
  })
}

export function appendInsertionToPrompt(
  currentPrompt: string,
  insertion: string,
): string {
  const normalizedPrompt = currentPrompt.trimEnd()
  const normalizedInsertion = insertion.trimEnd()

  if (normalizedInsertion.trim().length === 0) return normalizedPrompt
  if (!normalizedPrompt) return normalizedInsertion

  return `${normalizedPrompt}\n\n${normalizedInsertion}`
}
