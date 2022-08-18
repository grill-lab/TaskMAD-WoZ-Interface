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
import {log} from "../../../common/Logger"
import {IButtonModel} from "../../../woz/model/ButtonModel"
import {IMessage, Message, ourUserID} from "../../../woz/model/MessageModel"
import { SearchQueryModel } from "../../../woz/model/SearchQueryModel"
import {StringMap} from "../../App"
import { InteractionAction, InteractionType } from "../agent-dialogue/generated/client_pb"
import {IWozConnector} from "../Connector"
import {ConsoleConnectorComponent} from "./ConsoleConnectorComponent"

export class ConsoleConnector implements IWozConnector {

  constructor() {
    this.id = "ConsoleConnector"
    this.title = "None"
  }

  public readonly id: string

  public readonly title: string

  public onMessage?: (message: IMessage) => void

  public get props(): { [index: string]: any | undefined } {
    return {
      connector: this.id,
    }
  }

  public component = (): any => {
    return React.createElement(ConsoleConnectorComponent, {}, null)
  }

  // noinspection JSUnusedGlobalSymbols
  public onButtonClick = (buttonModel: IButtonModel) => {
    log.debug("clicked:", buttonModel)

    const onMessage = this.onMessage
    if (onMessage !== undefined) {
      onMessage(new Message({
        text: "clicked: " + buttonModel, userID: ourUserID}))
    }
  }

  public onUIAppear = (): void => {
    // empty
  }

  public connect(_params: StringMap): Promise<boolean> {
    return new Promise((resolve) => {resolve(true)})
  }

  public get chatUserID(): string {
    return ourUserID
  }

  public onButtonClickLogger = (buttonModel: IButtonModel, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[]) => {
    console.log(selectedButtons);
    console.log(searchedQueries);
    console.log(buttonModel);
  }


  public onMessageSentLogger = (inputValue: string, selectedButtons?: IButtonModel[], searchedQueries?: SearchQueryModel[], interactionType?: InteractionType, actions?: Array<InteractionAction>) => {
    console.log(selectedButtons);
    console.log(searchedQueries);
    console.log(inputValue);
    console.log(interactionType);
    console.log(actions);
    
    
  }

  public onAgentInteractionApiRequest = async (requestBody: Struct, agentName: string): Promise<{[key: string]: JavaScriptValue; }> => {
    console.log(requestBody);
    console.log(agentName);
    
    return JSON.parse("");
  }
}
