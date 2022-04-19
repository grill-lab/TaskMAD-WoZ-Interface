import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';


export class ClientConversation extends jspb.Message {
  getTurnList(): Array<ClientTurn>;
  setTurnList(value: Array<ClientTurn>): ClientConversation;
  clearTurnList(): ClientConversation;
  addTurn(value?: ClientTurn, index?: number): ClientTurn;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientConversation.AsObject;
  static toObject(includeInstance: boolean, msg: ClientConversation): ClientConversation.AsObject;
  static serializeBinaryToWriter(message: ClientConversation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientConversation;
  static deserializeBinaryFromReader(message: ClientConversation, reader: jspb.BinaryReader): ClientConversation;
}

export namespace ClientConversation {
  export type AsObject = {
    turnList: Array<ClientTurn.AsObject>,
  }
}

export class ClientTurn extends jspb.Message {
  getInteractionRequest(): InteractionRequest | undefined;
  setInteractionRequest(value?: InteractionRequest): ClientTurn;
  hasInteractionRequest(): boolean;
  clearInteractionRequest(): ClientTurn;

  getInteractionResponse(): InteractionResponse | undefined;
  setInteractionResponse(value?: InteractionResponse): ClientTurn;
  hasInteractionResponse(): boolean;
  clearInteractionResponse(): ClientTurn;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClientTurn.AsObject;
  static toObject(includeInstance: boolean, msg: ClientTurn): ClientTurn.AsObject;
  static serializeBinaryToWriter(message: ClientTurn, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClientTurn;
  static deserializeBinaryFromReader(message: ClientTurn, reader: jspb.BinaryReader): ClientTurn;
}

export namespace ClientTurn {
  export type AsObject = {
    interactionRequest?: InteractionRequest.AsObject,
    interactionResponse?: InteractionResponse.AsObject,
  }
}

export class InteractionRequest extends jspb.Message {
  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): InteractionRequest;
  hasTime(): boolean;
  clearTime(): InteractionRequest;

  getClientId(): ClientId;
  setClientId(value: ClientId): InteractionRequest;

  getInteraction(): InputInteraction | undefined;
  setInteraction(value?: InputInteraction): InteractionRequest;
  hasInteraction(): boolean;
  clearInteraction(): InteractionRequest;

  getUserId(): string;
  setUserId(value: string): InteractionRequest;

  getAgentRequestParameters(): google_protobuf_struct_pb.Struct | undefined;
  setAgentRequestParameters(value?: google_protobuf_struct_pb.Struct): InteractionRequest;
  hasAgentRequestParameters(): boolean;
  clearAgentRequestParameters(): InteractionRequest;

  getChosenAgentsList(): Array<string>;
  setChosenAgentsList(value: Array<string>): InteractionRequest;
  clearChosenAgentsList(): InteractionRequest;
  addChosenAgents(value: string, index?: number): InteractionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InteractionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InteractionRequest): InteractionRequest.AsObject;
  static serializeBinaryToWriter(message: InteractionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InteractionRequest;
  static deserializeBinaryFromReader(message: InteractionRequest, reader: jspb.BinaryReader): InteractionRequest;
}

export namespace InteractionRequest {
  export type AsObject = {
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    clientId: ClientId,
    interaction?: InputInteraction.AsObject,
    userId: string,
    agentRequestParameters?: google_protobuf_struct_pb.Struct.AsObject,
    chosenAgentsList: Array<string>,
  }
}

export class InteractionResponse extends jspb.Message {
  getResponseId(): string;
  setResponseId(value: string): InteractionResponse;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): InteractionResponse;
  hasTime(): boolean;
  clearTime(): InteractionResponse;

  getClientId(): ClientId;
  setClientId(value: ClientId): InteractionResponse;

  getInteractionList(): Array<OutputInteraction>;
  setInteractionList(value: Array<OutputInteraction>): InteractionResponse;
  clearInteractionList(): InteractionResponse;
  addInteraction(value?: OutputInteraction, index?: number): OutputInteraction;

