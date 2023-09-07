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

import { JavaScriptValue, Struct } from "google-protobuf/google/protobuf/struct_pb"
import * as React from "react"
import { log } from "../../../common/Logger"
import { convertDateToTimestamp } from "../../../common/util"
import { ButtonOrigin, IButtonModel } from "../../../woz/model/ButtonModel"
import { IMessage, Message, ourUserID } from "../../../woz/model/MessageModel"
import { SearchQueryModel } from "../../../woz/model/SearchQueryModel"
import { StringMap } from "../../App"
import { Store } from "../../Store"
import { IWozConnector } from "../Connector"
import { ADConnection, ISubscription } from "./ADConnection"
import { ADConnectorComponent } from "./ADConnectorComponent"
import { InteractionType, InteractionRole } from "./generated/client_pb"


export interface IADConnectorModel {
  readonly conversationId?: string
  readonly serverURL: string
  readonly userId?: string
}

export class LLMResponseData {
    message: string = "";
    role: string = "assistant";
    stepNo: number = 0;
}

export class LLMResponse {
    message: string = "";
    status: string = "";
    data: LLMResponseData = new LLMResponseData();
}

/*
 URL arguments

 connector=ADConnector
 serverURL=
 conversationID=
 userID=
 */

export class ADConnector implements IWozConnector {
  constructor() {
    this.id = "ADConnector"
    this.title = "Agent Dialogue"
    this._model = Store.shared.agentDialogue
    this.lastMessageFromUser = false;
    this.timerID = setTimeout(this.messageChecker, 0);
    this.waitingForLLM = false;
  }

  private service?: ADConnection
  private stream?: ISubscription

  public readonly id: string

  public readonly title: string

  public lastMessageFromUser: boolean
  public timerID : ReturnType<typeof setTimeout>
  public waitingForLLM: boolean

  public get props(): { [index: string]: any | undefined } {
    return {
      connector: this.id,
      conversationID: this._model.conversationId,
      serverURL: this._model.serverURL,
      userID: this._model.userId,
    }
  }

  public onMessage?: (message: IMessage) => void
  public onLLMRequest?: () => void
  public onLLMResponse?: (response: LLMResponseData) => void

  public _model: IADConnectorModel

  public component = (): any => {
    return React.createElement(
      ADConnectorComponent, { connector: this }, null)
  }

  // noinspection JSUnusedGlobalSymbols
  public onUIAppear = (): void => {
    this.subscribe()
  }

  public get connection(): ADConnection {
    if (this.service !== undefined) {
      if (this.service.hostURL === this.model.serverURL) {
        return this.service
      }
      this.service.terminate()
    }
    return this.service = new ADConnection(this.model.serverURL)
  }

  public get model(): IADConnectorModel {
    return this._model
  }

  public set model(value: IADConnectorModel) {
    if (value.userId === this.model.userId
      && value.conversationId === this.model.conversationId
      && value.serverURL === this.model.serverURL) {
      return
    }

    if (this.stream !== undefined) {
      this.stream.invalidate()
      this.stream = undefined
    }

    if (this.service !== undefined) {
      this.service.terminate()
      this.service = undefined
    }

    this._model = value
  }

  public get chatUserID(): string {
    return this._model.userId || ourUserID
  }

  public messageChecker = () => {
    clearTimeout(this.timerID);
    console.log("last message %o", this.lastMessageFromUser);
    if(this.lastMessageFromUser) {
        // we haven't received a message in several seconds and the last
        // message that was sent was from the user, so resend the last
        // message to the LLM API
        console.log("Sending a previous message to the LLM API");
        this.sendLLMRequest();
    }
  }

