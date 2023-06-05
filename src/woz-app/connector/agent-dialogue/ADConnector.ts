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
import { InteractionType } from "./generated/client_pb"

export interface IADConnectorModel {
  readonly conversationId?: string
  readonly serverURL: string
  readonly userId?: string
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
  }

  private service?: ADConnection
  private stream?: ISubscription

  public readonly id: string

  public readonly title: string

  public get props(): { [index: string]: any | undefined } {
    return {
      connector: this.id,
      conversationID: this._model.conversationId,
      serverURL: this._model.serverURL,
      userID: this._model.userId,
    }
  }

  public onMessage?: (message: IMessage) => void

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
          const message = new Message({ ...reply, id: reply.responseID,  messageType: response.getInteractionList()[0].getType() })

          this.onMessage(message)
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


  public onMessageSentLogger = (inputValue: string, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[], interactionType?: InteractionType, actions?: Array<string>) => {
    
    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return
    }

    const message = new Message({
      text: inputValue,
      userID: this.model.userId,
      messageType: interactionType,
      actions: actions,
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

    // log.debug("value:", "'" + inputValue + "'")
  }

  public onAgentInteractionApiRequest = async (requestBody: Struct, agentName:string): Promise<{[key: string]: JavaScriptValue; }>  => {
    return await this.connection.AgentInteractionApi(requestBody, agentName);
  }
}
