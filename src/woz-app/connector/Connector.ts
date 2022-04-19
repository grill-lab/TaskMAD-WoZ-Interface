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
import {IButtonModel} from "../../woz/model/ButtonModel"
import {IMessage} from "../../woz/model/MessageModel"
import { SearchQueryModel } from "../../woz/model/SearchQueryModel"
import {StringMap} from "../App"
import {Store} from "../Store"
import {ADConnector} from "./agent-dialogue/ADConnector"
import { InteractionType, LoggedCastQueryRewrite, LoggedCastSearcherSelection } from "./agent-dialogue/generated/client_pb"
import {ConsoleConnector} from "./console/ConsoleConnector"
import {VHMSGConnector} from "./vhmsg/VHMSGConnector"

export interface IWozConnector {
  readonly id: string
  readonly title: string
  readonly chatUserID: string
  readonly props: { [index: string]: any | undefined }

  onMessage?: (message: IMessage) => void

  connect(params: StringMap): Promise<boolean>

  component(): any

  onButtonClick(buttonModel: IButtonModel): void

  onUIAppear(): void

  // Method used in order to handle button clicks and relative logging 
  // of selectedButtons and searchedQueries associated to that message
  onButtonClickLogger(buttonModel: IButtonModel, selectedButtons:Array<IButtonModel>, searchedQueries: Array<SearchQueryModel>): void

  // Method used in order to handle the inputform submit button and relative logging 
  // of selectedButtons and searchedQueries associated to that message
  onMessageSentLogger(
    inputValue: string,
    selectedButtons:Array<IButtonModel>,
    searchedQueries: Array<SearchQueryModel>,
    interactionType?: InteractionType,
    actions?: Array<string>,
    loggedCastSearcherSelection?: LoggedCastSearcherSelection[],
    loggedCastQueryRewrite?: LoggedCastQueryRewrite[]): void

  onAgentInteractionApiRequest(requestBody: Struct, agentName:string): Promise<{[key: string]: JavaScriptValue; }>
}

export class WozConnectors {

  public get selectedConnectorID(): string {
    const currentID = Store.shared.selectedConnectorID !== undefined
                      ? Store.shared.selectedConnectorID : this.all[0].id
    return this.all.find(
        (c) => c.id === currentID) !== undefined
           ? currentID : this.all[0].id
  }
  // noinspection JSMethodCanBeStatic
  public set selectedConnectorID(newValue: string) {
    Store.shared.selectedConnectorID = newValue
  }

  public get selectedConnector(): IWozConnector {
    const connector = this.all.find((c) => c.id === this.selectedConnectorID)
    if (connector !== undefined) {
      return connector
    }
    return this.all[0]
  }

  constructor() {
    this.all = [
      new ConsoleConnector(),
      new ADConnector(),
      new VHMSGConnector(),
    ]
  }

  public static shared = new WozConnectors()

  public readonly all: IWozConnector[]
}
