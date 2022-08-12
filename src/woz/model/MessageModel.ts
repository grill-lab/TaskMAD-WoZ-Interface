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

import * as uuid from "uuid"
import {PartialBy} from "../../common/util"
import { InteractionLogs, InteractionType } from "../../woz-app/connector/agent-dialogue/generated/client_pb"

export interface IMessage {
  id: string
  text: string
  time: Date
  userID?: string

  interactionLogs?: InteractionLogs
  // Specific type of this message
  messageType?: InteractionType
  actions?: Array<string>
  
}

export const ourUserID = "us"

export type IMessageArgument = PartialBy<IMessage, "time" | "id">

export class Message implements IMessage {
  constructor(argument: IMessageArgument | Date) {
    if (argument instanceof Date) {
      const options = {
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        month: "numeric",
        second: "numeric",
        year: "numeric",
      }
      Object.assign(this, {
        id: uuid.v4(),
        text: new Intl.DateTimeFormat(undefined, options).format(argument),
        time: new Date(),
      })
    } else {
      Object.assign(this, {
        id: uuid.v4(),
        time: new Date(),
        ...argument,
      })
    }
  }

  // noinspection JSUnusedGlobalSymbols
  public readonly id!: string
  // noinspection JSUnusedGlobalSymbols
  public readonly text!: string
  // noinspection JSUnusedGlobalSymbols
  public readonly time!: Date
  // noinspection JSUnusedGlobalSymbols
  public readonly userID?: string

  /**
   * Attributes used to log the wizard interaction associated to this message
   * Notice that we want to keep track of:
   * - Buttons clicked by the wizard (evidence) in order to compose the message
   * - Searched queries done by the wizard while searching for external results 
   * 
   * However, for each button clicked, we want to keep track of several other properties. 
   * As there is no trivial approach to save objects in Firestore, we save the relevant 
   * attributes as lists. Each element at index i will correspond to the specific button 
   * fetures (i.e. each button will have a pageId, paragraphId, origin and Text associated).
   */
  public readonly interactionLogs?: InteractionLogs
  // Type of the specific sent message
  public readonly messageType?: InteractionType
  // Actions to execute in the case InteractionType.ACTION
  public readonly actions?: Array<string>


}


