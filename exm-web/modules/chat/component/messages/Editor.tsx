import React, { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { currentUserAtom } from "@/modules/JotaiProvider"
import { IUser } from "@/modules/types"
import { useAtomValue } from "jotai"
import { Mic, Paperclip, SendHorizonal } from "lucide-react"

import Loader from "@/components/ui/loader"
import { AttachmentWithChatPreview } from "@/components/AttachmentWithChatPreview"
import uploadHandler from "@/components/uploader/uploadHandler"

import useChatsMutation from "../../hooks/useChatsMutation"
import AudioRecorder from "./AudioRecorder"
import EmojiPicker from "./EmojiPicker"
import ReplyInfo from "./ReplyInfo"

type IProps = {
  reply: any
  setReply: (reply: any) => void
  sendMessage: ({
    content,
    relatedId,
    attachments,
  }: {
    content?: string
    relatedId?: string
    attachments?: string[]
  }) => void
}

const Editor = ({ sendMessage, reply, setReply }: IProps) => {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<any[]>([])
  const relatedId = (reply && reply._id) || null
  const currentUser = useAtomValue(currentUserAtom) || ({} as IUser)
  const callBack = (result: string) => {
    return
  }
  const { chatTyping } = useChatsMutation({ callBack })

  const [loading, setLoading] = useState(false)
  const [voiceUploaded, setVoiceUploaded] = useState(false)
  const searchParams = useSearchParams()
  const chatId = searchParams.get("id")

  const textareaRef = useRef<any>(null)

  let typingTimeout: any

  useEffect(() => {
    if (message === "" && chatId) {
      chatTyping(chatId, "")
    }

    if (message && chatId) {
      clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => {
        chatTyping(chatId, currentUser._id)
      }, 1000)
    }
  }, [message])

  const [isRecording, setIsRecording] = useState<boolean>(false)

  const handleInputChange = (e: any) => {
    setMessage(e.target.value)
  }

  const deleteImage = (index: number) => {
    const updated = [...attachments]

    updated.splice(index, 1)

    setAttachments(updated)
  }

  const handleAttachmentChange = (e: any) => {
    const files = e.target.files

    uploadHandler({
      files,
      beforeUpload: () => {
        setLoading(true)
        return
      },

      afterUpload: ({ response, fileInfo }) => {
        setLoading(false)

        setAttachments((prevAttachments) => [
          ...prevAttachments,
          Object.assign({ url: response }, fileInfo),
        ])
      },
    })
  }

  const onSubmit = () => {
    sendMessage({ content: message, relatedId, attachments })
    setAttachments([])
    setMessage("")
    setReply(null)
  }

  const onEnterPress = (e: any) => {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault()
      onSubmit()
    }
  }

  const attachmentsSection = () => {
    if (attachments && attachments.length > 0) {
      return (
        <div className="pt-2 overflow-auto w-full scrollbar-hide max-h-[200px] ">
          <AttachmentWithChatPreview
            attachments={
              attachments.filter((a: any) => !a.type.includes("image")) || []
            }
            className="flex w-full items-center flex-wrap"
            deleteImage={deleteImage}
          />
          <AttachmentWithChatPreview
            attachments={
              attachments.filter((a: any) => a.type.includes("image")) || []
            }
            className="grid grid-cols-4 w-full"
            deleteImage={deleteImage}
          />
        </div>
      )
    } else {
      return null
    }
  }

  const emojiHandler = (emojiData: any) => {
    const cursorPosition = textareaRef.current.selectionStart

    setMessage((prevMessage) => {
      const beforeCursor = prevMessage.slice(0, cursorPosition)
      const afterCursor = prevMessage.slice(cursorPosition)

      const newMessage = beforeCursor + emojiData.native + afterCursor
      const newCursorPosition = beforeCursor.length + emojiData.native.length

      setTimeout(() => {
        textareaRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        )
        textareaRef.current.focus()
      }, 0)

      return newMessage
    })
  }

  const convertBlobToFileList = (blob: Blob) => {
    const fileName = "voice-message.mp3"
    const file = new File([blob], fileName, { type: "audio/mpeg" })
    const fileList = [file]

    return fileList
  }

  const sendAudio = (audioBlob: Blob) => {
    const files: any = convertBlobToFileList(audioBlob)

    uploadHandler({
      files,
      beforeUpload: () => {
        setLoading(true)
        return
      },
      afterUpload: ({ response, fileInfo }) => {
        setLoading(false)
        setIsRecording(false)
        setVoiceUploaded(true)
        setAttachments([
          ...(attachments || []),
          Object.assign({ url: response }, fileInfo),
        ])
      },
    })
  }

  const inputSection = (type?: string) => {
    if (isRecording) {
      return null
    }

    if (type === "button") {
      return (
        <button
          onClick={() => setIsRecording(true)}
          disabled={voiceUploaded}
          className="disabled:cursor-not-allowed"
        >
          <Mic size={18} />
        </button>
      )
    }

    const style = {
      maxHeight: "75px",
      fontSize: "15px",
    }

    return (
      <div className={`flex justify-between w-full`}>
        <textarea
          value={message}
          style={style}
          onChange={handleInputChange}
          onKeyDown={onEnterPress}
          autoComplete="off"
          ref={textareaRef}
          className="outline-none w-full h-auto bg-transparent resize-none scrollbar-hide"
          placeholder="Type your message"
          rows={1}
        />

        <EmojiPicker
          emojiHandler={(emojiData: any) => emojiHandler(emojiData)}
        />
      </div>
    )
  }

  return (
    <>
      <ReplyInfo reply={reply} setReply={setReply} />
      <div className={` py-5 px-[27px]`}>
        {attachments && attachments.length > 0 && attachmentsSection()}
        {loading && <Loader className="mb-3" />}
        <div className="flex items-center justify-around gap-4 ">
          {isRecording ? (
            <AudioRecorder sendAudio={sendAudio} />
          ) : (
            <>
              <div className="flex gap-4">
                {inputSection("button")}
                <label className="cursor-pointer">
                  <input
                    autoComplete="off"
                    type="file"
                    multiple={true}
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                  <Paperclip size={16} />
                </label>
              </div>
              <div className="w-full">
                <div className="relative flex flex-1 items-center gap-4 p-4 rounded-lg bg-[#FCFCFD] border border-exm">
                  {inputSection()}
                </div>
              </div>
              <button
                type="submit"
                className="text-sm font-semibold text-[#98A2B3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={onSubmit}
              >
                <SendHorizonal />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Editor
