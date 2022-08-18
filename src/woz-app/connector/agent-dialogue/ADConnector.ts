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
import { InteractionAction, InteractionLogs, InteractionType } from "./generated/client_pb"

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
    this.service = new ADConnection(this.model.serverURL)
    return this.service;
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

    this.stream = this.connection.subscribe({
      conversationID: this.model.conversationId,
      onResponse: (response) => {
        if (this.onMessage !== undefined) {
          const reply = response.asTextResponse()
          const message = new Message({ ...reply, id: reply.responseID,  messageType: response.getInteractionList()[0].getType() })
          this.onMessage(message)
        }
      },
      userID: this.model.userId,
    });
    return this.stream;
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

  public connect(params: StringMap): Promise<boolean> {
    if (params.userID !== undefined
      && params.conversationID !== undefined
      && params.serverURL !== undefined) {
      this.model = {
        conversationId: params.conversationID,
        serverURL: params.serverURL,
        userId: params.userID,
      }
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }


  public onButtonClickLogger = (buttonModel: IButtonModel, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[]) => {
    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return
    }

    let interactionLogs = new InteractionLogs();
    if(selectedButtons !== undefined){
      for(let selectedButton of selectedButtons){
        let interactionSource = new InteractionLogs.InteractionSource();
        interactionSource.setPageId(selectedButton.pageId!);
        interactionSource.setPageOrigin(ButtonOrigin[selectedButton.buttonOrigin!]);
        interactionSource.setPageTitle(selectedButton.pageTitle!);
        interactionSource.setSectionTitle(selectedButton.sectionTitle!);
        interactionSource.setParagraphId(selectedButton.paragraphId!);
        interactionSource.setParagraphText(selectedButton.tooltip);
        interactionSource.setEventTimestamp(convertDateToTimestamp(selectedButton.clickedTimestamp!))
        interactionLogs.addInteractionSources(interactionSource);
      }
    }
   
    if(searchedQueries !== undefined){
      for(let query of searchedQueries){
        let searchQuery = new InteractionLogs.SearchQuery();
        searchQuery.setQuery(query.searchedQuery);
        searchQuery.setEventTimestamp(convertDateToTimestamp(query.searchTimestamp));
        interactionLogs.addSearchQueries(searchQuery);
      }
    }

    

    const message = new Message({
      text: buttonModel.tooltip,
      userID: this.model.userId,
      interactionLogs: interactionLogs
    })

    if (this.onMessage !== undefined) {
      this.onMessage(message)
    }

    this.connection.send(message, {
      conversationID: this.model.conversationId,
    })

    log.debug("clicked:", "'" + buttonModel.id + "'", buttonModel.tooltip)
  }


  public onMessageSentLogger = (inputValue: string, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[], interactionType?: InteractionType, actions?: Array<InteractionAction>) => {
    
    if (this.model.userId === undefined
      || this.model.conversationId === undefined) {
      return
    }

    let interactionLogs = new InteractionLogs();
    if(selectedButtons !== undefined){
      for(let selectedButton of selectedButtons){
        let interactionSource = new InteractionLogs.InteractionSource();
        interactionSource.setPageId(selectedButton.pageId!);
        interactionSource.setPageOrigin(ButtonOrigin[selectedButton.buttonOrigin!]);
        interactionSource.setPageTitle(selectedButton.pageTitle!);
        interactionSource.setSectionTitle(selectedButton.sectionTitle!);
        interactionSource.setParagraphId(selectedButton.paragraphId!);
        interactionSource.setParagraphText(selectedButton.tooltip);
        interactionSource.setEventTimestamp(convertDateToTimestamp(selectedButton.clickedTimestamp!))
        interactionLogs.addInteractionSources(interactionSource);
      }
    }
   
    if(searchedQueries !== undefined){
      for(let query of searchedQueries){
        let searchQuery = new InteractionLogs.SearchQuery();
        searchQuery.setQuery(query.searchedQuery);
        searchQuery.setEventTimestamp(convertDateToTimestamp(query.searchTimestamp));
        interactionLogs.addSearchQueries(searchQuery);
      }
    }

    const message = new Message({
      text: inputValue,
      userID: this.model.userId,
      messageType: interactionType,
      actions: actions,
      interactionLogs: interactionLogs
    })

    if (this.onMessage !== undefined) {
      this.onMessage(message)
    }

    this.connection.send(message, {
      conversationID: this.model.conversationId,
    })

    log.debug("value:", "'" + inputValue + "'")
  }

  public onAgentInteractionApiRequest = async (requestBody: Struct, agentName:string): Promise<{[key: string]: JavaScriptValue; }>  => {
    return this.connection.AgentInteractionApi(requestBody, agentName);
  }
}
