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

import { Struct } from "google-protobuf/google/protobuf/struct_pb"
import * as React from "react"
import {
  Accordion,
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Icon,
  Input,
  Message,
} from "semantic-ui-react"
import { isStringImagePath, isStringVideoPath } from "../../common/util"
import { InteractionType } from "../../woz-app/connector/agent-dialogue/generated/client_pb"
import { WozConnectors } from "../../woz-app/connector/Connector"
import { Dialogue } from "../model/DialogueModel"
import css from "./WozHeaderTabs.module.css"

export interface IWozHeaderTabsProperties {
  dialogue?: Dialogue,
  onSearchResultClick: (
    issued_query?: string,
    passage_id?: string,
    passage_text?: string,
    passageSize?: string) => void,
  onQueryRewrite: (query: string, context: string, rewritten_query: string) => void,
}

interface IWozHeaderTabsState {
  activeIndexes: number[],
  activeIndexesSearcher: number[],
  queryRewriteInput: string
  apiRewrittentQuery: string,
  numberOfDocumentsInput: string,
  passageSizeInput: string,
  passageCountInput: string,
  searcherTypeInput: string,
  collectionInput: string,
  skipRerankInput: string,
  searcherQueryInput: string,
  queryRewriteLoading: boolean,
  searcherLoading: boolean,
  searcherResults?: Object[]
}

export class WozHeaderTabs extends React.Component<IWozHeaderTabsProperties, IWozHeaderTabsState>{

  dropDownOptions: any[] = [];
  dropdownSelected: number[] = [];

  searcherTypeOptions = [{
    key: 0,
    text: "sparse",
    value: 0
  }];
  collectionOptions = [{
    key: 0,
    text: "ALL",
    value: 0
  }];
  skipRerankOptions = [{
    key: 0,
    text: "false",
    value: 0
  },
  {
    key: 1,
    text: "true",
    value: 1
  }];
  constructor(props: any) {
    super(props)

    this.state = {
      activeIndexes: [],
      activeIndexesSearcher: [],
      queryRewriteInput: "",
      apiRewrittentQuery: "",
      searcherQueryInput: "",
      numberOfDocumentsInput: "50",
      passageSizeInput: "250",
      passageCountInput: "3",
      searcherTypeInput: "sparse",
      collectionInput: "ALL",
      skipRerankInput: "false",
      queryRewriteLoading: false,
      searcherLoading: false,
      searcherResults: undefined
    }


  }

  // Function used purely to manage the opening and closing of the accordion tabs
  private onAccordionSectionClick = (_e: any, titleProps: any) => {

    const { index } = titleProps
    const { activeIndexes } = this.state
    let newIndex = activeIndexes;

    let indexOfActiveTab = activeIndexes.indexOf(index)
    if (indexOfActiveTab !== -1) {
      newIndex.splice(indexOfActiveTab, 1);
    } else {
      newIndex.push(index)
    }

    this.setState({ activeIndexes: newIndex })
  }

  private onAccordionSearcherSectionClick = (_e: any, titleProps: any) => {

    const { index } = titleProps
    const { activeIndexesSearcher } = this.state
    let newIndex = activeIndexesSearcher;

    let indexOfActiveTab = activeIndexesSearcher.indexOf(index)
    if (indexOfActiveTab !== -1) {
      newIndex.splice(indexOfActiveTab, 1);
    } else {
      newIndex.push(index)
    }

    this.setState({ activeIndexesSearcher: newIndex })
  }

