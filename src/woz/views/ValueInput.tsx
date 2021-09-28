/* tslint:disable:max-classes-per-file */
import * as React from "react"
import { Grid, InputProps, TextArea } from "semantic-ui-react"
import css from "./ChatInput.module.css"

export interface IControlledComponent {
  onChanget: (newValue: string) => void
  onCommit: () => void
  onRevert: () => void
  wozMessage:string
}

export const ControlledInput
  : React.FunctionComponent<InputProps & IControlledComponent>
  = (props) => {

    const { onChanget, onCommit, onRevert, wozMessage, ...inherited } = props

    return (
      <Grid>
        <Grid.Column width={13}>
          <TextArea
            value={wozMessage}
            {...inherited}
            onChange={(_e) => {
              onChanget(_e.currentTarget.value)
            }} />
        </Grid.Column>
        <Grid.Column width={1}>
          <div className={css.sendButtonGrid}>
            <div></div>
            <div>{props.icon}</div>
            <div></div>
          </div>
        </Grid.Column>
      </Grid>)

  }