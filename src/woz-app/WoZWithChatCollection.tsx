/*
 * Copyright 2019. University of Southern California
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

import * as React from "react"
import {Grid} from "semantic-ui-react"
import { Button, Checkbox, Container, Header, Icon, Message } from "semantic-ui-react"
import {Dialogue} from "../woz/model/DialogueModel"
import {ChatTranscript} from "../woz/views/ChatTranscript"
import {
  IWozCollectionProperties, WozCollection,
} from "../woz/views/WozCollection"
import css from "./App.module.css"
import {WozConnectors} from "./connector/Connector"
import {ChatInput} from "../woz/views/ChatInput"
import { InteractionType } from "./connector/agent-dialogue/generated/client_pb"
import { Store } from "./Store"

export interface IWoZWithCharCollectionProperties
    extends IWozCollectionProperties {
  dialogue?: Dialogue
}

interface IWoZWithCharCollectionState {
  dialogue: Dialogue
}

interface IChatComponentProperties {
  dialogue?: Dialogue
  onCommit: (interactionType?: InteractionType, actions?: Array<string>) => void
  onChange: (text: string) => void
  onRevert: () => void
  wozMessage:string
}

class ChatComponent extends React.Component<IChatComponentProperties,
    IWoZWithCharCollectionState> {

  constructor(props: IChatComponentProperties) {
    super(props)
    this.state = {
      dialogue: props.dialogue || new Dialogue({messages: []}),
    }

    WozConnectors.shared.selectedConnector.onMessage = (message) => {
      this.setState((prev) => {
        return { dialogue: prev.dialogue.appending(message, 300) }
      })
    }
  }

  private shouldDisableNextButton(dialogue) {
    // The idea here is to selectively enable/disable the "Next" button in the ChatInput
    // component based on the message history, with the goal being to prevent the user
    // from repeatedly clicking "Next" to reach the end of the task without actually
    // going through a conversation. 
    //
    // The "Next" button should become enabled after at least one message has been exchanged
    // in each direction during the current step. There are two cases to check for:
    //
    //  1. We're at the beginning of the dialogue, so there are no previous "step changed"
    //      messages and we just want to check for messages sent since the conversation began.
    //  2. We're in the middle of the dialogue, in which case we want to check back until we
    //      find the most recent "step changed" message, and count the messages since then.
    if(dialogue === undefined) {
        return true;
    }

    // if less than 2 messages, button must be disabled
    if(dialogue.messages.length < 2) {
        return true;
    }

    let messageIndex = dialogue.messages.length;
    let textMessagesUs = 0;
    let textMessagesThem = 0;
    let shouldDisable = true;

    // work through the messages in the dialogue object, starting from most recent
    while(messageIndex > 0) {
        messageIndex--;

        const message = dialogue.messages[messageIndex];
        // ignore non-STATUS/TEXT messages
        if(message.messageType != InteractionType.STATUS && message.messageType != InteractionType.TEXT) {
            continue;
        }

        // if it's a TEXT message, check who sent it and increment the counter
        if (message.messageType == InteractionType.TEXT) {
            if(message.userID == WozConnectors.shared.selectedConnector.chatUserID) {
                textMessagesUs++;
            } else {
                textMessagesThem++;
            }
        } else {
            // if it's a STATUS message, check if it's a step change and break out if so
            if(message.text.startsWith("User moved to")) {
                break
            }
        }
    }

    // by this point either we've found a previous step change STATUS message, or run out of
    // messages. in either case now want to check how many text messages were found in the
    // dialogue up to that point, and enable the button if we have at least 1 in each direction
    shouldDisable = (textMessagesUs >= 1 && textMessagesThem >= 1) ? false : true;
    console.log("disableButton? Us %o / Them %o, result %o", textMessagesUs, textMessagesThem, shouldDisable)

    return shouldDisable;
  }

  public render() {
    return <div className={css.chat_input}>
      <ChatTranscript
        dialogue={this.state.dialogue}
        us={WozConnectors.shared.selectedConnector.chatUserID}
        them={[]}/>
        <ChatInput disableNextButton={this.shouldDisableNextButton(this.state.dialogue)} {...this.props}/>
       </div>
  }
}

// tslint:disable-next-line:max-classes-per-file
export class WoZWithCharCollection
    extends React.Component<IWoZWithCharCollectionProperties, {}> {

    constructor(props) {
        super(props)
        this.state = {topicData: {}, stepIndex: 1}

        WozConnectors.shared.selectedConnector.onStepChange = (newStepIndex) => {
          this.setState((prev) => {
            return { topicData: prev.topicData, stepIndex: newStepIndex }
          })
        }
    }

    async componentDidMount() {
        // trigger loading of the topic JSON files
        this.loadTopicData()
    }

    private getContent() {
        let ad = Store.shared.agentDialogue
        if(ad !== undefined) {
            if("steps_sentences" in this.state.topicData) {
                // step indices in the messages are 1-n
                return this.state.topicData["steps_sentences"][this.state.stepIndex - 1]
            }
        }
        return ""
    }

    public getTopicById = async (topicId: string): Promise<object[]> => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Origin': '*' },
        };

        var dataJson = undefined;
        try {
            const topics_url = process.env.REACT_APP_DATA_URL;
            const response = await fetch(topics_url as string, requestOptions);
            dataJson = await response.json();

            if (dataJson !== undefined && topicId in dataJson) {
                return dataJson[topicId]['document']
            }

        } catch (error) {
            console.log('Recipe fetch error: %o', error);
        }

        return dataJson;
    }

    public getAllRecipes = async (): Promise<object[]> => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Origin': '*' },
        };

        var dataJson = undefined;
        try {
            const recipes_url = process.env.REACT_APP_RECIPE_URL;
            const response = await fetch(recipes_url as string, requestOptions);
            dataJson = await response.json();

            if (dataJson !== undefined) {
                return dataJson['recipes'];
            }

        } catch (error) {
            console.log('Recipe fetch error: %o', error);
        }

        return dataJson;
    }

    public async loadTopicData() {
        let info = await this.getAllRecipes()
        let topicId = "-1";
        info.every((value) => {
            if(Store.shared.topicName === value["page_title"]) {
                topicId = value["id"]
                return false
            }
            return true
        })

        let data = await this.getTopicById(topicId)
        Store.shared.agentDialogue.topicData = data;

        this.setState({topicData: data})
    }

  public render() {
    const { dialogue, ...wozProps } = this.props

    return <Grid id={css.appGroupId}>
          <Grid.Column width={5}>
            <div className={css.flex_container}>
                <div className={css.info_box}>
                  <Container className={css.recipeComponentContainer} textAlign='left'>
                    <div dangerouslySetInnerHTML={{__html: this.getContent()}}></div>
                  </Container>
                </div>
                <ChatComponent dialogue={dialogue} {...this.props}/>
            </div>
          </Grid.Column>
          <Grid.Column width={11}>
            <WozCollection {...wozProps}/>
          </Grid.Column>
        </Grid>
  }
}
