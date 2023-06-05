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
import {
    IWozCollectionProperties, WozCollection,
} from "../woz/views/WozCollection"
import css from "./App.module.css"
import {WozConnectors} from "./connector/Connector"
import {ChatInput} from "../woz/views/ChatInput"
import { InteractionType } from "./connector/agent-dialogue/generated/client_pb"
import { Store } from "./Store"

export interface IWoZWithCharCollectionProperties extends IWozCollectionProperties {}

interface IWoZWithCharCollectionState {
    dialogue: Dialogue
    disableNextButton: boolean
    stepIndex: number
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
            stepIndex: 1,
            messagesPerStep: new Map<number, number>(),
            dialogue: new Dialogue({messages: []}),
            lastMessageFromUser: true, // default to true to enable sending when initiating a new conversation
        }
    
        // handler for incoming messages
        WozConnectors.shared.selectedConnector.onMessage = (message: Message) => {
            this.setState((prev) => {
                let currentStep = prev.stepIndex
                let lastMessageFromUser = prev.lastMessageFromUser

                // special case when we get a "user joined the chat" message: send back an ACTION
                // message setting the current step 
                if(message.messageType === InteractionType.STATUS && message.text.indexOf('joined the chat') !== -1) {
                    console.log('sending back "set" action message')
                    let actions = Array<string>()
                    actions.push('step' + currentStep)
                    WozConnectors.shared.selectedConnector.onMessageSentLogger('', [], [], InteractionType.ACTION, actions)
                    // update the dialogue object here so the message shows up in the UI
                    // TODO this should only need to update the dialogue entry?
                    return { messagesPerStep: prev.messagesPerStep, stepIndex: prev.stepIndex, disableNextButton: prev.disableNextButton, lastMessageFromUser: prev.lastMessageFromUser, dialogue: prev.dialogue.appending(message, 0) }
                }

                // check if the new message has STATUS type, and if so if it has been sent to indicate that the 
                // chat app moved to the next step. this is currently used to confirm that the woz app should also
                // move to the same step, since this message will be sent after the woz user clicks Next, sending a 
                // message to the chat app (via the backend), updating the chat UI, then replying with a message
                // like this to report the change in state
                if(message.messageType === InteractionType.STATUS && message.text.startsWith("User moved to")) {
                    // the message text will be 'User moved to "Step n".' This just extracts the "n" from the text
                    // so we can update the info panel on this side and keep it in sync with what the user is seeing
                    let text = message.text;
                    currentStep = parseInt(text.substr(text.indexOf("Step") + 5, text.lastIndexOf('"') - text.indexOf('Step') - 5))
                    console.log("Updating stepIndex to " + currentStep)

                    // now we have the step number, need to do some additional state checking/updating. we
                    // maintain a list of the number of messages completed in each step. this is 
                    // required to enable the "Next" button when the minimum required number of message exchanges 
                    // (a single pair of woz and user messages) have been completed for the current step. 
                    // the messagesPerStep state variable contains (step number, message count) key-value pairs
                    // to track this.
                    //
                    // if the current step doesn't already appear in messagesPerStep, need to insert a new entry for it
                    if(!prev.messagesPerStep.has(currentStep) || prev.messagesPerStep.get(currentStep) === -1) {
                        // this loop just ensures we have inserted entries for all steps before the
                        // previous step to keep things consistent. 
                        // TODO probably not needed: this should never normally happen even if we are rejoining
                        // a partially complete conversation, because existing messages effectively get replayed
                        // when the ADConnection is created and so this will be triggered for each existing step
                        // change STATUS message in the order they were originally generated
                        let i = 1;
                        while(i < currentStep) {
                            if(!prev.messagesPerStep.has(i)) {
                                console.log("IN HERE FOR STEP %o", i)
                                prev.messagesPerStep.set(i, this.getMinTurnCountForStep(i) * 2)
                            }
                            i += 1
                        }
                        prev.messagesPerStep.set(currentStep, 0) // no messages so far in the new step
                    }
                } else if (message.messageType === InteractionType.TEXT) {
                    // exchange counting only operates on TEXT messages. when we get a message, we need to 
                    // update the number of exchanges completed in the current step. this is slightly complicated
                    // by the fact that a step change can occur after the wizard sends a message OR after the
                    // user sends a message, e.g. for both:
                    //      - user message
                    //      - step change
                    //      - wizard message
                    //      - user message
                    // and
                    //      - wizard message
                    //      - step change
                    //      - user message
                    //      - wizard message
                    // the pair of messages after the step change would count as a single exchange, subject to
                    // the constraint that messages must always alternate between senders. A further constraint
                    // is that we only want to enable the "Next" button in the UI if it's the wizard's turn.
                    //
                    // Also note that due to the way the messages are sent/received, this method will be called
                    // for incoming AND outgoing messages so we need to check user IDs below

                    // increment the number of messages in the current step
                    if(prev.messagesPerStep.has(currentStep)) {
                        let messagesInStep = prev.messagesPerStep.get(currentStep) as number
                        prev.messagesPerStep.set(currentStep, messagesInStep + 1)
                    } else {
                        prev.messagesPerStep.set(currentStep, 1)
                    }
                    // note that chatUserID here is the *wizard* user ID!
                    lastMessageFromUser = !(message.userID === WozConnectors.shared.selectedConnector.chatUserID)
                    console.log("count now %o from message %o, from user = %o", prev.messagesPerStep.get(currentStep) as number, message, lastMessageFromUser)
                }

                let disableNextButton = true

                // get the number of individual messages in the current step
                let messagesInStep = prev.messagesPerStep.get(currentStep) as number

                // need to decide if the Next button in the UI should currently be enabled or disabled. the condition for this 
                // is that the number of "message exchanges" in the current step should be greater than or equal to the threshold
                // set in the "min_message_exchange" key in the topic JSON data. an additional condition is that the button
                // should only be enabled if it is the wizard's turn, meaning that the last message received was from the chat user.
                // since message exchanges are pairs of messages, want to check if the number of messages divided by 2 is above the
                // threshold set in the JSON data
                if(Math.floor(messagesInStep / 2) >= this.getMinTurnCountForStep(currentStep)) {
                    console.log("min turn count of %o (%o) reached for step %o", this.getMinTurnCountForStep(currentStep), messagesInStep, currentStep)
                    
                    // knowing the number of message exchanges is sufficient to enable the button, set the
                    // state depending on whether its our turn or not (only enable the button if it is). 
                    // however we ALSO need to consider the case where we've gone back to a previous step.
                    // in that case I think the button should always be enabled even if the last message
                    // was from the wizard?
                    const highestStep = Math.max(...prev.messagesPerStep.keys())
                    if(currentStep !== highestStep)
                        disableNextButton = false
                    else
                        disableNextButton = !lastMessageFromUser
                }
                
                // TODO this should also check the this.props.wozMessage value which contains the current text in the input
                // box. If the length is 0 then the button should remain disabled
                //console.log("wozMessage %o", this.props.wozMessage)
                console.log({ messagesPerStep: prev.messagesPerStep, stepIndex: currentStep, disableNextButton: disableNextButton, lastMessageFromUser: lastMessageFromUser})
                return { messagesPerStep: prev.messagesPerStep, stepIndex: currentStep, disableNextButton: disableNextButton, lastMessageFromUser: lastMessageFromUser, dialogue: prev.dialogue.appending(message, 0) }
            })
        }
    }

    private getContent(): string {
        // retrieve side-panel text content for the selected topic and step number
        let ad = Store.shared.agentDialogue
        if(ad !== undefined) {
            if("steps_sentences_wizard" in this.props.topicData) {
                // step indices in the messages are 1-n
                return this.props.topicData["steps_sentences_wizard"][this.state.stepIndex - 1]
            }
        }
        return ""
    }

    private getMinTurnCountForStep(stepNumber: number): number {
        // returns the value of the min_message_exchange array for the current
        // step number (note that the parameter is assumed to be 1-n, not 0-(n-1))
        if("min_message_exchange" in this.props.topicData) {
            // console.log("minTurnCount for %o is %o", stepNumber, this.props.topicData["min_message_exchange"][stepNumber-1])
            return this.props.topicData["min_message_exchange"][stepNumber - 1]
        }
        return -1
    }

    public render() {
        const { ...wozProps } = this.props

        return <Grid id={css.appGroupId}>
            <Grid.Column width={5}>
                <div className={css.flex_container}>
                    <div className={css.info_box}>
                        <Container className={css.recipeComponentContainer} textAlign='left'>
                            <div dangerouslySetInnerHTML={{__html: this.getContent()}}></div>
                        </Container>
                    </div>
                    <ChatComponent dialogue={this.state.dialogue} disableNextButton={this.state.disableNextButton} disableSendButton={!this.state.lastMessageFromUser} {...this.props}/>
                </div>
            </Grid.Column>
            <Grid.Column width={11}>
                <WozCollection {...wozProps}/>
            </Grid.Column>
            </Grid>
    }
}
