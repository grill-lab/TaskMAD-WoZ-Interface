import * as React from "react"
import {Icon} from "semantic-ui-react"
import css from "./ChatInput.module.css"
import {ControlledInput} from "./ValueInput"

export interface IChatInputProperties {
  onEnter?: (text: string) => void
  onCommit: () => void
  onChange: (text: string) => void
  onRevert: () => void
  wozMessage:string
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
          icon={<Icon
              name="send" inverted circular link
              className={css.enterButton}
              disabled={this.props.wozMessage.trim().length === 0}
              onClick={this.props.onCommit}
          />}
      />
    </div>
  }
}