  getMessageStatus(): InteractionResponse.ClientMessageStatus;
  setMessageStatus(value: InteractionResponse.ClientMessageStatus): InteractionResponse;

  getErrorMessage(): string;
  setErrorMessage(value: string): InteractionResponse;

  getUserId(): string;
  setUserId(value: string): InteractionResponse;

  getSessionId(): string;
  setSessionId(value: string): InteractionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InteractionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: InteractionResponse): InteractionResponse.AsObject;
  static serializeBinaryToWriter(message: InteractionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InteractionResponse;
  static deserializeBinaryFromReader(message: InteractionResponse, reader: jspb.BinaryReader): InteractionResponse;
}

export namespace InteractionResponse {
  export type AsObject = {
    responseId: string,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    clientId: ClientId,
    interactionList: Array<OutputInteraction.AsObject>,
    messageStatus: InteractionResponse.ClientMessageStatus,
    errorMessage: string,
    userId: string,
    sessionId: string,
  }

  export enum ClientMessageStatus { 
    NONSET = 0,
    SUCCESSFUL = 1,
    ERROR = 2,
  }
}

export class InputInteraction extends jspb.Message {
  getText(): string;
  setText(value: string): InputInteraction;

  getAudioBytes(): string;
  setAudioBytes(value: string): InputInteraction;

  getActionList(): Array<string>;
  setActionList(value: Array<string>): InputInteraction;
  clearActionList(): InputInteraction;
  addAction(value: string, index?: number): InputInteraction;

  getType(): InteractionType;
  setType(value: InteractionType): InputInteraction;

  getDeviceType(): string;
  setDeviceType(value: string): InputInteraction;

  getLanguageCode(): string;
  setLanguageCode(value: string): InputInteraction;

  getLoggedSearchQueriesList(): Array<string>;
  setLoggedSearchQueriesList(value: Array<string>): InputInteraction;
  clearLoggedSearchQueriesList(): InputInteraction;
  addLoggedSearchQueries(value: string, index?: number): InputInteraction;

  getLoggedSearchQueriesTimestampList(): Array<number>;
  setLoggedSearchQueriesTimestampList(value: Array<number>): InputInteraction;
  clearLoggedSearchQueriesTimestampList(): InputInteraction;
  addLoggedSearchQueriesTimestamp(value: number, index?: number): InputInteraction;

  getLoggedPageIdsList(): Array<string>;
  setLoggedPageIdsList(value: Array<string>): InputInteraction;
  clearLoggedPageIdsList(): InputInteraction;
  addLoggedPageIds(value: string, index?: number): InputInteraction;

  getLoggedParagraphIdsList(): Array<string>;
  setLoggedParagraphIdsList(value: Array<string>): InputInteraction;
  clearLoggedParagraphIdsList(): InputInteraction;
  addLoggedParagraphIds(value: string, index?: number): InputInteraction;

  getLoggedParagraphTextsList(): Array<string>;
  setLoggedParagraphTextsList(value: Array<string>): InputInteraction;
  clearLoggedParagraphTextsList(): InputInteraction;
  addLoggedParagraphTexts(value: string, index?: number): InputInteraction;

  getLoggedPageOriginsList(): Array<string>;
  setLoggedPageOriginsList(value: Array<string>): InputInteraction;
  clearLoggedPageOriginsList(): InputInteraction;
  addLoggedPageOrigins(value: string, index?: number): InputInteraction;

  getLoggedPageTitlesList(): Array<string>;
  setLoggedPageTitlesList(value: Array<string>): InputInteraction;
  clearLoggedPageTitlesList(): InputInteraction;
  addLoggedPageTitles(value: string, index?: number): InputInteraction;

  getLoggedSectionTitlesList(): Array<string>;
  setLoggedSectionTitlesList(value: Array<string>): InputInteraction;
  clearLoggedSectionTitlesList(): InputInteraction;
  addLoggedSectionTitles(value: string, index?: number): InputInteraction;

