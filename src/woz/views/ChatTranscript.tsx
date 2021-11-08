import * as React from "react"
import { Message } from "semantic-ui-react"
import { isStringImagePath } from "../../common/util"
import { InteractionType } from "../../woz-app/connector/agent-dialogue/generated/client_pb"
import { IDialogue } from "../model/DialogueModel"
import css from "./ChatTranscript.module.css"

export interface IChatTranscriptProperties {
  dialogue: IDialogue
  us: string
  them: string[]
}

export class ChatTranscript
  extends React.Component<IChatTranscriptProperties, {}> {

  private messageList?: HTMLDivElement

  private scrollToBottom() {
    if (this.messageList === undefined) { return }
    const scrollHeight = this.messageList.scrollHeight
    const height = this.messageList.clientHeight
    const maxScrollTop = scrollHeight - height
    this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0
  }

  // noinspection JSUnusedGlobalSymbols
  public componentDidUpdate = () => {
    this.scrollToBottom()
  }

  // noinspection JSUnusedGlobalSymbols
  public componentDidMount = () => {
    this.scrollToBottom()
  }

  public render(): React.ReactNode {

    const rows = this.props.dialogue.messages.map((message, index) => {
      const cellClass = message.userID === undefined
        ? css.systemCell
        : message.userID === this.props.us
          ? css.ourCell
          : css.theirCell
      const rowClass = message.userID === undefined
        ? css.systemRow
        : message.userID === this.props.us
          ? css.ourRow
          : css.theirRow
      const visibleUserID = message.userID !== undefined
        && message.userID !== this.props.us
        && this.props.them.find(
          (id) => (id === message.userID)) === undefined
        ? <span className={css.them}>{message.userID}: </span>
        : ""

      // If the message is not an image
      if (!isStringImagePath(message.text)) {

        // Here we need to check if a message is a status message or an actual text message  
        if (message.messageType !== InteractionType.STATUS) {
          return <div className={css.row + " " + rowClass} key={index}>
            <div className={css.cell + " " + cellClass}>{visibleUserID}{message.text}</div>
          </div>
        }else{
          // Return a message of type status 
          return <div className={css.row + " " + rowClass} key={index}>
            <Message className={css.cellStatusMessage + " " + cellClass} color={message.text.startsWith("User moved to") ? "blue" : message.text.startsWith("User added") ? "green" : "red"}>{message.text}</Message>
          </div>
        }


      } else {
        return <div className={css.row + " " + rowClass} key={index}>
          <div className={css.imageCell + " " + cellClass}>
            <img src={message.text} className={css.imageCellSrc} alt={message.text} />
          </div>
        </div>
      }

    })

    return <div className={css.transcript}>
      <div
        className={css.scrollable}
        ref={(div) => { this.messageList = div || undefined }}>{rows}</div>
    </div>
  }
}

