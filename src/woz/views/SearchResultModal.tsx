/* tslint:disable:interface-over-type-literal */
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
import { Accordion, Button, Checkbox, Dimmer, Embed, Icon, Loader, Modal } from "semantic-ui-react"
import { isStringImagePath, isStringVideoPath, styles, wordsTrim } from "../../common/util"
import { WozConnectors } from "../../woz-app/connector/Connector"
import { ButtonModel, IButtonModel } from "../model/ButtonModel"
import css from "./SearchResultModal.module.css"

interface ISearchResultModalProperties {
    onCancel: () => void
    clickedButton: IButtonModel
    onParagraphClicked: (buttonClicked: IButtonModel) => void
    selectedButtons: Array<IButtonModel>
}

interface ISearchResultModalState {
    modalResults: []
    activeIndexes: number[]
    modalLoading: boolean
}


export class SearchResultModal
    extends React.Component<ISearchResultModalProperties, ISearchResultModalState> {

    constructor(props: any) {
        super(props)
        this.state = { modalResults: [], activeIndexes: [], modalLoading: true }
    }

    public async componentDidMount() {

        // Perform a request and extract the page associated to the specific paragraph. 
        let apiResponse: Object = await WozConnectors.shared.selectedConnector.onAgentInteractionApiRequest(Struct.fromJavaScript({
            "service_name":"search_api",
            "api_endpoint": "page",
            "request_body": {
                "knowledge_source": this.props.clickedButton.buttonOriginEnumToString(),
                "section_id": this.props.clickedButton.id
            }
        }), "SearchAPI");


        // Check if the response returned something (and not a null object)
        if (apiResponse !== undefined && apiResponse.hasOwnProperty('errors') && apiResponse.hasOwnProperty('documents')) {
            let errors: string[] = Object.getOwnPropertyDescriptor(apiResponse, 'errors')?.value || [];
            if (errors.length === 0) {
                // Get the documents
                let documents: Object[] = Object.getOwnPropertyDescriptor(apiResponse, 'documents')?.value || [];
                this.setState({
                    modalResults: Object.getOwnPropertyDescriptor(documents, 'sections')?.value || [],
                    modalLoading: false
                })

            }
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

    // Function used to render the Modal's body
    private _renderModalBody(preselectedTab?: string) {
        const { activeIndexes, modalLoading } = this.state

        if (modalLoading) {
            return (<Dimmer active>
                <Loader>Loading</Loader>
            </Dimmer>)
        }

        let accordion_body = this.state.modalResults.map((el: object, counter) => {

            let section_title = Object.keys(el)[0]
            let section_paragraphs = Object.values(el)[0]

            if (preselectedTab === section_title && activeIndexes.indexOf(counter) === -1) {
                activeIndexes.push(counter)
            }

            let paragraphs = section_paragraphs.map((par: object, key: number) => {
                var anserini_id = JSON.parse(JSON.stringify(par))['id']
                var paragraph_id = JSON.parse(JSON.stringify(par))['hashed_id']
                var paragraph_content = JSON.parse(JSON.stringify(par))['contents']

                // Create the ButtonModel associated to this paragraph. This is required as we will use
                // this in order to keep track of what has been clicked and what has been logged
                var paragraphButtonModel = new ButtonModel({
                    badges: {},
                    color: "",
                    id: anserini_id,
                    label: wordsTrim(paragraph_content, 7),
                    tooltip: paragraph_content,
                    transitions: {},
                    buttonOrigin: this.props.clickedButton.buttonOrigin,
                    pageId: this.props.clickedButton.pageId,
                    paragraphId: paragraph_id,
                    pageTitle: this.props.clickedButton.pageTitle,
                    sourceUrl: this.props.clickedButton.sourceUrl,
                    sectionTitle: section_title
                })



                // We need to decide whether we need to show an image or a selectable paragraph. 
                // We also need to prehighlight the paragraph if the clicked one is the one returned from the API
                var highlightParagraph = this.props.clickedButton.hashedId === paragraphButtonModel.hashedId ? css.highlightParagraph : '';
                var paragraph_rendering = isStringImagePath(paragraph_content)
                    ? <img key={key} src={paragraph_content} className={css.modalImage} alt={paragraph_content}></img>
                    : isStringVideoPath(paragraph_content)
                        ? (<div className={css.videoSearchModalContainer}><Embed placeholder={this.props.clickedButton.tooltip.split('<video_separator>')[0]}
                            url={this.props.clickedButton.tooltip.split('<video_separator>')[1]}
                            className={css.modalSearchVideo}
                            iframe={{
                                allowFullScreen: true
                            }}></Embed></div>)
                        : (<Checkbox key={key} label={paragraph_content} onChange={() => {
                            this.props.onParagraphClicked(paragraphButtonModel);
                            console.log(paragraphButtonModel);
                            
                        }}
                            defaultChecked={this.props.selectedButtons.filter(button => button.hashedId === paragraphButtonModel.hashedId).length === 1}
                            className={styles(css.modalCheckBox, highlightParagraph)}></Checkbox>)

                return (paragraph_rendering)
            })

            return (<div key={counter}>
                <Accordion.Title
                    active={activeIndexes.indexOf(counter) !== -1}
                    index={counter}
                    onClick={this.onAccordionSectionClick}>
                    <Icon name='dropdown' />
                    {section_title}
                </Accordion.Title>
                <Accordion.Content active={activeIndexes.indexOf(counter) !== -1} key='5'>
                    {paragraphs}
                </Accordion.Content>
            </div>)


        });

        return (<Accordion fluid styled exclusive={false}>
            {accordion_body}
        </Accordion>)
    }

    public render() {
        return (
            <Modal
                dimmer={"blurring"}
                closeOnEscape={true}
                closeOnDimmerClick={true}
                onClose={this.props.onCancel}
                open={true}
                centered={false}
                size='large'
                className={css.modal}>
                <Modal.Header>{this.props.clickedButton.pageTitle}</Modal.Header>
                <Modal.Content>
                    {this._renderModalBody(this.props.clickedButton.sectionTitle)}
                </Modal.Content>
                <Modal.Actions>
                    <Button secondary content="Close" onClick={this.props.onCancel} />
                </Modal.Actions>
            </Modal>
        )
    }
}