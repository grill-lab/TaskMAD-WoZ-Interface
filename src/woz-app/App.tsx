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

import * as React from "react"
import { log } from "../common/Logger"
import { generateHashString, isStringImagePath, isStringVideoPath, objectMap } from "../common/util"
import { IButtonModel } from "../woz/model/ButtonModel"
import { IWozDataSource } from "../woz/model/Model"
import { SearchQueryModel } from "../woz/model/SearchQueryModel"
import {
  collectionLoading,
  WozCollection,
  WozCollectionState,
} from "../woz/views/WozCollection"
// import logo from "./logo.svg";
import css from "./App.module.css"
import {
  ConfigurationEditor,
  dataSourceForURL,
  IConfigurationEditorCallback,
} from "./ConfigurationEditor"
import { InteractionType } from "./connector/agent-dialogue/generated/client_pb"
import { WozConnectors } from "./connector/Connector"
import { DataSources } from "./DataSource"
import { Store } from "./Store"
import { WoZWithCharCollection } from "./WoZWithChatCollection"

type WOZ = "woz"
const WOZ: WOZ = "woz"
type CONFIG = "config"
const CONFIG: CONFIG = "config"

type AppState =
  ({
    dataSource?: IWozDataSource,
    kind: CONFIG,
    wozState?: WozCollectionState,
  }
    |
  {
    dataSource: IWozDataSource,
    kind: WOZ,
    wozState: WozCollectionState,
  })
  &
  {

    // Array used to keep track of clicked buttons
    selected_buttons: Array<IButtonModel>
    // String used to keep track of the text in the input field
    woz_message: string
    // Array used to keep track of anything the wizard typed in the search bar. 
    searched_queries: Array<SearchQueryModel>
    selected_api_paragraphs: Map<string, Map<string, string | string[]>>
    api_query_rewritten: Map<string, Map<string, string>>
  }


// tslint:disable-next-line:interface-name
export interface StringMap { [index: string]: string }

export default class App extends React.Component<{}, AppState> {

  constructor(props: any) {
    super(props)
    this.state = {
      kind: CONFIG,
      selected_buttons: [],
      woz_message: "",
      searched_queries: [],
      selected_api_paragraphs: new Map(),
      api_query_rewritten: new Map()
    }

    localStorage.clear()

    const params: StringMap = {}

    new URL(window.location.href)
      .searchParams.forEach((value, key) => {
        params[key] = value
      })

    const dataSource = DataSources.shared.selectedDataSource

    const dataSourceURL = params.url
    if (dataSourceURL !== undefined) {
      const urlDataSource = dataSourceForURL(dataSourceURL)
      if (urlDataSource !== undefined) {
        const connectorID = params.connector
        if (connectorID !== undefined) {
          const connector = WozConnectors
            .shared.all.find((value) => (value.id === connectorID))
          if (connector !== undefined) {
            Store.shared.generateScreenNavigation =
              (params.generateScreenNavigation || "true")
                .toLowerCase() === "true"
            Store.shared.showChatTranscript =
              (params.showChatTranscript ||
                (connectorID === "ADConnector" ? "true" : "false"))
                .toLowerCase() === "true"
            WozConnectors.shared.selectedConnectorID = connectorID
            connector.connect(params)
              .then((result) => {
                // console.log(result)
                if (result) {
                  this.setState(this._newState(urlDataSource))
                }
              }).catch((error: any) => {
                console.error(error)
              })
          }
        }
      }
    }

    this.state = this._newState(dataSource)
  }

  private _newState = (dataSource: IWozDataSource | undefined): AppState => {
    if (dataSource !== undefined) {
      return {
        dataSource,
        kind: WOZ,
        wozState: collectionLoading(
          {
            dataSource,
            options: {
              generateTabs: Store.shared.generateScreenNavigation,
            },
          }),
        selected_buttons: this.state.selected_buttons,
        woz_message: this.state.woz_message,
        searched_queries: this.state.searched_queries,
        selected_api_paragraphs: this.state.selected_api_paragraphs,
        api_query_rewritten: this.state.api_query_rewritten
      }
    } else {
      return {
        kind: CONFIG,
        selected_buttons: this.state.selected_buttons,
        woz_message: this.state.woz_message,
        searched_queries: this.state.searched_queries,
        selected_api_paragraphs: this.state.selected_api_paragraphs,
        api_query_rewritten: this.state.api_query_rewritten
      }
    }
  }

