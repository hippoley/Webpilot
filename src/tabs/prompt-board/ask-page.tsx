import css from 'styled-jsx/css'
import {useEffect, useState} from 'react'
import {sendToContentScript} from '@plasmohq/messaging'
import {useMessage} from '@plasmohq/messaging/hook'

import {MESSAGING_EVENT} from '@/config'
import PromptBoardHeader from '@/components/prompt-board-header'
import ConfirmInput from '@/components/confirm-input'
import PromptBoardResult from '@/components/prompt-board-result'
import ReferenceBtnGroup, {ReferenceType} from '@/components/reference-btn-group'
import useAI from '@/hooks/use-ai'
import {toast} from '@/utils'

export default function AskPage() {
  const [command, setCommand] = useState('')
  const [askType, setAskType] = useState(ReferenceType.THIS_PAGE)

  const {ai, askAI} = useAI()

  useEffect(() => {
    const handleKeyUp = e => {
      if (e.key === 'Escape') {
        sendToContentScript({name: MESSAGING_EVENT.CLICK_CLOSE})
      }
    }

    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handleCommandChange = text => {
    setCommand(text)
  }

  const handleInputConfirm = command => {
    askIAByCommand(command, askType)
  }

  const handleTypeChange = type => {
    setAskType(type)
    askIAByCommand(command, type)
  }

  useMessage(req => {
    if (req.name === MESSAGING_EVENT.INPUT_FOCUS) {
      const input = document.getElementById('prompt-input')
      input?.focus()
    }
  })

  const askIAByCommand = async (command, type) => {
    if (!command || command === '') return

    if (type === ReferenceType.NONE) {
      askAI({
        command,
        onlyCommand: true,
      })
    } else if (type === ReferenceType.THE_SELECT) {
      askAI({command}) // leave text empty it will get selected text automatically
    } else if (type === ReferenceType.THIS_PAGE) {
      const article = await sendToContentScript({name: MESSAGING_EVENT.GET_DOCUMENT})

      if (article === '' || !article) {
        toast.error("Can't get article") // FIXME: i18n
        return
      }

      // FIXME: article maybe too long for ask, need token calculator
      if (command) {
        askAI({command, text: article})
      }
    }
  }

  return (
    <section className="ask-page-panel">
      <PromptBoardHeader hideTurboMode />
      <ConfirmInput
        loading={ai.loading}
        onConfirm={handleInputConfirm}
        onTextChange={handleCommandChange}
      />
      <ReferenceBtnGroup disabled={ai.loading} type={askType} onChange={handleTypeChange} />
      <PromptBoardResult />
      <style jsx>{styles}</style>
      <style jsx>{globalStyle}</style>
    </section>
  )
}

const styles = css`
  .ask-page-panel {
    padding: 16px;
  }
`

const globalStyle = css.global`
  .confirm-input {
    margin-top: 8px;
  }
`
