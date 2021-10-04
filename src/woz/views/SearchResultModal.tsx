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

import * as React from "react"
import { Accordion, Button, Checkbox, Dimmer, Icon, Loader, Modal } from "semantic-ui-react"
import { API_ROOT_URL } from "../../common/config"
import { isStringImagePath, wordsTrim } from "../../common/util"
import { ButtonModel, ButtonOrigin, IButtonModel } from "../model/ButtonModel"
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
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section_id: this.props.clickedButton.id,
                index: this.props.clickedButton.buttonOrigin === ButtonOrigin.wikipedia ? 'wikipedia' : 'seriouseats'
            })
        };
        try {
            const response = await fetch(API_ROOT_URL + '/search/extract_page', requestOptions);
            const dataJson = await response.json();
            if (dataJson !== undefined && dataJson['errors'].length === 0) {
                const documents = dataJson['documents']
                this.setState({
                    modalResults: documents['sections'],
                    modalLoading: false
                })
            }

        } catch (error) {
            console.log(error)
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
                var paragraph_id = JSON.parse(JSON.stringify(par))['id']
                var paragraph_content = JSON.parse(JSON.stringify(par))['contents']

                // Create the ButtonModel associated to this paragraph. This is required as we will use
                // this in order to keep track of what has been clicked and what has been logged
                var paragraphButtonModel = new ButtonModel({
                    badges: {},
                    color: "",
                    id: paragraph_id,
                    label: wordsTrim(paragraph_content, 7),
                    tooltip: paragraph_content,
                    transitions: {},
                    buttonOrigin: this.props.clickedButton.buttonOrigin,
                    pageId: this.props.clickedButton.pageId,
                    paragraphId: paragraph_id,
                    pageTitle: this.props.clickedButton.pageTitle,
                    sectionTitle: section_title
                })

                // We need to decide whether we need to show an image or a selectable paragraph. 
                var paragraph_rendering = isStringImagePath(paragraph_content)
                    ? <img key={key} src={paragraph_content} className={css.modalImage} alt={paragraph_content}></img>
                    : <Checkbox key={key} label={paragraph_content} onChange={() => {
                        this.props.onParagraphClicked(paragraphButtonModel);
                    }}
                        defaultChecked={this.props.selectedButtons.filter(button => button.hashedId === paragraphButtonModel.hashedId).length === 1}
                        className={css.modalCheckBox}></Checkbox>

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