  private displaySearcherResults() {
    if (this.state.searcherResults !== undefined && this.state.searcherResults.length !== 0) {
      var accordionBody = this.state.searcherResults.map((obj, index) => {
        var accordionInnerBody = (Object.getOwnPropertyDescriptor(obj, "passages")?.value as Object[]).map((innerObj, innerIndex) => {
          var checkbox_id = `${Object.getOwnPropertyDescriptor(obj, "id")?.value}-${Object.getOwnPropertyDescriptor(innerObj, "id")?.value}-${this.state.passageSizeInput}`;
          return <div key={`${checkbox_id}_${innerIndex}`}>
            <Checkbox
              id={checkbox_id}
              key={checkbox_id}
              onClick={(_, value) => {
                this.props.onSearchResultClick(this.state.searcherQueryInput, checkbox_id, value.label?.toString(), this.state.passageSizeInput);
              }}
              label={Object.getOwnPropertyDescriptor(innerObj, "body")?.value}></Checkbox>
            <Divider></Divider></div>
        });

        var section_title = Object.getOwnPropertyDescriptor(obj, "title")?.value + " - " + Object.getOwnPropertyDescriptor(obj, "id")?.value;
        return <div key={`${section_title}_${index}`}><Accordion.Title
          active={this.state.activeIndexesSearcher.indexOf(index) !== -1}
          index={index}
          onClick={this.onAccordionSearcherSectionClick}
        >
          <Icon name="dropdown" />
          {section_title}
        </Accordion.Title>
          <Accordion.Content active={this.state.activeIndexesSearcher.indexOf(index) !== -1}>
            {accordionInnerBody}
          </Accordion.Content>
        </div>

      });
      return <Accordion fluid styled>{accordionBody}</Accordion>
    } else {
      return null;
    }
  }






