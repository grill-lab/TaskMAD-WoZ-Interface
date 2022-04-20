/*
 * Copyright 2018. University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Struct } from "google-protobuf/google/protobuf/struct_pb"
import * as React from "react"
import {
  Accordion,
  Button,
  Icon,
  Input,
  TextArea,
} from "semantic-ui-react"
import { generateHashString, isStringImagePath, isStringVideoPath } from "../../common/util"
import { InteractionType } from "../../woz-app/connector/agent-dialogue/generated/client_pb"
import { WozConnectors } from "../../woz-app/connector/Connector"
import { Dialogue } from "../model/DialogueModel"
import { IMessage } from "../model/MessageModel"
import css from "./WozHeaderTabs.module.css"

export interface IWozHeaderTabsProperties {
  dialogue?: Dialogue,
  onBotUseResponseClick: (
    issued_query?: string,
    bot_response?: string,
    bot_rewritten_response?: string) => void
}

interface IWozHeaderTabsState {
  activeIndexes: number[],
  botInput: string
  botRewrittenOutput: string,
  botGeneratedResponse: string,
  botInteractionLoading: boolean,
}

export class WozHeaderTabs extends React.Component<IWozHeaderTabsProperties, IWozHeaderTabsState>{

  lastSentUserMessage: string = "";
  uniqueChatId: string = "";

  constructor(props: any) {
    super(props)

    this.uniqueChatId = `${generateHashString(WozConnectors.shared.selectedConnector.props.conversationID)}-${generateHashString(WozConnectors.shared.selectedConnector.chatUserID)}`;
    this.state = {
      activeIndexes: [0],
      botInput: "",
      botRewrittenOutput: "",
      botGeneratedResponse: "",
      botInteractionLoading: false,
    }


  }

  // Function used purely to manage the opening and closing of the accordion tabs
  private onAccordionSectionClick = (_e: any, titleProps: any) => {

    const { index } = titleProps
    const { activeIndexes } = this.state
    let newIndex = activeIndexes;

    let indexOfActiveTab = activeIndexes.indexOf(index)
    if (indexOfActiveTab !== -1) {
      newIndex.splice(indexOfActiveTab, 1);
    } else {
      newIndex.push(index)
    }

    this.setState({ activeIndexes: newIndex })
  }

  public componentDidUpdate = () => {

    // Need to extract the last user message
    if (this.props.dialogue !== undefined) {
      for (var i = this.props.dialogue.messages.length - 1; i >= 0; i--) {
        var currentMessage: IMessage = this.props.dialogue.messages[i];
        if (currentMessage.messageType === InteractionType.TEXT
          && !isStringImagePath(currentMessage.text)
          && !isStringVideoPath(currentMessage.text)
          && currentMessage.userID !== WozConnectors.shared.selectedConnector.chatUserID) {

          if (currentMessage.text !== this.lastSentUserMessage) {
            this.lastSentUserMessage = currentMessage.text;
            this.setState({
              botInput: this.lastSentUserMessage
            })
          }

          break;
        }

      }
    }
  }


  public render() {

    return <div className={css.maindiv}>
      <Accordion fluid styled>
        <Accordion.Title
          active={this.state.activeIndexes.indexOf(0) !== -1}
          index={0}
          onClick={this.onAccordionSectionClick}
        >
          <Icon name="dropdown" />
          InternalGrill Dashboard
        </Accordion.Title>
        <Accordion.Content active={this.state.activeIndexes.indexOf(0) !== -1}>
          <Input
            icon={{ name: 'search', circular: true, link: true }}
            placeholder='Input text...'
            className={css.tabInputStyle}

            fluid={true}
            value={this.state.botInput}
            onChange={(value) => {
              this.setState({
                botInput: value.target.value
              });
            }}
          />

          <TextArea
            disabled={this.state.botRewrittenOutput === ""}
            icon={{ name: 'terminal', circular: true, link: true }}
            placeholder='Bot Response...'
            className={css.textAreaField}
            value={this.state.botRewrittenOutput}
            onChange={(value) => {
              this.setState({
                botRewrittenOutput: value.currentTarget.value
              });
            }}
          />

          <Button compact color='green' loading={this.state.botInteractionLoading} onClick={async () => {
            this.setState({
              botInteractionLoading: true,
              botRewrittenOutput: "",
              botGeneratedResponse: "",
            });

            if (this.state.botInput !== undefined && this.state.botInput.trim().length !== 0) {

              let apiResponse: Object = await WozConnectors.shared.selectedConnector.onAgentInteractionApiRequest(Struct.fromJavaScript({
                "service_name": "internalGrill",
                "api_endpoint": "run",
                "request_type": "GET",
                "request_body": {
                  "text": this.state.botInput,
                  "id": this.uniqueChatId,
                  "headless": 'true',

                }
              }), "SearchAPI");

              if (apiResponse !== undefined && apiResponse.hasOwnProperty('speechText')) {
                this.setState({
                  botRewrittenOutput: Object.getOwnPropertyDescriptor(apiResponse, "speechText")?.value,
                  botGeneratedResponse: Object.getOwnPropertyDescriptor(apiResponse, "speechText")?.value
                });
              }
            }
            this.setState({
              botInteractionLoading: false
            });
          }}>Get Response from Bot</Button>
          <Button style={{ display: this.state.botRewrittenOutput !== "" ? 'inline' : 'none' }} compact color='violet' loading={this.state.botInteractionLoading} onClick={() => {
            this.setState({
              botInteractionLoading: true,
            });
            this.props.onBotUseResponseClick(this.state.botInput, this.state.botGeneratedResponse, this.state.botRewrittenOutput === this.state.botGeneratedResponse ? "" : this.state.botRewrittenOutput);
            this.setState({
              botInteractionLoading: false,
              botInput: "",
              botGeneratedResponse: "",
              botRewrittenOutput: "",
            });
          }}>Use Response</Button>


        </Accordion.Content>
      </Accordion>
    </div >
  }

}