  getLoggedParagraphTimestampList(): Array<number>;
  setLoggedParagraphTimestampList(value: Array<number>): InputInteraction;
  clearLoggedParagraphTimestampList(): InputInteraction;
  addLoggedParagraphTimestamp(value: number, index?: number): InputInteraction;

  getLoggedUserRecipePageIdsList(): Array<string>;
  setLoggedUserRecipePageIdsList(value: Array<string>): InputInteraction;
  clearLoggedUserRecipePageIdsList(): InputInteraction;
  addLoggedUserRecipePageIds(value: string, index?: number): InputInteraction;

  getLoggedUserRecipePageTitleList(): Array<string>;
  setLoggedUserRecipePageTitleList(value: Array<string>): InputInteraction;
  clearLoggedUserRecipePageTitleList(): InputInteraction;
  addLoggedUserRecipePageTitle(value: string, index?: number): InputInteraction;

  getLoggedUserRecipeSectionList(): Array<string>;
  setLoggedUserRecipeSectionList(value: Array<string>): InputInteraction;
  clearLoggedUserRecipeSectionList(): InputInteraction;
  addLoggedUserRecipeSection(value: string, index?: number): InputInteraction;

  getLoggedUserRecipeSectionValueList(): Array<string>;
  setLoggedUserRecipeSectionValueList(value: Array<string>): InputInteraction;
  clearLoggedUserRecipeSectionValueList(): InputInteraction;
  addLoggedUserRecipeSectionValue(value: string, index?: number): InputInteraction;

  getLoggedUserRecipeSelectTimestampList(): Array<number>;
  setLoggedUserRecipeSelectTimestampList(value: Array<number>): InputInteraction;
  clearLoggedUserRecipeSelectTimestampList(): InputInteraction;
  addLoggedUserRecipeSelectTimestamp(value: number, index?: number): InputInteraction;

  getLoggedCastQueryRewriteList(): Array<LoggedCastQueryRewrite>;
  setLoggedCastQueryRewriteList(value: Array<LoggedCastQueryRewrite>): InputInteraction;
  clearLoggedCastQueryRewriteList(): InputInteraction;
  addLoggedCastQueryRewrite(value?: LoggedCastQueryRewrite, index?: number): LoggedCastQueryRewrite;

  getLoggedCastSearcherSelectionList(): Array<LoggedCastSearcherSelection>;
  setLoggedCastSearcherSelectionList(value: Array<LoggedCastSearcherSelection>): InputInteraction;
  clearLoggedCastSearcherSelectionList(): InputInteraction;
  addLoggedCastSearcherSelection(value?: LoggedCastSearcherSelection, index?: number): LoggedCastSearcherSelection;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InputInteraction.AsObject;
  static toObject(includeInstance: boolean, msg: InputInteraction): InputInteraction.AsObject;
  static serializeBinaryToWriter(message: InputInteraction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InputInteraction;
  static deserializeBinaryFromReader(message: InputInteraction, reader: jspb.BinaryReader): InputInteraction;
}

export namespace InputInteraction {
  export type AsObject = {
    text: string,
    audioBytes: string,
    actionList: Array<string>,
    type: InteractionType,
    deviceType: string,
    languageCode: string,
    loggedSearchQueriesList: Array<string>,
    loggedSearchQueriesTimestampList: Array<number>,
    loggedPageIdsList: Array<string>,
    loggedParagraphIdsList: Array<string>,
    loggedParagraphTextsList: Array<string>,
    loggedPageOriginsList: Array<string>,
    loggedPageTitlesList: Array<string>,
    loggedSectionTitlesList: Array<string>,
    loggedParagraphTimestampList: Array<number>,
    loggedUserRecipePageIdsList: Array<string>,
    loggedUserRecipePageTitleList: Array<string>,
    loggedUserRecipeSectionList: Array<string>,
    loggedUserRecipeSectionValueList: Array<string>,
    loggedUserRecipeSelectTimestampList: Array<number>,
    loggedCastQueryRewriteList: Array<LoggedCastQueryRewrite.AsObject>,
    loggedCastSearcherSelectionList: Array<LoggedCastSearcherSelection.AsObject>,
  }
}

export class OutputInteraction extends jspb.Message {
  getText(): string;
  setText(value: string): OutputInteraction;

