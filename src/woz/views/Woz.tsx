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
import { arrayMap, isStringImagePath, isStringVideoPath } from "../../common/util"
import { ButtonOrigin, IButtonModel } from "../model/ButtonModel"
import { IPersistentRowModel } from "../model/RowModel"
import { IWozContext } from "../model/WozModel"
import { MediaModal } from "./MediaModal"
import { Row } from "./Row"
import { Screen } from "./Screen"
import { SearchResultModal } from "./SearchResultModal"
import { TemplateEditor } from "./TemplateEditor"
import css from "./woz.module.css"
import { ButtonClickCallback } from "./WozCollection"

interface IWozProperties {
  onButtonClick: ButtonClickCallback
  onScreenChange: (screenID: string) => void
  persistentRows: IPersistentRowModel[]
  woz: IWozContext
  selectedScreenID: string
  selectedButtons: Array<IButtonModel>
  onParagraphClicked: (buttnClicked: IButtonModel) => void
}

interface IWozState {
  buttonToExpand?: IButtonModel
  buttonSearchResultModal?: IButtonModel
  buttonMediaModal?: IButtonModel
}

export class Woz extends React.Component<IWozProperties, IWozState> {

  constructor(props: IWozProperties) {
    super(props)
    this.state = {}
  }

  private _handleClick = (buttonModel: IButtonModel) => {
    console.log(buttonModel);
    let targetID = buttonModel.transitions[this.props.selectedScreenID]
    if (targetID === undefined) {
      targetID = buttonModel.transitions._any
    }

    if (targetID !== undefined) {
      this.props.onScreenChange(targetID)
      return
    }

    if (buttonModel.tooltip.match(/##.*?##/)) {
      this.setState({ buttonToExpand: buttonModel })
    } else {
      // We need to trigger the action based on 2 cases:
      // 1) If the button comes from the search or if it is not an image, we need to show the modal 
      // 2) Otherwise, simple call the default OnButtonClick function 
      if (buttonModel.buttonOrigin !== ButtonOrigin.excel && !isStringImagePath(buttonModel.tooltip)) {
        this.setState({
          buttonSearchResultModal: buttonModel
        });
      } else {
        // In here we need to check whether the button is a media or not. If it's a video then we need to show 
        // the video modal 
        if (isStringVideoPath(buttonModel.tooltip)) {
          this.setState({
            buttonMediaModal: buttonModel
          });
        } else {
          this.props.onButtonClick(buttonModel)
        }

      }

    }
  }

  private _templateEditor = () => {
    if (this.state.buttonToExpand === undefined) {
      return null
    }

    return <TemplateEditor
      onCancel={() => this.setState({ buttonToExpand: undefined })}
      onConfirm={(newTooltip) => {
        const filledModel = Object
          .assign({}, this.state.buttonToExpand, newTooltip)
        this.props.onButtonClick(filledModel)
        this.setState({ buttonToExpand: undefined })
      }}
      onConfirmEdit={(newTooltip) => {
        if (newTooltip['tooltip'].trim() !== '') {
          const filledModel = Object
            .assign({}, this.state.buttonToExpand, newTooltip)
          this.props.onButtonClick(filledModel)
          this.setState({ buttonToExpand: undefined })
        }

      }}
      text={this.state.buttonToExpand.tooltip} />

  }

  // Function used in order to show the search modal on click. 
  private _showSearchResultModal() {
    if (this.state.buttonSearchResultModal !== undefined) {
      return <SearchResultModal onCancel={() => {
        this.setState({
          buttonSearchResultModal: undefined
        })
      }} clickedButton={this.state.buttonSearchResultModal}
        onParagraphClicked={this.props.onParagraphClicked}
        selectedButtons={this.props.selectedButtons} />
    }
    return;
  }

  // Function used in order to show the media modal on click
  private _showMediaModal() {
    if (this.state.buttonMediaModal !== undefined) {

      return <MediaModal onCancel={() => {
        this.setState({
          buttonMediaModal: undefined
        })
      }} clickedButton={this.state.buttonMediaModal} onButtonClicked={(bm: IButtonModel)=>{
        this.props.onButtonClick(bm);
        this.setState({
          buttonMediaModal: undefined
        })
      }}></MediaModal>

    }

    return;
  }

  private _handleEditButtonClick = (buttonModel: IButtonModel) => {
    this.setState({ buttonToExpand: buttonModel })
  }

  public render() {
    const extraRows = arrayMap(
      this.props.persistentRows,
      (row: IPersistentRowModel, index: number) => {
        return (
          <Row
            key={[row.label, row.id, index.toString()].join("-")}
            context={this.props.woz}
            buttons={row.buttons}
            rows={row.rows}
            label={row.label}
            index={index}
            onButtonClick={this._handleClick}
            onEditButtonClick={this._handleEditButtonClick}
            selectedButtons={this.props.selectedButtons}
          />
        )
      })

    return (
      <div className={css.scrollable}>
        <div>
          {extraRows}
          {this._showSearchResultModal()}
          {this._templateEditor()}
          {this._showMediaModal()}
          <Screen
            context={this.props.woz}
            identifier={this.props.selectedScreenID}
            onButtonClick={this._handleClick}
            onEditButtonClick={this._handleEditButtonClick}
            selectedButtons={this.props.selectedButtons} />
        </div>
      </div>
    )
  }
}