  public render() {

    if (this.props.dialogue !== undefined) {

      this.dropDownOptions = this.props.dialogue.messages.map((message, i) => {

        if (message.messageType === InteractionType.TEXT && !isStringImagePath(message.text) && !isStringVideoPath(message.text)) {
          if (this.dropdownSelected.includes(i) === false) {
            if (this.dropdownSelected.length >= 6) {
              this.dropdownSelected.shift();
            }
            this.dropdownSelected.push(i);

          }
          return { key: i, text: message.text, value: i }
        }
        return undefined;
      }).filter(el => el !== undefined);
    }


    return <div className={css.maindiv}>
      <Accordion fluid styled>
        <Accordion.Title
          active={this.state.activeIndexes.indexOf(0) !== -1}
          index={0}
          onClick={this.onAccordionSectionClick}
        >
          <Icon name="dropdown" />
          Query Rewriting
        </Accordion.Title>
        <Accordion.Content active={this.state.activeIndexes.indexOf(0) !== -1}>
          <Input
            icon={{ name: 'search', circular: true, link: true }}
            placeholder='Query...'
            className={css.tabInputStyle}

            fluid={true}
            value={this.state.queryRewriteInput}
            onChange={(value) => {
              this.setState({
                queryRewriteInput: value.target.value
              });
            }}
          />
          <Dropdown
            placeholder='Context'
            fluid
            multiple
            search
            selection
            options={this.dropDownOptions}
            className={css.multiDropdownStyle}
            onChange={(_, data) => {
              this.dropdownSelected = data.value as [];
            }}
            defaultValue={this.dropdownSelected}
          />
          <Button compact color='green' loading={this.state.queryRewriteLoading} onClick={async () => {
            this.setState({
              queryRewriteLoading: true
            });
            var context_string = "";

            for (var i = 0; i < this.dropdownSelected.length; i++) {
              for (var j = 0; j < this.dropDownOptions.length; j++) {
                if (this.dropdownSelected[i] === this.dropDownOptions[j].key) {
                  context_string += this.dropDownOptions[j].text + " ||| "
                }
              }

            }

            let apiResponse: Object = await WozConnectors.shared.selectedConnector.onAgentInteractionApiRequest(Struct.fromJavaScript({
              "service_name": "cast_api_searcher",
              "api_endpoint": "rewrite",
              "request_body": {
                "rewriter": "T5",
                "searchQuery": this.state.queryRewriteInput,
                "context": context_string,
                "turnsToUse": "raw"
              }
            }), "SearchAPI");
            if (apiResponse !== undefined && apiResponse.hasOwnProperty('rewrite')) {
              this.setState({
                apiRewrittentQuery: Object.getOwnPropertyDescriptor(apiResponse, "rewrite")?.value
              });
            }

            this.props.onQueryRewrite(this.state.queryRewriteInput, context_string, this.state.apiRewrittentQuery);

            this.setState({
              queryRewriteLoading: false,
              queryRewriteInput: ""
            });
          }}>Rewrite Query</Button>

          <Message positive style={{ display: this.state.apiRewrittentQuery !== "" ? 'block' : "none" }}>
            <Message.Header>Rewrittent Query</Message.Header>
            <p>
              {this.state.apiRewrittentQuery}
            </p>
          </Message>
        </Accordion.Content>



        <Accordion.Title
          active={this.state.activeIndexes.indexOf(1) !== -1}
          index={1}
          onClick={this.onAccordionSectionClick}
        >

          <Icon name='dropdown' />
          Searcher
        </Accordion.Title>
        <Accordion.Content active={this.state.activeIndexes.indexOf(1) !== -1}>
          <Input
            placeholder='Searcher Query Input'
            className={css.tabInputStyle}
            style={{ "margin": "10px 0 10px 0" }}
            fluid={true}
            value={this.state.searcherQueryInput}
            onChange={(value) => {
              this.setState({
                searcherQueryInput: value.target.value
              });
            }}
          />
          <Input
            placeholder='Number of Documents'
            className={css.tabInputStyle}
            style={{ "margin": "10px 0 10px 0" }}
            fluid={true}
            value={this.state.numberOfDocumentsInput}
            onChange={(value) => {
              this.setState({
                numberOfDocumentsInput: value.target.value
              });
            }}
          />
          <Input
            placeholder='Passage Size'
            className={css.tabInputStyle}
            style={{ "margin": "10px 0 10px 0" }}
            fluid={true}
            value={this.state.passageSizeInput}
            onChange={(value) => {
              this.setState({
                passageSizeInput: value.target.value
              });
            }}
          />
          <Input
            placeholder='Passage Count'
            className={css.tabInputStyle}
            style={{ "margin": "10px 0 10px 0" }}
            fluid={true}
            value={this.state.passageCountInput}
            onChange={(value) => {
              this.setState({
                passageCountInput: value.target.value
              });
            }}
          />
          <Dropdown
            placeholder='Searcher Type'
            fluid
            search
            selection
            options={this.searcherTypeOptions}
            className={css.multiDropdownStyle}
            onChange={(value) => {
              this.setState({
                searcherTypeInput: value.currentTarget.textContent!,
              })
            }}
            defaultValue={0}
          />
          <Dropdown
            placeholder='Collection'
            fluid
            search
            selection
            options={this.collectionOptions}
            className={css.multiDropdownStyle}
            onChange={(value) => {
              this.setState({
                collectionInput: value.currentTarget.textContent!,
              })
            }}
            defaultValue={0}
          />
          <Dropdown
            placeholder='Skip Rerank'
            fluid
            search
            selection
            options={this.skipRerankOptions}
            className={css.multiDropdownStyle}
            onChange={(value) => {
              this.setState({
                skipRerankInput: value.currentTarget.textContent!,
              })
            }}
            defaultValue={0}
          />

          <Button compact color='green' loading={this.state.searcherLoading} onClick={async () => {
            this.setState({
              searcherLoading: true
            });
            let apiResponse: Object = await WozConnectors.shared.selectedConnector.onAgentInteractionApiRequest(Struct.fromJavaScript({
              "service_name": "cast_api_searcher",
              "api_endpoint": "search",
              "request_type": "GET",
              "request_body": {
                "query": this.state.searcherQueryInput,
                "numDocs": this.state.numberOfDocumentsInput,
                "passageSize": this.state.passageSizeInput,
                "passageCount": this.state.passageCountInput,
                "searcherType": this.state.searcherTypeInput,
                "collection": this.state.collectionInput,
                "skipRerank": this.state.skipRerankInput,

              }
            }), "SearchAPI");

            if (apiResponse !== undefined && apiResponse.hasOwnProperty('documents')) {
              this.setState({
                searcherResults: Object.getOwnPropertyDescriptor(apiResponse, "documents")?.value
              });
            }

            this.setState({
              searcherLoading: false
            });
          }}>Search</Button>

          {this.displaySearcherResults()}



        </Accordion.Content>

      </Accordion>
    </div >
  }

}
