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

import { SERVER_IP } from "../common/config"
import {IADConnectorModel} from "./connector/agent-dialogue/ADConnector"
import {IVHMSGModel, VHMSG} from "./connector/vhmsg/vhmsg"

export interface IStoredSpreadsheet {
  title: string
  lastAccess: Date
}

interface IStore {
  agentDialogue: IADConnectorModel
  generateScreenNavigation: boolean
  selectedSpreadsheetID?: string
  showChatTranscript: boolean
  knownSpreadsheets: { [s: string]: IStoredSpreadsheet }
  selectedConnectorID?: string
  vhmsg: IVHMSGModel
  topicName: string
}

export class Store implements IStore {

  constructor() {

    // Important!!! Only use constant expressions here.

    let url = process.env["REACT_APP_SPREADSHEET_URL"] as string

    this.defaults = {
      agentDialogue: {
        conversationId: "",
        serverURL: SERVER_IP,
        userId: "",
      },
      generateScreenNavigation: true,
      knownSpreadsheets: {
        [url]: {title: "Topics", lastAccess: new Date()},
      },
      selectedSpreadsheetID: undefined,
      showChatTranscript: true,
      vhmsg: {address: "127.0.0.1", scope: VHMSG.DEFAULT_SCOPE, secure: false},
      topicName: "",
    }

    return new Proxy(this, {
      get: (_target, property): any => {
        if (typeof property !== "string") {
          return undefined
        }
        const value = localStorage.getItem(property)
        if (value !== undefined && value !== null) {
          return JSON.parse(value)
        }
        // @ts-ignore
        return this.defaults[property]
      },

      set: (_target, property, newValue): boolean => {
        if (typeof property !== "string") {
          return false
        }
        localStorage.setItem(property, JSON.stringify(newValue))
        return true
      },
    })
  }

  private readonly defaults: IStore

  public static shared = new Store()

  // @ts-ignore
  public generateScreenNavigation: boolean

  // @ts-ignore
  public showChatTranscript: boolean

  // @ts-ignore
  public selectedSpreadsheetID?: string

  // @ts-ignore
  public knownSpreadsheets: { [s: string]: IStoredSpreadsheet }

  // @ts-ignore
  public selectedConnectorID?: string

  // @ts-ignore
  public vhmsg: IVHMSGModel

  // @ts-ignore
  public agentDialogue: IFirebaseConnectorModel

  // @ts-ignore
  public topicName: string
}