  public sendLLMRequest = () => {
    console.log("SENDING LLM REQUEST")
    if(this.onLLMRequest !== undefined) {
        this.onLLMRequest();
    }
    this.waitingForLLM = true;
    // could call the existing onAgentInteractionApiRequest method to do this, but as 
    // written that "awaits" a response. since the call to the LLM might take many seconds
    // in some instances and we don't want to block the UI in the meantime, this instead
    // calls AgentInteractionApi directly. That method is async and returns a Promise, and
    // the "then" callback handler is triggered with the result of the request.
    // TODO: error handling
    // The API endpoint info is configured in the backend, so all we need to send is
    // the request_body parameter, and at the moment this is a simple JSON blob that
    // contains the current conversationId
    let apiResponse: Object = this.connection.AgentInteractionApi(Struct.fromJavaScript({
        "request_body": {
            "conversationID": this.model.conversationId
        }
    }), "LLMAgent").then((result => {
        this.waitingForLLM = false;
        console.log("Result from LLM %o", result)
        const llmresp: LLMResponse = Object.assign(new LLMResponse(), result)
        console.log("Parsed %o", llmresp)
        if(this.onLLMResponse !== undefined) {
            // the response has a "status" field which should normally be set to
            // "success" if the response is valid
            if(llmresp.status === "success") {
                this.onLLMResponse(llmresp.data)
            } else {
                console.warn("LLM response not successful");
                // not sure how to handle this? for now return a "fix this yourself"
                // message to the user
                const llmdata = new LLMResponseData();
                llmdata.message = "Failed to generate a response! Please replace this text with a suitable response of your own";
                llmdata.stepNo = -1;
                llmdata.role = "assistant";
                this.onLLMResponse(llmdata);
            }
        }
    })).catch((error => {
        this.waitingForLLM = false;
        console.error("LLM API call failed: %o", error);
        const llmdata = new LLMResponseData();
        llmdata.message = "Failed to generate a response! Please replace this text with a suitable response of your own";
        llmdata.stepNo = -1;
        llmdata.role = "assistant";
        if(this.onLLMResponse !== undefined) {
            this.onLLMResponse(llmdata);
        }
    }))
  }

  public subscribe = (): ISubscription | undefined => {
    if (this.stream !== undefined) { return this.stream }

    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return undefined
    }

