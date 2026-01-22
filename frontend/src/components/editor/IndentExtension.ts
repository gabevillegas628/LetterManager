import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

export const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const style = element.style.textIndent
              if (style) {
                // Parse "0.5in" or similar
                const match = style.match(/^([\d.]+)/)
                if (match) {
                  const value = parseFloat(match[1])
                  // Convert to indent level (0.5in = 1 level)
                  return Math.round(value / 0.5)
                }
              }
              return 0
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {}
              }
              return {
                style: `text-indent: ${attributes.indent * 0.5}in`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection

          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph') {
              const currentIndent = node.attrs.indent || 0
              // Max indent level of 4 (2 inches)
              if (currentIndent < 4) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent + 1,
                  })
                }
                changed = true
              }
            }
          })

          return changed
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { from, to } = selection

          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph') {
              const currentIndent = node.attrs.indent || 0
              if (currentIndent > 0) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent - 1,
                  })
                }
                changed = true
              }
            }
          })

          return changed
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    }
  },
})
