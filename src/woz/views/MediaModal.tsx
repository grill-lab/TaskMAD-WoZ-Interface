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
import { Button, Embed, Modal } from "semantic-ui-react"
import { IButtonModel } from "../model/ButtonModel"
import css from "./MediaModal.module.css"

interface IMediaModalProperties {
    onCancel: () => void
    clickedButton: IButtonModel
    onButtonClicked: (buttonClicked: IButtonModel) => void

}

interface IMediaModalState {
}


export class MediaModal
    extends React.Component<IMediaModalProperties, IMediaModalState> {

    constructor(props: any) {
        super(props)
        this.state = { }
    }
    public render() {
        return (
            <Modal
                dimmer={"blurring"}
                closeOnEscape={true}
                closeOnDimmerClick={true}
                onClose={this.props.onCancel}
                open={true}
                centered={true}
                size='tiny'>
                <Modal.Header>{this.props.clickedButton.sectionTitle + ": Video"}</Modal.Header>
                <Modal.Content>
                   <Embed placeholder={this.props.clickedButton.tooltip.split('<video_separator>')[0]} 
                   url={this.props.clickedButton.tooltip.split('<video_separator>')[1]} 
                   autoplay={true} 
                   className={css.modalVideo}
                   iframe={{
                    allowFullScreen: true
                  }}></Embed>
                </Modal.Content>
                <Modal.Actions>
                    <Button secondary content="Close" onClick={this.props.onCancel} />
                    <Button primary content="Send" onClick={() => this.props.onButtonClicked(this.props.clickedButton)} />
                </Modal.Actions>
            </Modal>
        )
    }
}