    return this.stream = this.connection.subscribe({
      conversationID: this.model.conversationId,
      onResponse: (response) => {
        if (this.onMessage !== undefined) {
          const reply = response.asTextResponse()
          const message = new Message({ ...reply, id: reply.responseID,  messageType: response.getInteractionList()[0].getType(), interactionTime: reply.interactionTime, role: reply.role})

          this.onMessage(message)
          if(message.messageType === InteractionType.TEXT) {
              this.lastMessageFromUser = this.model.userId !== message.userID;
          }
          // When a message is received here from the chat app, we now need to forward it to the LLM
          // API to generate an initial response. However when resuming a conversation, this callback
          // will be triggered for every message as they are replayed from the Firestore database. So
          // to ensure we only send requests to the LLM API when we should, we need to check that:
          //   a) the new message has TEXT type
          //   b) it comes from the chat user 
          //   c) it has a timestamp within 10? seconds of the current time 
          // Note: the Message objects are supposed to have their .time field populated from the .time field of the incoming
          // InteractionResponse protos, but it seems like this field isn't being set correctly. For now relying on the
          // .interaction_time field in the OutputInteraction object inside the InteractionResponse
          const messageTimestampLimit = 15
          const messageTimestampDiff = (Date.now() - message.interactionTime.getTime()) / 1000
          if(message.messageType === InteractionType.TEXT && message.userID !== this.model.userId && messageTimestampDiff < messageTimestampLimit) {
              this.sendLLMRequest();
          } else if (message.messageType === InteractionType.TEXT && message.userID !== this.model.userId && messageTimestampDiff >= messageTimestampLimit) {
              console.log("Not sending LLM message because timestamp diff is %o", messageTimestampDiff)
              clearTimeout(this.timerID);
              this.timerID = setTimeout(this.messageChecker, 5000);
          }
        }
      },
      userID: this.model.userId,
    })
  }

  // noinspection JSUnusedGlobalSymbols
  public onButtonClick = (buttonModel: IButtonModel) => {

    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return
    }

    const message = new Message({
      text: buttonModel.tooltip,
      userID: this.model.userId,
    })

    if (this.onMessage !== undefined) {
      this.onMessage(message)
    }

    this.connection.send(message, {
      conversationID: this.model.conversationId,
    })

    log.debug("clicked:", "'" + buttonModel.id + "'", buttonModel.tooltip)
  }

  public async connect(params: StringMap): Promise<boolean> {

      if (params.userID !== undefined
      && params.conversationID !== undefined
      && params.serverURL !== undefined) {
      this.model = {
        conversationId: params.conversationID,
        serverURL: params.serverURL,
        userId: params.userID,
      }
      return new Promise((resolve) => { resolve(true) })
    }
    return new Promise((resolve) => { resolve(false) })
  }


  public onButtonClickLogger = (buttonModel: IButtonModel, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[]) => {
    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return
    }

    const message = new Message({
      text: buttonModel.tooltip,
      userID: this.model.userId,
      loggedSearchQueries: searchedQueries !== undefined ? searchedQueries.map((selectedQuery) => {
        return selectedQuery.searchedQuery !== undefined ? selectedQuery.searchedQuery : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedSearchQueriesTimestamp: searchedQueries !== undefined ? searchedQueries.map((selectedQuery) => {
        return selectedQuery.searchTimestamp !== undefined ? convertDateToTimestamp(selectedQuery.searchTimestamp) : convertDateToTimestamp(new Date())
      }).filter((el) => {
        return el !== null
      }) : [],
      loggedPageIds: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.pageId !== undefined ? selectedButton.pageId : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedParagraphIds: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.paragraphId !== undefined ? selectedButton.paragraphId : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedParagraphTexts: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.tooltip !== undefined ? selectedButton.tooltip : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedPageOrigins: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.buttonOrigin !== undefined ? ButtonOrigin[selectedButton.buttonOrigin] : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedPageTitles: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.pageTitle !== undefined ? selectedButton.pageTitle : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedSectionTitles: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.sectionTitle !== undefined ? selectedButton.sectionTitle : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedParagraphTimestamp: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.clickedTimestamp !== undefined ? convertDateToTimestamp(selectedButton.clickedTimestamp) : convertDateToTimestamp(new Date())
      }).filter((el) => {
        return el !== null
      }) : [],
    })

    if (this.onMessage !== undefined) {
      this.onMessage(message)
    }

    this.connection.send(message, {
      conversationID: this.model.conversationId,
    })

    log.debug("clicked:", "'" + buttonModel.id + "'", buttonModel.tooltip)
  }


  public onMessageSentLogger = (inputValue: string, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[], interactionType?: InteractionType, actions?: Array<string>, role?: InteractionRole) => {
    
    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return
    }

    const message = new Message({
      text: inputValue,
      userID: this.model.userId,
      messageType: interactionType,
      actions: actions,
      role: role,
      loggedSearchQueries: searchedQueries !== undefined ? searchedQueries.map((selectedQuery) => {
        return selectedQuery.searchedQuery !== undefined ? selectedQuery.searchedQuery : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedSearchQueriesTimestamp: searchedQueries !== undefined ? searchedQueries.map((selectedQuery) => {
        return selectedQuery.searchTimestamp !== undefined ? convertDateToTimestamp(selectedQuery.searchTimestamp) : convertDateToTimestamp(new Date())
      }).filter((el) => {
        return el !== null
      }) : [],
      loggedPageIds: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.pageId !== undefined ? selectedButton.pageId : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedParagraphIds: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.paragraphId !== undefined ? selectedButton.paragraphId : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedParagraphTexts: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.tooltip !== undefined ? selectedButton.tooltip : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedPageOrigins: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.buttonOrigin !== undefined ? ButtonOrigin[selectedButton.buttonOrigin] : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedPageTitles: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.pageTitle !== undefined ? selectedButton.pageTitle : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedSectionTitles: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.sectionTitle !== undefined ? selectedButton.sectionTitle : ''
      }).filter((el) => {
        return el !== ''
      }) : [],
      loggedParagraphTimestamp: selectedButtons !== undefined ? selectedButtons.map((selectedButton) => {
        return selectedButton.clickedTimestamp !== undefined ? convertDateToTimestamp(selectedButton.clickedTimestamp) : convertDateToTimestamp(new Date())
      }).filter((el) => {
        return el !== null
      }) : [],
    })

    if (this.onMessage !== undefined) {
      //   console.log("calling onMessage with %o", message)
      // this.onMessage(message)
    }

    this.connection.send(message, {
      conversationID: this.model.conversationId,
    })

     //log.debug("value:", "'" + inputValue + "'")
  }

  public onAgentInteractionApiRequest = async (requestBody: Struct, agentName:string): Promise<{[key: string]: JavaScriptValue; }>  => {
    return await this.connection.AgentInteractionApi(requestBody, agentName);
  }
}
