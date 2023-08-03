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
import {Container} from "semantic-ui-react"
import {Dialogue} from "../woz/model/DialogueModel"
import {Message} from "../woz/model/MessageModel"
import {ChatTranscript} from "../woz/views/ChatTranscript"
import {WozCollection, IWozCollectionProperties} from "../woz/views/WozCollection"
import css from "./App.module.css"
import {WozConnectors} from "./connector/Connector"
import {ChatInput} from "../woz/views/ChatInput"
import { InteractionType} from "./connector/agent-dialogue/generated/client_pb"
import { Store } from "./Store"

export interface IWoZWithCharCollectionProperties extends IWozCollectionProperties {
    inputDisabled: boolean
    llmStepIndex: number
    topicData: {}
}

interface IWoZWithCharCollectionState {
    dialogue: Dialogue
    disableNextButton: boolean
    messagesPerStep: Map<number, number>
    lastMessageFromUser: boolean
}

interface IChatComponentProperties {
    dialogue: Dialogue
    disableNextButton: boolean
    onCommit: (interactionType?: InteractionType, actions?: Array<string>) => void
    onChange: (text: string) => void
    onRevert: () => void
    wozMessage: string
    disableSendButton: boolean
    inputDisabled: boolean
}

// this component is the parent of the ChatTranscript (responsible for displaying
// the chat message history) and the the ChatInput (responsible for the Previous and
// Next buttons plus the input field and Send button)
class ChatComponent extends React.Component<IChatComponentProperties, {}> {

    public render() {
        return <div className={css.chat_input}>
            <ChatTranscript
                    dialogue={this.props.dialogue}
                    us={WozConnectors.shared.selectedConnector.chatUserID}
                    them={[]}/>
                <ChatInput {...this.props}/>
            </div>
    }
}

// tslint:disable-next-line:max-classes-per-file
export class WoZWithCharCollection extends React.Component<IWoZWithCharCollectionProperties, IWoZWithCharCollectionState> {

    constructor(props: IWoZWithCharCollectionProperties) {
        super(props)
        this.state = {
            disableNextButton: true,
            messagesPerStep: new Map<number, number>(),
            dialogue: new Dialogue({messages: []}),
            lastMessageFromUser: true, // default to true to enable sending when initiating a new conversation
        }

    
        // handler for incoming messages
        WozConnectors.shared.selectedConnector.onMessage = async (message: Message) => {
            this.setState((prev) => {
                let currentStep = this.props.llmStepIndex
                let lastMessageFromUser = prev.lastMessageFromUser

                // special case when we get a "user joined the chat" message: send back an ACTION
                // message setting the current step 
                if(message.messageType === InteractionType.STATUS && message.text.indexOf('joined the chat') !== -1) {
                    console.log('sending back "set" action message')
                    let actions = Array<string>()
                    actions.push('step' + currentStep)
                    WozConnectors.shared.selectedConnector.onMessageSentLogger('', [], [], InteractionType.ACTION, actions)
                    // update the dialogue object here so the message shows up in the UI
                    // TODO this should only need to update the dialogue entry? none of the other state vars
                    // should need to change here
                    return { messagesPerStep: prev.messagesPerStep, disableNextButton: prev.disableNextButton, lastMessageFromUser: prev.lastMessageFromUser, dialogue: prev.dialogue.appending(message, 0) }
                }
                
                // TODO this should also check the this.props.wozMessage value which contains the current text in the input
                // box. If the length is 0 then the button should remain disabled
                //console.log("wozMessage %o", this.props.wozMessage)
                let disableNextButton = false
                // console.log({ messagesPerStep: prev.messagesPerStep, stepIndex: currentStep, disableNextButton: disableNextButton, lastMessageFromUser: lastMessageFromUser})

                // this has the effect of clearing the text area, which we want to do after sending a message. normally this happens after clicking the
                // send button, but forcing it here means that we can insert the "initial_wizard_message" text when resuming a conversation and then
                // have it automatically cleared as later messages are streamed through here
                if(message.messageType === InteractionType.TEXT && message.userID === WozConnectors.shared.selectedConnector.chatUserID) {
                    // console.log("Clearing message text")
                    this.props.onChange("")
                }
                return { messagesPerStep: prev.messagesPerStep, stepIndex: currentStep, disableNextButton: disableNextButton, lastMessageFromUser: lastMessageFromUser, dialogue: prev.dialogue.appending(message, 0) }
            })
        }
    }

    private getContent(): string {
        // retrieve side-panel text content for the selected topic and step number
        let ad = Store.shared.agentDialogue
        if(ad !== undefined) {
            if("steps_sentences_wizard" in this.props.topicData) {
                // step indices in the messages are 1-n when displayed, but the LLM API
                // will send us 0-based indices so do NOT subtract one here!
                return this.props.topicData["steps_sentences_wizard"][this.props.llmStepIndex]
            }
        }
        return ""
    }

    public render() {
        const { ...wozProps } = this.props

        return <Grid id={css.appGroupId}>
            <Grid.Column width={8}>
                <div className={css.flex_container}>
                    <div className={css.info_box}>
                        <Container className={css.recipeComponentContainer} textAlign='left'>
                            <div dangerouslySetInnerHTML={{__html: this.getContent()}}></div>
                        </Container>
                    </div>
                    <ChatComponent 
                        dialogue={this.state.dialogue} 
                        disableNextButton={this.state.disableNextButton} 
                        disableSendButton={!this.state.lastMessageFromUser} 
                        {...this.props}/>
                </div>
            </Grid.Column>
            <Grid.Column width={1}>
                <WozCollection {...wozProps}/>
            </Grid.Column>
            </Grid>
    }
}
