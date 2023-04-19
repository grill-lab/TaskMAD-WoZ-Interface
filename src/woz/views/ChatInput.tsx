import * as React from "react"
import {Icon} from "semantic-ui-react"
import { InteractionType } from "../../woz-app/connector/agent-dialogue/generated/client_pb"
import css from "./ChatInput.module.css"
import {ControlledInput} from "./ValueInput"

export interface IChatInputProperties {
  onEnter?: (text: string) => void
  onCommit: (interactionType?: InteractionType, actions?: Array<string>) => void
  onChange: (text: string) => void
  onRevert: () => void
  wozMessage:string
  disableNextButton: boolean
}

interface IChatInputState {
  value: string
}

export class ChatInput
    extends React.Component<IChatInputProperties, IChatInputState> {

  public render(): React.ReactNode {
    return <div className={css.entry}>
      <ControlledInput className={css.inputField}
      onCommit={this.props.onCommit}
      onRevert={this.props.onRevert}
      onChanget={this.props.onChange}
      wozMessage={this.props.wozMessage}
      disableNextButton={this.props.disableNextButton}

      icon={<Icon
        name="send" inverted circular link
        className={css.enterButton}
        disabled={this.props.wozMessage.trim().length === 0}
        onClick={()=> this.props.onCommit(InteractionType.TEXT, [])} />} 
      displayInteractionButtons={true}      />
    </div>
  }
}