  private displayConfig = (wozState: WozCollectionState) => {
    this.setState((prev) => {
      return {
        dataSource: prev.dataSource,
        kind: CONFIG,
        wozState,
      }
    })
  }

  private copyURL = (currentWoz: string) => {
    const props = {
      currentWoz,
      generateScreenNavigation: Store.shared.generateScreenNavigation,
      showChatTranscript: Store.shared.showChatTranscript,
      ...WozConnectors.shared.selectedConnector.props,
      ...(this.state.dataSource !== undefined) ? this.state.dataSource.props : {},
    }

    const query = objectMap(
      props, ([key, value]) => key + "=" + encodeURIComponent(value.toString()))
      .join("&")

    const url = window.location.href + "?" + query

    // console.log(url)

    const textArea = document.createElement("textarea")
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      // const successful =
      document.execCommand("copy")
      // const msg = successful ? "successful" : "unsuccessful"
      // console.log("Fallback: Copying text command was " + msg)
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err)
    }

    document.body.removeChild(textArea)
  }

  private displayWoz = (callback: IConfigurationEditorCallback) => {
    this.setState({
      dataSource: callback.dataSource,
      kind: WOZ,
      wozState: callback.wozState,
    })
  }

  private handleError = () => {
    this.setState((prev) => {
      return {
        dataSource: prev.dataSource,
        kind: CONFIG,
        wozState: undefined,
      }
    })
  }


  // Function used in order to handle clicks on buttons. 
  private onButtonClick = (buttonClicked: IButtonModel) => {

    // Keep track of when this button has been clicked
    buttonClicked.clickedTimestamp = new Date();

    // If the button clicked is an image or a video then we simply send the message
    if (isStringImagePath(buttonClicked.tooltip) || isStringVideoPath(buttonClicked.tooltip)) {
      WozConnectors.shared.selectedConnector.onButtonClickLogger(buttonClicked, this.state.selected_buttons, this.state.searched_queries);
      this.onRevert();
      return
    }
    if (buttonClicked !== undefined) {
      // If the button clicked is already in our state then it means that we want to remove it (toggle the button)
      if ((this.state.selected_buttons.filter(button => button.hashedId === buttonClicked.hashedId)).length === 1) {
        this.setState(
          {
            selected_buttons: this.state.selected_buttons.filter(button => {
              return button.hashedId !== buttonClicked.hashedId;
            })
          });
      } else {
        // Otherwise, simply add the button to our state
        this.state.selected_buttons.push(buttonClicked);
        this.setState(
          {
            selected_buttons: this.state.selected_buttons,
            woz_message: this.state.woz_message + ' ' + buttonClicked.tooltip
          });
      }
    }
  }

  private onSearchResultClick = (
    issued_query?: string,
    passage_id?: string,
    passage_text?: string,
    passageSize?: string) => {

    if (issued_query !== undefined && issued_query.length !== 0 &&
      passage_id !== undefined && passage_id.length !== 0 &&
      passage_text !== undefined && passage_text.length !== 0 &&
      passageSize !== undefined && passageSize.length !== 0) {

      var map_key: string = `${issued_query.toLowerCase().replace(" ", "_")}_${passageSize}`;
      if (this.state.selected_api_paragraphs.has(map_key)) {
        if (this.state.selected_api_paragraphs.get(map_key)?.get('passage_id')?.includes(passage_id)) {
          this.state.selected_api_paragraphs.get(map_key)?.set('passage_id',
            (this.state.selected_api_paragraphs.get(map_key)?.get('passage_id') as []).filter(id => {
              return id !== passage_id;
            }))

        } else {
          this.state.selected_api_paragraphs.get(map_key)?.set('passage_id', [...this.state.selected_api_paragraphs.get(map_key)?.get('passage_id') as [], passage_id])
        }

      } else {
        var tempMap = new Map();
        tempMap.set('query', issued_query);
        tempMap.set("passage_id", [passage_id])
        this.state.selected_api_paragraphs.set(map_key, tempMap);

      }

      this.setState(
        {
          woz_message: `${this.state.woz_message} ${passage_text}`,
          selected_api_paragraphs: this.state.selected_api_paragraphs
        });
    }
    console.log(this.state.selected_api_paragraphs);
  }

  private onQueryRewrite = (query: string, context: string, rewritten_query: string) => {
    if (query !== undefined && query.length !== 0 &&
      context !== undefined && context.length !== 0 &&
      rewritten_query !== undefined && rewritten_query.length !== 0) {
      var unique_id = generateHashString(`${query}${context}${rewritten_query}`);
      if (!this.state.api_query_rewritten.has(unique_id)) {
        var tempMap = new Map();
        tempMap.set("query", query);
        tempMap.set("context", context);
        tempMap.set("rewritten_query", rewritten_query);

        this.state.api_query_rewritten.set(unique_id, tempMap);

        this.setState({
          api_query_rewritten: this.state.api_query_rewritten
        })
      }
    }

    console.log(this.state.api_query_rewritten);

  }

  // Sends a message to the backend. By default the interaction type is text and there are no actions
  // associated
  private onMessageSent = (interactionType?: InteractionType, actions?: Array<string>) => {
    const value = this.state.woz_message.trim()

    if ((value.length > 0 && interactionType === InteractionType.TEXT) || (interactionType !== InteractionType.TEXT && actions!.length > 0)) {
      WozConnectors.shared.selectedConnector.onMessageSentLogger(value, this.state.selected_buttons, this.state.searched_queries, interactionType, actions);
    }
    this.onRevert();
  }


  // Simply resets the state
  private onRevert = () => {
    this.setState({ woz_message: "", selected_buttons: [], searched_queries: [] })
  }

  // Function used to detect when text in the input box changes
  private onInputBoxChange = (text: string) => {
    if (text.trim().length === 0) {
      this.setState({ selected_buttons: [] })
    }
    this.setState({ woz_message: text })
  }

  // Function used in order to keep track of the search queries
  private trackSearchedQueries = (query: string) => {

    // Convert the string to a SearchQueryModel to keep track of the searched timestamp
    let searchQuery = new SearchQueryModel({
      searchedQuery: query.trim(),
      searchTimestamp: new Date()
    });
    if (query !== undefined
      && query.trim() !== ''
      && this.state.searched_queries.findIndex(query => query.searchedQuery === searchQuery.searchedQuery) === -1) {
      this.state.searched_queries.push(searchQuery);
    }

  }

  public render() {
    if (window.localStorage === undefined) {
      log.error("local storage is not supported")
    }
    // log.debug("local storage is supported: ", window.localStorage);

    let content: any = null

    switch (this.state.kind) {
      case CONFIG:
        content = <ConfigurationEditor
          dataSource={this.state.dataSource}
          wozState={this.state.wozState}
          onCommit={this.displayWoz} />
        break
      case WOZ:
        if (Store.shared.showChatTranscript) {
          content = <WoZWithCharCollection
            onBack={this.displayConfig}
            onCopyURL={this.copyURL}
            initialState={this.state.wozState}
            resultCount={8}
            onButtonClick={this.onButtonClick}
            onMount={WozConnectors.shared.selectedConnector.onUIAppear}
            onError={this.handleError}
            selectedButtons={this.state.selected_buttons}
            onCommit={this.onMessageSent}
            onChange={this.onInputBoxChange}
            onRevert={this.onRevert}
            wozMessage={this.state.woz_message}
            onParagraphClicked={this.onButtonClick}
            trackSearchedQueries={this.trackSearchedQueries}
            onSearchResultClick={this.onSearchResultClick}
            onQueryRewrite={this.onQueryRewrite}
          />
        } else {
          content = <WozCollection
            onBack={this.displayConfig}
            onCopyURL={this.copyURL}
            initialState={this.state.wozState}
            resultCount={8}
            onButtonClick={this.onButtonClick}
            onMount={WozConnectors.shared.selectedConnector.onUIAppear}
            onError={this.handleError}
            selectedButtons={this.state.selected_buttons}
            onCommit={this.onMessageSent}
            onChange={this.onInputBoxChange}
            onRevert={this.onRevert}
            wozMessage={this.state.woz_message}
            onParagraphClicked={this.onButtonClick}
            trackSearchedQueries={this.trackSearchedQueries}
            onSearchResultClick={this.onSearchResultClick}
            onQueryRewrite={this.onQueryRewrite} />
        }
        break
    }

    return (
      <div className={css.App}>
        {content}
      </div>
    )
  }
}
