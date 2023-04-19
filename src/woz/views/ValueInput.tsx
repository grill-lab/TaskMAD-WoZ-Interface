/* tslint:disable:max-classes-per-file */
import * as React from "react"
import { Button, Grid, InputProps, TextArea } from "semantic-ui-react"
import { InteractionType } from "../../woz-app/connector/agent-dialogue/generated/client_pb"
import css from "./ChatInput.module.css"

export interface IControlledComponent {
  onChanget: (newValue: string) => void
  onCommit: (interactionType?: InteractionType, actions?: Array<string>) => void
  onRevert: () => void
  wozMessage: string
  displayInteractionButtons: boolean
  disableNextButton: boolean
}

export const ControlledInput
  : React.FunctionComponent<InputProps & IControlledComponent>
  = (props) => {

    const { onChanget, onCommit, onRevert, wozMessage, displayInteractionButtons, disableNextButton, ...inherited } = props


    // Interaction buttons used by the wizard to control the user interface 
    var interactionButtons = displayInteractionButtons ? <Grid className={css.wozInteractionGrid}>
      <Grid.Column width={8} className={css.wozInteractionColumns}>
        <Button className={css.wozInteractionButton} onClick={() => onCommit(InteractionType.ACTION, ["prev"])}>Previous</Button>
      </Grid.Column>
      <Grid.Column width={8} className={css.wozInteractionColumns}>
        <Button disabled={disableNextButton} className={css.wozInteractionButton + " " + css.wozInteractionButtonNext} onClick={() => onCommit(InteractionType.ACTION, ["next"])}>Next</Button>
      </Grid.Column>
    </Grid> : null;
    return (
      <div>
        {interactionButtons}
        <Grid className={css.wozInteractionGridTwo}>
          <Grid.Column width={13} className={css.wozInteractionColumnsTwo}>
            <TextArea
              value={wozMessage}
              {...inherited}
              onChange={(_e) => {
                onChanget(_e.currentTarget.value)
              }} />
          </Grid.Column>
          <Grid.Column width={1} className={css.wozInteractionColumnsTwo}>
            <div className={css.sendButtonGrid}>
              <div></div>
              <div>{props.icon}</div>
              <div></div>
            </div>
          </Grid.Column>
        </Grid>
      </div>
    )

  }
