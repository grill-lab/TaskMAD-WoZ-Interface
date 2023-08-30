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
import { isStringImagePath, isStringVideoPath, objectMap } from "../common/util"
import { IButtonModel } from "../woz/model/ButtonModel"
import { IWozDataSource } from "../woz/model/Model"
import { SearchQueryModel } from "../woz/model/SearchQueryModel"
import { collectionLoading, WozCollection, WozCollectionState } from "../woz/views/WozCollection"
import css from "./App.module.css"
import { dataSourceForURL, IConfigurationEditorCallback } from "./ConfigurationEditor"
import { InteractionType } from "./connector/agent-dialogue/generated/client_pb"
import { WozConnectors } from "./connector/Connector"
import { LLMResponseData } from "./connector/agent-dialogue/ADConnector"
import { Store } from "./Store"
import { WoZWithCharCollection } from "./WoZWithChatCollection"
import {Message} from "../woz/model/MessageModel"
import { ExcelURLDataSource } from "../woz/provider/excel/ExcelURLDataSource"

type WOZ = "woz"
const WOZ: WOZ = "woz"
type CONFIG = "config"
const CONFIG: CONFIG = "config"

// tslint:disable-next-line:interface-name
export interface StringMap { [index: string]: string }

type AppState =
(
        {
            dataSource?: IWozDataSource
            kind: CONFIG
            wozState?: WozCollectionState
        }
    |
        {
            dataSource: IWozDataSource
            kind: WOZ
            wozState: WozCollectionState
        }
)
&
    {
        // Array used to keep track of clicked buttons
        selected_buttons: Array<IButtonModel>
        // String used to keep track of the text in the input field
        woz_message: string
        // Array used to keep track of anything the wizard typed in the search bar. 
        searched_queries: Array<SearchQueryModel>

        // new 
        params: StringMap
        topic_data: {}
        input_disabled: boolean
        llm_response_data: LLMResponseData
    }

// type definition for the JSON entries which define the list of available topics
type TopicMetadata = {
    id: string
    page_id: string
    page_title: string
}

// this is just to allow parsing the initial_wizard_message field
interface TopicDataInterface {
    initial_wizard_message: string
    steps_sentences_wizard: string[]
}

export default class App extends React.Component<{}, AppState> {

    private wozComponentRef: React.RefObject<WoZWithCharCollection>

    constructor(props: any) {
        super(props)
        this.state = {
            kind: CONFIG,
            selected_buttons: [],
            woz_message: "",
            searched_queries: [],
            params: {},
            topic_data: {},
            input_disabled: true,
            llm_response_data: new LLMResponseData()
        }

        localStorage.clear()

        // to allow referencing state of child component (not sure if this is the best way to do it!)
        this.wozComponentRef = React.createRef()

        // this callback is triggered when a request to the LLM API completes. The 
        // argument is an instance of LLMResponseData, which contains:
        //  - message (string): contains the LLM response text
        //  - role (string): either "assistant" or "system". This indicates if the text can be edited 
        //      before being sent (assistant) or must be sent unaltered (system)
        //  - stepNo (integer): used to trigger step changes (forward only?)
        WozConnectors.shared.selectedConnector.onLLMResponse = async (resp: LLMResponseData) => {
            console.log("Got an LLM response %o", resp)
            // if this is -1, it means the API returned an error and we should
            // just display the text given in resp, not update the step or anything else
            if(resp.stepNo === -1) {
                console.log("Handling invalid response in onLLMResponse")
                this.setState( { llm_response_data: resp, woz_message: resp.message, input_disabled: false })
                return;
            }

            // at this point the response should be valid, so check if it includes a step change
            console.log("Handling valid LLM response");
            if(this.state.llm_response_data.stepNo !== resp.stepNo) {
                // step has changed, simulate clicking the "Next" button
                // TODO can only increase step number via API or not???
                console.log("Detected step increase in LLM response, old %o, new %o", this.state.llm_response_data.stepNo, resp.stepNo)
                this.onMessageSent(InteractionType.ACTION, ["step" + resp.stepNo])
            }
            this.setState(
                {
                    llm_response_data: resp,
                    // always want to insert the LLM response text into the text area immediately
                    woz_message: resp.message,
                    // only allowed to edit "assistant" messages, so set input_disabled
                    // to false if the role is different
                    input_disabled: resp.role !== "assistant",
                }
            )
        }

        // Callback triggered when an LLM API request is sent
        WozConnectors.shared.selectedConnector.onLLMRequest = () => {
            this.setState({woz_message: "[Please wait while a response is generated...]"});
        }
    }