  getAudioBytes(): string;
  setAudioBytes(value: string): OutputInteraction;

  getActionList(): Array<string>;
  setActionList(value: Array<string>): OutputInteraction;
  clearActionList(): OutputInteraction;
  addAction(value: string, index?: number): OutputInteraction;

  getType(): InteractionType;
  setType(value: InteractionType): OutputInteraction;

  getResultList(): Array<Result>;
  setResultList(value: Array<Result>): OutputInteraction;
  clearResultList(): OutputInteraction;
  addResult(value?: Result, index?: number): Result;

  getUnstructuredResult(): google_protobuf_struct_pb.Struct | undefined;
  setUnstructuredResult(value?: google_protobuf_struct_pb.Struct): OutputInteraction;
  hasUnstructuredResult(): boolean;
  clearUnstructuredResult(): OutputInteraction;

  getInteractionTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setInteractionTime(value?: google_protobuf_timestamp_pb.Timestamp): OutputInteraction;
  hasInteractionTime(): boolean;
  clearInteractionTime(): OutputInteraction;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OutputInteraction.AsObject;
  static toObject(includeInstance: boolean, msg: OutputInteraction): OutputInteraction.AsObject;
  static serializeBinaryToWriter(message: OutputInteraction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OutputInteraction;
  static deserializeBinaryFromReader(message: OutputInteraction, reader: jspb.BinaryReader): OutputInteraction;
}

export namespace OutputInteraction {
  export type AsObject = {
    text: string,
    audioBytes: string,
    actionList: Array<string>,
    type: InteractionType,
    resultList: Array<Result.AsObject>,
    unstructuredResult?: google_protobuf_struct_pb.Struct.AsObject,
    interactionTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class Result extends jspb.Message {
  getId(): string;
  setId(value: string): Result;

  getScore(): number;
  setScore(value: number): Result;

  getRank(): number;
  setRank(value: number): Result;

  getTitle(): string;
  setTitle(value: string): Result;

  getShortDescription(): string;
  setShortDescription(value: string): Result;

  getFullText(): string;
  setFullText(value: string): Result;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Result.AsObject;
  static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
  static serializeBinaryToWriter(message: Result, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Result;
  static deserializeBinaryFromReader(message: Result, reader: jspb.BinaryReader): Result;
}

export namespace Result {
  export type AsObject = {
    id: string,
    score: number,
    rank: number,
    title: string,
    shortDescription: string,
    fullText: string,
  }
}

export class LoggedCastQueryRewrite extends jspb.Message {
  getId(): string;
  setId(value: string): LoggedCastQueryRewrite;

  getContent(): LoggedCastQueryRewrite.LoggedCastQueryRewriteContent | undefined;
  setContent(value?: LoggedCastQueryRewrite.LoggedCastQueryRewriteContent): LoggedCastQueryRewrite;
  hasContent(): boolean;
  clearContent(): LoggedCastQueryRewrite;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoggedCastQueryRewrite.AsObject;
  static toObject(includeInstance: boolean, msg: LoggedCastQueryRewrite): LoggedCastQueryRewrite.AsObject;
  static serializeBinaryToWriter(message: LoggedCastQueryRewrite, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoggedCastQueryRewrite;
  static deserializeBinaryFromReader(message: LoggedCastQueryRewrite, reader: jspb.BinaryReader): LoggedCastQueryRewrite;
}

export namespace LoggedCastQueryRewrite {
  export type AsObject = {
    id: string,
    content?: LoggedCastQueryRewrite.LoggedCastQueryRewriteContent.AsObject,
  }

  export class LoggedCastQueryRewriteContent extends jspb.Message {
    getQuery(): string;
    setQuery(value: string): LoggedCastQueryRewriteContent;

    getContext(): string;
    setContext(value: string): LoggedCastQueryRewriteContent;

    getRewrittenQuery(): string;
    setRewrittenQuery(value: string): LoggedCastQueryRewriteContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoggedCastQueryRewriteContent.AsObject;
    static toObject(includeInstance: boolean, msg: LoggedCastQueryRewriteContent): LoggedCastQueryRewriteContent.AsObject;
    static serializeBinaryToWriter(message: LoggedCastQueryRewriteContent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoggedCastQueryRewriteContent;
    static deserializeBinaryFromReader(message: LoggedCastQueryRewriteContent, reader: jspb.BinaryReader): LoggedCastQueryRewriteContent;
  }

  export namespace LoggedCastQueryRewriteContent {
    export type AsObject = {
      query: string,
      context: string,
      rewrittenQuery: string,
    }
  }

}

export class LoggedCastSearcherSelection extends jspb.Message {
  getId(): string;
  setId(value: string): LoggedCastSearcherSelection;

  getContent(): LoggedCastSearcherSelection.LoggedCastSearcherSelectionContent | undefined;
  setContent(value?: LoggedCastSearcherSelection.LoggedCastSearcherSelectionContent): LoggedCastSearcherSelection;
  hasContent(): boolean;
  clearContent(): LoggedCastSearcherSelection;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoggedCastSearcherSelection.AsObject;
  static toObject(includeInstance: boolean, msg: LoggedCastSearcherSelection): LoggedCastSearcherSelection.AsObject;
  static serializeBinaryToWriter(message: LoggedCastSearcherSelection, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoggedCastSearcherSelection;
  static deserializeBinaryFromReader(message: LoggedCastSearcherSelection, reader: jspb.BinaryReader): LoggedCastSearcherSelection;
}

export namespace LoggedCastSearcherSelection {
  export type AsObject = {
    id: string,
    content?: LoggedCastSearcherSelection.LoggedCastSearcherSelectionContent.AsObject,
  }

  export class LoggedCastSearcherSelectionContent extends jspb.Message {
    getQuery(): string;
    setQuery(value: string): LoggedCastSearcherSelectionContent;

    getPassageIdList(): Array<string>;
    setPassageIdList(value: Array<string>): LoggedCastSearcherSelectionContent;
    clearPassageIdList(): LoggedCastSearcherSelectionContent;
    addPassageId(value: string, index?: number): LoggedCastSearcherSelectionContent;

    getPassageTextList(): Array<string>;
    setPassageTextList(value: Array<string>): LoggedCastSearcherSelectionContent;
    clearPassageTextList(): LoggedCastSearcherSelectionContent;
    addPassageText(value: string, index?: number): LoggedCastSearcherSelectionContent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoggedCastSearcherSelectionContent.AsObject;
    static toObject(includeInstance: boolean, msg: LoggedCastSearcherSelectionContent): LoggedCastSearcherSelectionContent.AsObject;
    static serializeBinaryToWriter(message: LoggedCastSearcherSelectionContent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoggedCastSearcherSelectionContent;
    static deserializeBinaryFromReader(message: LoggedCastSearcherSelectionContent, reader: jspb.BinaryReader): LoggedCastSearcherSelectionContent;
  }

  export namespace LoggedCastSearcherSelectionContent {
    export type AsObject = {
      query: string,
      passageIdList: Array<string>,
      passageTextList: Array<string>,
    }
  }

}

export enum ClientId { 
  NONSET = 0,
  EXTERNAL_APPLICATION = 1,
  LOG_REPLAYER = 2,
  WEB_SIMULATOR = 3,
}
export enum InteractionType { 
  NOTSET = 0,
  TEXT = 1,
  AUDIO = 2,
  ACTION = 3,
  STATUS = 4,
}