    async componentDidMount () {
        // build map of URL parameters
        const params: {[index: string]: string} = {}
        new URL(window.location.href).searchParams.forEach((value, key) => {
            params[key] = value
        })

        // this is the new "topic" URL parameter, which is used in
        // place of a dropdown like in the chat UI
        Store.shared.topicName = params["topic"];

        // asynchronously load the external JSON file with topic names/IDs,
        // and then the other JSON file with the topic data. because this
        // data is required by the WoZWithChatCollection component, we are
        // awaiting the result instead of letting it run in the background
        await this.loadTopicData()

        const connectorID = params.connector
        if (connectorID !== undefined) {
            const connector = WozConnectors.shared.all.find((value) => (value.id === connectorID))
            if (connector !== undefined) {
                Store.shared.showChatTranscript = true
                WozConnectors.shared.selectedConnectorID = connectorID
                connector.connect(params).then((result) => {
                    if (result) {
                        // ignoring the "url" parameter now and just creating an empty datasource since it
                        // isn't actually used any more
                        this.setState(this._newState(new ExcelURLDataSource({url: ""}), params))
                    }
                }).catch((error: any) => {
                    console.error(error)
                })
            }
        }
    }

    public getTopicById = async (topicId: string): Promise<TopicDataInterface> => {
        // given a topic ID, retrieve the JSON file containing all the topic data
        // and return the entry for the selected ID
        const requestOptions = {
            method: 'GET',
            headers: { 'Origin': '*' },
        };

        var dataJson = undefined;
        try {
            const topics_url = process.env.REACT_APP_DATA_URL;
            const response = await fetch(topics_url as string, requestOptions);
            dataJson = await response.json();

            if (dataJson !== undefined && topicId in dataJson) {
                const td: TopicDataInterface = dataJson[topicId]['document']
                return td
            }
        } catch (error) {
            console.log('Recipe fetch error: %o', error);
        }

        return dataJson;
    }

    public getAllTopics = async (): Promise<TopicMetadata[]> => {
        // retrieves the list of available topics from a JSON file
        // at the indicated URL and returns the JSON data
        const requestOptions = {
            method: 'GET',
            headers: { 'Origin': '*' },
        };

        // TODO update RECIPE_URL name and change Dockerfile/build scripts
        var dataJson = undefined;
        try {
            const recipes_url = process.env.REACT_APP_RECIPE_URL;
            const response = await fetch(recipes_url as string, requestOptions);
            dataJson = await response.json();

            if (dataJson !== undefined) {
                return dataJson['recipes'];
            }

        } catch (error) {
            console.log("URL %o", process.env.REACT_APP_RECIPE_URL)
                console.log('Recipe fetch error: %o', error);
        }

        return dataJson;
    }


    public async loadTopicData() {
        // loads selected topic data based on the topic name supplied in a URL parameter
        let topicMetadata = await this.getAllTopics()
        let topicId = "-1";

        // iterate over the array of JSON entries containing topic IDs and titles
        topicMetadata.every((value: TopicMetadata) => {
            // if the URL parameter matches the title of the current topic, 
            // retrieve the corresponding ID and return false to stop iterating
            if(Store.shared.topicName === value["page_title"]) {
                topicId = value["id"]
                return false
            }
            return true
        })

        let data = await this.getTopicById(topicId)
        console.log("Loaded topic data %o", data)

        // store the data in the state for this component (it's then passed down
        // to the WoZWithChatCollection component via props)
        this.setState({topic_data: data, woz_message: data["initial_wizard_message"], input_disabled: true})
    }

    private _newState = (dataSource: IWozDataSource, params: StringMap): AppState => {
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
            params: params,
            topic_data: this.state.topic_data,
            input_disabled: this.state.input_disabled,
            llm_response_data: this.state.llm_response_data,
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

        const query = objectMap(props, ([key, value]) => key + "=" + encodeURIComponent(value.toString())).join("&")

        const url = window.location.href + "?" + query
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
            }
        })
    }

    // Function used in order to handle clicks on buttons. 
    private onButtonClick = (buttonClicked: IButtonModel) => {

        // Keep track of when this button has been clicked
        buttonClicked.clickedTimestamp = new Date();

        // If the button clicked is an image or a video then we simply send the message
        if(isStringImagePath(buttonClicked.tooltip) || isStringVideoPath(buttonClicked.tooltip)){
            WozConnectors.shared.selectedConnector.onButtonClickLogger(buttonClicked, this.state.selected_buttons, this.state.searched_queries);
            this.onRevert();
            return
        }
        if (buttonClicked !== undefined) {
            // If the button clicked is already in our state then it means that we want to remove it (toggle the button)
            if ((this.state.selected_buttons.filter(button => button.hashedId === buttonClicked.hashedId)).length === 1) {
                this.setState({
                    selected_buttons: this.state.selected_buttons.filter(button => {
                        return button.hashedId !== buttonClicked.hashedId;
                    })
                });
            } else {
                // Otherwise, simply add the button to our state
                this.state.selected_buttons.push(buttonClicked);
                this.setState({
                    selected_buttons: this.state.selected_buttons,
                    woz_message: this.state.woz_message + ' ' + buttonClicked.tooltip
                });
            }
        }    
    }

    // Sends a message to the backend. By default the interaction type is text and there are no actions
    // associated. Note that this may be triggered by the Previous/Next buttons too, in which case
    // the InteractionType will be ACTION
    private onMessageSent = (interactionType?: InteractionType, actions?: Array<string>) => {
        // if it's not the wizard's turn to send a message, it should be 
        // blocked here. this is done by checking the state of the child component.
        // this only applies for TEXT messages, STATUS/ACTION messages are fine
        if(interactionType === InteractionType.TEXT && this.wozComponentRef.current !== null) {
            if(this.wozComponentRef.current.state.lastMessageFromUser) {
                console.log("last message from user, able to send")
            } else {
                console.log("last message from agent, not sending! type %o", interactionType)
                alert("Can't send a message until the user replies")
                return
            }
        }
        const value = this.state.woz_message.trim()
        if ((value.length > 0 && interactionType === InteractionType.TEXT) || (interactionType !== InteractionType.TEXT && actions!.length > 0)) {
            WozConnectors.shared.selectedConnector.onMessageSentLogger(value, this.state.selected_buttons, this.state.searched_queries, interactionType, actions);
        }
        this.onRevert();
    }


    // Simply resets the state
    private onRevert = () => {
        this.setState({woz_message: "", selected_buttons: [], searched_queries: []})
    }

    // Function used to detect when text in the input box changes
    private onInputBoxChange = (text: string) => {
        if(text.trim().length === 0){
            this.setState({selected_buttons: []})
        }
        this.setState({woz_message: text})
    }

    // Function used in order to keep track of the search queries
    private trackSearchedQueries = (query: string) => {

        // Convert the string to a SearchQueryModel to keep track of the searched timestamp
        let searchQuery = new SearchQueryModel({
            searchedQuery: query.trim(),
            searchTimestamp: new Date()
        });
        if(query !== undefined 
                && query.trim() !== '' 
                && this.state.searched_queries.findIndex(query => query.searchedQuery === searchQuery.searchedQuery) === -1) {
            this.state.searched_queries.push(searchQuery);
        }
    }

    public render() {
        if (window.localStorage === undefined) {
            log.error("local storage is not supported")
        }

        let content: any = null

        switch (this.state.kind) {
            case WOZ:
                    content = <WoZWithCharCollection
                        ref={this.wozComponentRef}
                        onBack={this.displayConfig}
                        initialState={this.state.wozState}
                        onButtonClick={this.onButtonClick}
                        selectedButtons={this.state.selected_buttons}
                        onParagraphClicked={this.onButtonClick}

                        onCopyURL={this.copyURL}
                        resultCount={8}
                        onMount={WozConnectors.shared.selectedConnector.onUIAppear}
                        onError={this.handleError}
                        onCommit={this.onMessageSent}
                        onChange={this.onInputBoxChange}
                        onRevert={this.onRevert}
                        wozMessage={this.state.woz_message}
                        trackSearchedQueries={this.trackSearchedQueries}
                        topicData={this.state.topic_data}
                        inputDisabled={this.state.input_disabled}
                        llmStepIndex={this.state.llm_response_data.stepNo}
                    />
                break
        }

        return (
                <div className={css.App}>
                    {content}
                </div>
               )
    }
}
